import { zodResolver } from '@hookform/resolvers/zod';
import { BrainCircuit, CheckCircle2, FilePenLine, MessageSquareText, ShieldAlert, Sparkles, Wand2, Workflow } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Bot, PromptArchitectBlueprint, PromptArchitectDraftResponse } from '@/lib/types';

const architectSchema = z.object({
  mode: z.enum(['quick', 'advanced']),
  assistantName: z.string().optional(),
  businessName: z.string().optional(),
  objective: z.string().trim().min(1, 'Define el objetivo principal del agente.'),
  audience: z.string().optional(),
  tone: z.string().optional(),
  businessContext: z.string().optional(),
  offerings: z.string().optional(),
  successCriteria: z.string().optional(),
  happyPath: z.string().optional(),
  conversationFlow: z.string().optional(),
  knowledgePolicy: z.string().optional(),
  variables: z.string().optional(),
  tools: z.string().optional(),
  escalationRules: z.string().optional(),
  handoffTriggers: z.string().optional(),
  outOfScope: z.string().optional(),
  prohibitedContent: z.string().optional(),
  outputFormat: z.string().optional(),
  exampleDialogues: z.string().optional(),
  testScenarios: z.string().optional(),
});

type ArchitectFormValues = z.infer<typeof architectSchema>;

interface PromptArchitectCardProps {
  bot?: Bot;
  draftPreview: string;
  promptVersionCount: number;
  meta?: PromptArchitectDraftResponse['meta'] | null;
  isSaving: boolean;
  isGenerating: boolean;
  saveError?: unknown;
  generateError?: unknown;
  onSaveBlueprint: (blueprint: PromptArchitectBlueprint) => void;
  onGenerateDraft: (blueprint: PromptArchitectBlueprint) => void;
}

