import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, CreditCard, KeyRound, Plus, Save, Trash2, Waves } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BotPicker } from '@/components/common/BotPicker';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { MetricCard } from '@/components/common/MetricCard';
import { PageHeader } from '@/components/common/PageHeader';
import { SecretField } from '@/components/common/SecretField';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/resources';
import type { Bot as BotType, Integration } from '@/lib/types';

const INTEGRATION_PROVIDER_OPTIONS = {
  stt: [
    { value: 'openai_whisper', label: 'openai_whisper' },
    { value: 'whisper', label: 'whisper' },
  ],
  embeddings: [
    { value: 'openai', label: 'openai' },
  ],
  payments: [
    { value: 'mercadopago', label: 'mercadopago' },
  ],
} as const;

type IntegrationKind = keyof typeof INTEGRATION_PROVIDER_OPTIONS;

const llmSchema = z.object({
  llmProvider: z.enum(['openai', 'anthropic', 'google', 'mistral']),
  llmModel: z.string().min(1),
  llmApiKey: z.string().optional(),
});

const integrationSchema = z.object({
  kind: z.string().min(1),
  provider: z.string().min(1),
  apiKey: z.string().min(1),
});

const integrationUpdateSchema = z.object({
  status: z.enum(['active', 'inactive']),
  apiKey: z.string().optional(),
});

type LlmValues = z.infer<typeof llmSchema>;
type IntegrationValues = z.infer<typeof integrationSchema>;
type IntegrationUpdateValues = z.infer<typeof integrationUpdateSchema>;

function defaultProviderForKind(kind: IntegrationKind) {
  return INTEGRATION_PROVIDER_OPTIONS[kind][0].value;
}

export function ProvidersPage() {
  const queryClient = useQueryClient();
  const botsQuery = useQuery({ queryKey: ['bots'], queryFn: api.bots });
  const [botId, setBotId] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const botQuery = useQuery({ queryKey: ['bot', botId], queryFn: () => api.bot(botId), enabled: Boolean(botId) });
  const integrationsQuery = useQuery({ queryKey: ['integrations', botId], queryFn: () => api.integrations(botId), enabled: Boolean(botId) });

  useEffect(() => {
    if (!botId && botsQuery.data?.[0]) setBotId(botsQuery.data[0].id);
  }, [botId, botsQuery.data]);

  const llmForm = useForm<LlmValues>({
    resolver: zodResolver(llmSchema),
    values: {
      llmProvider: botQuery.data?.llmProvider ?? 'openai',
      llmModel: botQuery.data?.llmModel ?? '',
      llmApiKey: '',
    },
  });
  const integrationForm = useForm<IntegrationValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues: { kind: 'stt', provider: defaultProviderForKind('stt'), apiKey: '' },
  });
  const integrationUpdateForm = useForm<IntegrationUpdateValues>({
    resolver: zodResolver(integrationUpdateSchema),
    values: { status: selectedIntegration?.status === 'active' ? 'active' : 'inactive', apiKey: '' },
  });
  const selectedKind = integrationForm.watch('kind') as IntegrationKind;
  const providerOptions = INTEGRATION_PROVIDER_OPTIONS[selectedKind] ?? INTEGRATION_PROVIDER_OPTIONS.stt;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bots'] });
    queryClient.invalidateQueries({ queryKey: ['bot', botId] });
    queryClient.invalidateQueries({ queryKey: ['integrations', botId] });
  };

  const updateLlm = useMutation({
    mutationFn: (values: LlmValues) => api.updateBot(botId, removeEmpty(values)),
    onSuccess: invalidate,
  });
  const createIntegration = useMutation({
    mutationFn: (values: IntegrationValues) => api.createIntegration(botId, values),
    onSuccess: () => {
      integrationForm.reset({ kind: 'stt', provider: defaultProviderForKind('stt'), apiKey: '' });
      invalidate();
    },
  });
  const updateIntegration = useMutation({
    mutationFn: (values: IntegrationUpdateValues) => api.updateIntegration(botId, selectedIntegration!.id, removeEmpty(values)),
    onSuccess: invalidate,
  });
  const deleteIntegration = useMutation({
    mutationFn: (integrationId: string) => api.deleteIntegration(botId, integrationId),
    onSuccess: () => {
      setSelectedIntegration(null);
      invalidate();
    },
  });

  const bots = botsQuery.data ?? [];
  const configured = bots.filter((bot) => bot.llmApiKeySet).length;
  const integrations = integrationsQuery.data ?? [];
  const selectedBot = botQuery.data as BotType | undefined;
  const paymentIntegrations = integrations.filter((row) => row.kind === 'payments').length;
  const sttIntegrations = integrations.filter((row) => row.kind === 'stt').length;

  const columns = useMemo(
    () => [
      { key: 'kind', header: 'Kind', render: (row: Integration) => <button className="font-medium text-primary hover:underline" onClick={() => setSelectedIntegration(row)}>{row.kind}</button> },
      { key: 'provider', header: 'Provider', render: (row: Integration) => row.provider },
      { key: 'status', header: 'Estado', render: (row: Integration) => <StatusBadge status={row.status} /> },
      { key: 'secret', header: 'Credencial', render: () => <SecretField isSet label="API key" /> },
      {
        key: 'actions',
        header: '',
        render: (row: Integration) => (
          <ConfirmDialog
            title="Eliminar integration"
            description="El backend descarta las credenciales cifradas de esta integration."
            confirmLabel="Eliminar"
            destructive
            onConfirm={() => deleteIntegration.mutateAsync(row.id)}
          >
            <Button size="sm" variant="outline" type="button"><Trash2 className="h-4 w-4" /> Eliminar</Button>
          </ConfirmDialog>
        ),
      },
    ],
    [deleteIntegration],
  );

  useEffect(() => {
    const currentProvider = integrationForm.getValues('provider');
    if (!providerOptions.some((option) => option.value === currentProvider)) {
      integrationForm.setValue('provider', providerOptions[0].value, { shouldValidate: true });
    }
  }, [integrationForm, providerOptions, selectedKind]);

  return (
    <>
      <PageHeader
        title="Credenciales / Providers"
        description="Gestiona LLM BYO e integrations auxiliares por agente. Las API keys se escriben y rotan; nunca se leen desde el frontend."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="LLM keys configuradas" value={`${configured}/${bots.length}`} icon={KeyRound} />
        <MetricCard title="Integrations" value={integrations.length} icon={Waves} />
        <MetricCard title="Pagos" value={paymentIntegrations} icon={CreditCard} />
        <MetricCard title="Agente seleccionado" value={selectedBot?.name ?? 'n/a'} detail={selectedBot?.llmProvider ?? 'sin provider'} icon={Bot} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Agente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <BotPicker value={botId} onChange={setBotId} />
              {selectedBot ? (
                <div className="space-y-3 rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>{selectedBot.llmProvider ?? 'provider sin definir'}</span>
                    <SecretField isSet={selectedBot.llmApiKeySet} label="LLM key" />
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedBot.llmModel ?? 'modelo sin definir'}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Resumen de credenciales</CardTitle></CardHeader>
            <CardContent>
              {selectedBot ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{selectedBot.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedBot.locale} · {selectedBot.llmProvider ?? 'sin provider'}</p>
                    </div>
                    <StatusBadge status={selectedBot.status} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <p className="text-xs uppercase text-muted-foreground">STT</p>
                      <p className="mt-2 text-xl font-semibold">{sttIntegrations}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Payments</p>
                      <p className="mt-2 text-xl font-semibold">{paymentIntegrations}</p>
                    </div>
                  </div>
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    Esta vista concentra configuración sensible. El objetivo es ver de un vistazo qué integración tiene el bot y qué credencial sigue pendiente.
                  </div>
                </div>
              ) : (
                <EmptyState title="Selecciona un agente" description="Aquí verás su contexto de credenciales antes de rotar o crear integrations." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>LLM provider</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-[180px_1fr_1fr_auto]" onSubmit={llmForm.handleSubmit((values) => updateLlm.mutate(values))}>
              <Select {...llmForm.register('llmProvider')}>
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
                <option value="google">google</option>
                <option value="mistral">mistral</option>
              </Select>
              <Input placeholder="modelo" {...llmForm.register('llmModel')} />
              <Input type="password" autoComplete="off" placeholder="nueva API key" {...llmForm.register('llmApiKey')} />
              <Button disabled={!botId || updateLlm.isPending} type="submit"><Save className="h-4 w-4" /> Guardar</Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">Actualizar `llmApiKey` requiere permiso `bot:update-credentials`; un 403 se muestra como RBAC del backend.</p>
            {updateLlm.isError ? <div className="mt-3"><ErrorState error={updateLlm.error} /></div> : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={integrations}
              getRowKey={(row) => row.id}
              empty={<EmptyState title="Sin integrations" description="Agrega STT o embeddings cuando el agente lo requiera." />}
            />
            {integrationsQuery.isError ? <div className="mt-3"><ErrorState error={integrationsQuery.error} /></div> : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Nueva integration</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={integrationForm.handleSubmit((values) => createIntegration.mutate(values))}>
                <Select {...integrationForm.register('kind')}>
                  <option value="stt">stt</option>
                  <option value="embeddings">embeddings</option>
                  <option value="payments">payments</option>
                </Select>
                <Select {...integrationForm.register('provider')}>
                  {providerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Input type="password" autoComplete="off" placeholder="api key" {...integrationForm.register('apiKey')} />
                <Button disabled={!botId || createIntegration.isPending} type="submit"><Plus className="h-4 w-4" /> Crear</Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">
                Para cobros (modo microsaas) usa kind <code>payments</code>, provider <code>mercadopago</code> y como api key el <strong>Access Token</strong> de Mercado Pago.
              </p>
              {createIntegration.isError ? <div className="mt-3"><ErrorState error={createIntegration.error} /></div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Rotar integration</CardTitle></CardHeader>
            <CardContent>
              {selectedIntegration ? (
                <form className="space-y-3" onSubmit={integrationUpdateForm.handleSubmit((values) => updateIntegration.mutate(values))}>
                  <p className="text-sm font-medium">{selectedIntegration.kind} · {selectedIntegration.provider}</p>
                  <Select {...integrationUpdateForm.register('status')}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </Select>
                  <Input type="password" autoComplete="off" placeholder="nueva api key" {...integrationUpdateForm.register('apiKey')} />
                  <Button disabled={updateIntegration.isPending} type="submit"><Save className="h-4 w-4" /> Actualizar</Button>
                </form>
              ) : (
                <EmptyState title="Selecciona una integration" />
              )}
              {updateIntegration.isError ? <div className="mt-3"><ErrorState error={updateIntegration.error} /></div> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function removeEmpty<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null));
}