export function PromptArchitectCard({
  bot,
  draftPreview,
  promptVersionCount,
  meta,
  isSaving,
  isGenerating,
  saveError,
  generateError,
  onSaveBlueprint,
  onGenerateDraft,
}: PromptArchitectCardProps) {
  const form = useForm<ArchitectFormValues>({
    resolver: zodResolver(architectSchema),
    values: toArchitectFormValues(bot),
  });
  const mode = form.watch('mode');
  const providerReady = Boolean(bot?.llmProvider && bot?.llmModel && bot?.llmApiKeySet);
  const hasExistingPrompt = Boolean(bot?.systemPrompt?.trim()) || promptVersionCount > 0;
  const promptLabel = hasExistingPrompt ? 'Generar nuevo borrador' : 'Generar primer prompt';

  if (!bot) {
    return (
      <Card className="mt-5">
        <CardHeader><CardTitle>Arquitecto de prompt</CardTitle></CardHeader>
        <CardContent><EmptyState title="Selecciona un agente" description="Aqui construiremos el brief que alimenta el prompt versionado del bot." /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-5">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Arquitecto de prompt</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Define el brief operativo del chatbot y genera un borrador listo para pasar al prompt versionado.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={providerReady ? 'success' : 'warning'}>{providerReady ? 'Provider listo' : 'Configura provider'}</Badge>
            <Badge tone="info">{bot.llmProvider ?? 'sin provider'} / {bot.llmModel ?? 'sin modelo'}</Badge>
            <Badge tone="neutral">{hasExistingPrompt ? 'Revision sobre prompt actual' : 'Primera version'}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ArchitectMetric
            icon={BrainCircuit}
            label="Modo"
            value={mode === 'advanced' ? 'Avanzado' : 'Rapido'}
            detail={mode === 'advanced' ? 'Cobertura completa' : 'Ruta corta para iterar'}
          />
          <ArchitectMetric
            icon={FilePenLine}
            label="Versiones"
            value={String(promptVersionCount)}
            detail={hasExistingPrompt ? 'Ya hay historial publicado' : 'Aun no hay prompt publicado'}
          />
          <ArchitectMetric
            icon={MessageSquareText}
            label="Brief guardado"
            value={bot.identity?.promptArchitect ? 'Si' : 'No'}
            detail="Se conserva dentro de la identidad del agente"
          />
          <ArchitectMetric
            icon={Workflow}
            label="Destino"
            value="Prompt versionado"
            detail="El borrador baja directo al editor de publicacion"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => onGenerateDraft(toBlueprint(values)))}>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap gap-2">
                <ModeButton active={mode === 'quick'} onClick={() => form.setValue('mode', 'quick', { shouldDirty: true })}>
                  <Sparkles className="h-4 w-4" /> Rapido
                </ModeButton>
                <ModeButton active={mode === 'advanced'} onClick={() => form.setValue('mode', 'advanced', { shouldDirty: true })}>
                  <Wand2 className="h-4 w-4" /> Avanzado
                </ModeButton>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Rapido sirve para sacar una primera version con lo esencial. Avanzado agrega reglas, variables, handoff y pruebas.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre del agente">
                <Input placeholder="Asistente comercial, concierge, intake..." {...form.register('assistantName')} />
              </Field>
              <Field label="Negocio o marca">
                <Input placeholder="Empresa, asociacion o linea de negocio" {...form.register('businessName')} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Objetivo principal">
                  <Textarea rows={3} placeholder="Que debe resolver este agente, para quien y con que resultado esperado." {...form.register('objective')} />
                </Field>
              </div>
              <Field label="Audiencia">
                <Input placeholder="Prospectos, clientes recurrentes, pacientes, alumnos..." {...form.register('audience')} />
              </Field>
              <Field label="Tono y estilo">
                <Input placeholder="Profesional, cercano, ejecutivo, tecnico..." {...form.register('tone')} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Contexto del negocio">
                  <Textarea rows={4} placeholder="Describe el negocio, su operacion y lo que el agente necesita comprender." {...form.register('businessContext')} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Productos, servicios o casos que atiende">
                  <Textarea rows={3} placeholder="Que vende, gestiona o explica con mayor frecuencia." {...form.register('offerings')} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Flujo ideal de atencion">
                  <Textarea rows={4} placeholder="Como deberia abrir, descubrir necesidad, orientar y cerrar o llevar al siguiente paso." {...form.register('happyPath')} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Escalamiento y limites">
                  <Textarea rows={3} placeholder="Cuando debe pasar a humano, detenerse o pedir mas contexto." {...form.register('escalationRules')} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Fuera de alcance">
                  <Textarea rows={3} placeholder="Lo que no debe prometer, responder o ejecutar." {...form.register('outOfScope')} />
                </Field>
              </div>
            </div>

            {mode === 'advanced' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Criterios de exito">
                    <Textarea rows={3} placeholder="Como se ve una conversacion bien resuelta para este agente." {...form.register('successCriteria')} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Flujo conversacional detallado">
                    <Textarea rows={4} placeholder="Estados, ramas, validaciones o secuencias importantes." {...form.register('conversationFlow')} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Politica de conocimiento">
                    <Textarea rows={3} placeholder="Como debe usar knowledge, cuando citar, cuando admitir falta de informacion." {...form.register('knowledgePolicy')} />
                  </Field>
                </div>
                <Field label="Variables dinamicas">
                  <Textarea rows={3} placeholder="Datos disponibles: nombre, sucursal, horario, inventario, CRM..." {...form.register('variables')} />
                </Field>
                <Field label="Herramientas o integraciones">
                  <Textarea rows={3} placeholder="Webhook, CRM, agenda, pagos, catalogo, handoff..." {...form.register('tools')} />
                </Field>
                <Field label="Triggers de handoff">
                  <Textarea rows={3} placeholder="Casos precisos donde se requiere humano." {...form.register('handoffTriggers')} />
                </Field>
                <Field label="Formato de salida">
                  <Textarea rows={3} placeholder="Longitud, estructura, bullets, CTA, lenguaje permitido..." {...form.register('outputFormat')} />
                </Field>
                <Field label="Contenido prohibido">
                  <Textarea rows={3} placeholder="Temas sensibles, promesas, diagnosticos, precios inventados..." {...form.register('prohibitedContent')} />
                </Field>
                <Field label="Ejemplos de dialogo">
                  <Textarea rows={4} placeholder="Casos de muestra, respuestas deseadas o anti-patrones." {...form.register('exampleDialogues')} />
                </Field>
                <Field label="Escenarios de prueba">
                  <Textarea rows={4} placeholder="Casos que deben validarse antes de publicar." {...form.register('testScenarios')} />
                </Field>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={form.handleSubmit((values) => onSaveBlueprint(toBlueprint(values)))}
              >
                <FilePenLine className="h-4 w-4" /> Guardar brief
              </Button>
              <Button disabled={!providerReady || isGenerating} type="submit">
                <Wand2 className="h-4 w-4" /> {promptLabel}
              </Button>
            </div>

            {!providerReady ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Configura provider, modelo y API key del agente para usar el arquitecto con sus propias credenciales.
              </div>
            ) : null}
            {saveError ? <ErrorState error={saveError} /> : null}
            {generateError ? <ErrorState error={generateError} /> : null}
          </form>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="font-medium">Salida esperada</p>
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>El arquitecto redacta un prompt operativo para WhatsApp, no una descripcion conceptual.</p>
                <p>Siempre deja el borrador en el editor de prompt versionado para que podamos revisarlo antes de publicar.</p>
                <p>Si ya existe un prompt, lo toma como base y lo reordena con el brief actual.</p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">Borrador actual</p>
                {meta ? <Badge tone="info">{meta.mode === 'advanced' ? 'Generado en avanzado' : 'Generado en rapido'}</Badge> : null}
              </div>
              {meta ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Usando {meta.provider} / {meta.model} {meta.basedOnExistingPrompt ? 'sobre el prompt actual' : 'como primera version'}.
                </p>
              ) : null}
              {draftPreview.trim() ? (
                <Textarea className="mt-3 min-h-[360px]" readOnly value={draftPreview} />
              ) : (
                <div className="mt-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Aun no hay borrador en el editor. Genera uno aqui y aparecerá listo para revisión y publicación.
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-700" />
                <p className="font-medium text-slate-900">Recomendacion de trabajo</p>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Guarda el brief cuando definas la estrategia del agente. Genera cuantas veces haga falta y publica solo la version que ya se vea firme.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button className="min-w-[132px]" onClick={onClick} type="button" variant={active ? 'default' : 'outline'}>
      {children}
    </Button>
  );
}

function ArchitectMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-base font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function toArchitectFormValues(bot?: Bot): ArchitectFormValues {
  const saved = bot?.identity?.promptArchitect;
  return {
    mode: saved?.mode ?? 'quick',
    assistantName: saved?.assistantName ?? bot?.name ?? '',
    businessName: saved?.businessName ?? bot?.branding?.companyName ?? '',
    objective: saved?.objective ?? '',
    audience: saved?.audience ?? '',
    tone: saved?.tone ?? '',
    businessContext: saved?.businessContext ?? '',
    offerings: saved?.offerings ?? '',
    successCriteria: saved?.successCriteria ?? '',
    happyPath: saved?.happyPath ?? '',
    conversationFlow: saved?.conversationFlow ?? '',
    knowledgePolicy: saved?.knowledgePolicy ?? '',
    variables: saved?.variables ?? '',
    tools: saved?.tools ?? '',
    escalationRules: saved?.escalationRules ?? '',
    handoffTriggers: saved?.handoffTriggers ?? '',
    outOfScope: saved?.outOfScope ?? '',
    prohibitedContent: saved?.prohibitedContent ?? '',
    outputFormat: saved?.outputFormat ?? '',
    exampleDialogues: saved?.exampleDialogues ?? '',
    testScenarios: saved?.testScenarios ?? '',
  };
}

function toBlueprint(values: ArchitectFormValues): PromptArchitectBlueprint {
  const blueprint: PromptArchitectBlueprint = {
    mode: values.mode,
    objective: values.objective.trim(),
  };

  const optionalFields: Array<keyof Omit<PromptArchitectBlueprint, 'mode' | 'objective'>> = [
    'assistantName',
    'businessName',
    'audience',
    'tone',
    'businessContext',
    'offerings',
    'successCriteria',
    'happyPath',
    'conversationFlow',
    'knowledgePolicy',
    'variables',
    'tools',
    'escalationRules',
    'handoffTriggers',
    'outOfScope',
    'prohibitedContent',
    'outputFormat',
    'exampleDialogues',
    'testScenarios',
  ];

  for (const field of optionalFields) {
    const value = values[field];
    if (typeof value === 'string' && value.trim()) {
      blueprint[field] = value.trim();
    }
  }

  return blueprint;
}
