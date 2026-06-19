import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, CreditCard, MessageSquareText, ShieldAlert, Star, Users, Wallet } from 'lucide-react';
import { BotPicker } from '@/components/common/BotPicker';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { MetricCard } from '@/components/common/MetricCard';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/resources';
import type { Bot as BotType, CrisisEvent, EndUser, Feedback, Payment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ConversationsPage() {
  const LIVE_REFETCH_MS = 15000;
  const botsQuery = useQuery({ queryKey: ['bots'], queryFn: api.bots });
  const [botId, setBotId] = useState('');
  const [pausedFilter, setPausedFilter] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const paused = pausedFilter === '' ? undefined : pausedFilter === 'true';

  const usersQuery = useQuery({
    queryKey: ['users', botId, paused],
    queryFn: () => api.users(botId, paused),
    enabled: Boolean(botId),
    refetchInterval: LIVE_REFETCH_MS,
  });
  const crisisQuery = useQuery({
    queryKey: ['crisis-events', botId],
    queryFn: () => api.crisisEvents(botId, 50),
    enabled: Boolean(botId),
    refetchInterval: LIVE_REFETCH_MS,
  });
  const feedbackQuery = useQuery({
    queryKey: ['feedback', botId],
    queryFn: () => api.feedback(botId, 100),
    enabled: Boolean(botId),
    refetchInterval: LIVE_REFETCH_MS,
  });
  const feedbackStatsQuery = useQuery({
    queryKey: ['feedback-stats', botId],
    queryFn: () => api.feedbackStats(botId),
    enabled: Boolean(botId),
    refetchInterval: LIVE_REFETCH_MS,
  });

  useEffect(() => {
    if (!botId && botsQuery.data?.[0]) setBotId(botsQuery.data[0].id);
  }, [botId, botsQuery.data]);

  const selectedBot = useMemo<BotType | undefined>(() => botsQuery.data?.find((bot) => bot.id === botId), [botId, botsQuery.data]);
  const membershipEnabled = selectedBot?.identity?.membership?.enabled === true;

  const paymentsQuery = useQuery({
    queryKey: ['payments', botId, paymentStatus],
    queryFn: () =>
      api.payments(botId, {
        status: paymentStatus === '' ? undefined : paymentStatus as Payment['status'],
        limit: 100,
      }),
    enabled: Boolean(botId) && membershipEnabled,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const users = usersQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const activeMembers = users.filter((user) => user.membershipUntil && new Date(user.membershipUntil).getTime() > Date.now()).length;
  const approvedPayments = payments.filter((payment) => payment.status === 'approved').length;

  const userColumns = useMemo(
    () => [
      { key: 'id', header: 'Usuario final', render: (row: EndUser) => <span className="font-mono text-xs">{row.id}</span> },
      { key: 'locale', header: 'Locale', render: (row: EndUser) => row.locale ?? 'n/a' },
      { key: 'paused', header: 'Estado', render: (row: EndUser) => <StatusBadge status={row.paused ? 'paused' : 'active'} /> },
      { key: 'freeMsgUsed', header: 'Gratis usados', render: (row: EndUser) => row.freeMsgUsed ?? 0 },
      { key: 'membershipUntil', header: 'Membresia', render: (row: EndUser) => (row.membershipUntil ? formatDate(row.membershipUntil) : 'Sin membresia') },
      { key: 'createdAt', header: 'Creado', render: (row: EndUser) => formatDate(row.createdAt) },
    ],
    [],
  );

  const crisisColumns = useMemo(
    () => [
      { key: 'category', header: 'Categoria', render: (row: CrisisEvent) => row.category },
      { key: 'action', header: 'Accion', render: (row: CrisisEvent) => row.actionTaken },
      { key: 'date', header: 'Fecha', render: (row: CrisisEvent) => formatDate(row.detectedAt) },
    ],
    [],
  );

  const feedbackColumns = useMemo(
    () => [
      { key: 'rating', header: 'Rating', render: (row: Feedback) => `${row.rating}/5` },
      { key: 'message', header: 'Message ID', render: (row: Feedback) => <span className="font-mono text-xs">{row.messageId}</span> },
      { key: 'date', header: 'Fecha', render: (row: Feedback) => formatDate(row.createdAt) },
    ],
    [],
  );

  const paymentColumns = useMemo(
    () => [
      { key: 'endUserId', header: 'Usuario', render: (row: Payment) => <span className="font-mono text-xs">{row.endUserId}</span> },
      { key: 'status', header: 'Estado', render: (row: Payment) => <StatusBadge status={row.status} /> },
      { key: 'amount', header: 'Monto', render: (row: Payment) => (row.amount == null ? 'Sin monto' : formatCurrency(row.amount, row.currency ?? 'MXN')) },
      { key: 'provider', header: 'Provider', render: (row: Payment) => row.provider },
      { key: 'paidAt', header: 'Pagado', render: (row: Payment) => (row.paidAt ? formatDate(row.paidAt) : 'Pendiente') },
      { key: 'createdAt', header: 'Creado', render: (row: Payment) => formatDate(row.createdAt) },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Conversaciones"
        description="Vista operativa de usuarios finales, membresias, pagos, feedback y eventos sensibles por agente."
      />

      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-5">
        <MetricCard title="Usuarios finales" value={users.length} icon={Users} />
        <MetricCard
          title="Miembros activos"
          value={membershipEnabled ? activeMembers : 'N/A'}
          icon={CreditCard}
          detail={membershipEnabled ? 'Con vigencia activa' : 'Microsaas desactivado'}
        />
        <MetricCard
          title="Pagos aprobados"
          value={membershipEnabled ? approvedPayments : 'N/A'}
          icon={MessageSquareText}
          detail={membershipEnabled ? 'Ultimos 100 registros' : 'Microsaas desactivado'}
        />
        <MetricCard
          title="Feedback"
          value={feedbackStatsQuery.data?.count ?? 0}
          icon={Star}
          detail={feedbackStatsQuery.data?.average ? `Promedio ${feedbackStatsQuery.data.average}` : 'Sin promedio'}
        />
        <MetricCard
          title="Crisis events"
          value={crisisQuery.data?.length ?? 0}
          icon={ShieldAlert}
          tone={(crisisQuery.data?.length ?? 0) > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <BotPicker value={botId} onChange={setBotId} />
              <div>
                <label className="field-label">Estado usuario</label>
                <Select value={pausedFilter} onChange={(event) => setPausedFilter(event.target.value)}>
                  <option value="">todos</option>
                  <option value="false">activos</option>
                  <option value="true">pausados</option>
                </Select>
              </div>
              {membershipEnabled ? (
                <div>
                  <label className="field-label">Estado del pago</label>
                  <Select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
                    <option value="">todos</option>
                    <option value="approved">aprobados</option>
                    <option value="pending">pendientes</option>
                    <option value="rejected">rechazados</option>
                  </Select>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Resumen del agente</CardTitle></CardHeader>
            <CardContent>
              {selectedBot ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{selectedBot.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedBot.llmProvider ?? 'Provider sin definir'}</p>
                    </div>
                    <StatusBadge status={selectedBot.status} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase text-muted-foreground">Modo comercial</p>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-base font-semibold">{membershipEnabled ? 'Microsaas' : 'Tradicional'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {membershipEnabled ? 'Con pagos y vigencias' : 'Sin paywall activo'}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase text-muted-foreground">Usuarios visibles</p>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-base font-semibold">{users.length}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{activeMembers} con membresia activa</p>
                    </div>
                  </div>
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    {membershipEnabled
                      ? 'Esta vista ya te deja seguir consumo gratis, vigencias y pagos. La bandeja conversacional completa quedaria para CRM y handoff.'
                      : 'Todavia falta el endpoint conversacional completo; aqui nos quedamos en lectura operativa de usuarios, feedback y crisis.'}
                  </div>
                </div>
              ) : (
                <EmptyState title="Selecciona un agente" description="Aqui veras contexto operativo antes de bajar a usuarios, pagos y señales de riesgo." />
              )}
            </CardContent>
          </Card>
        </div>

        <DataTable
          columns={userColumns}
          data={users}
          getRowKey={(row) => row.id}
          empty={<EmptyState title="Sin usuarios finales" description="Todavia no hay sujetos conversacionales para este agente." />}
        />
      </div>

      {usersQuery.isError ? <div className="mt-4"><ErrorState error={usersQuery.error} /></div> : null}

      {membershipEnabled ? (
        <div className="mt-5">
          <Card>
            <CardHeader><CardTitle>Pagos de membresia</CardTitle></CardHeader>
            <CardContent>
              <DataTable
                columns={paymentColumns}
                data={payments}
                getRowKey={(row) => row.id}
                empty={<EmptyState title="Sin pagos" description="Todavia no hay pagos registrados para este agente." />}
              />
            </CardContent>
          </Card>
          {paymentsQuery.isError ? <div className="mt-4"><ErrorState error={paymentsQuery.error} /></div> : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Crisis events</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={crisisColumns}
              data={crisisQuery.data ?? []}
              getRowKey={(row) => row.id}
              empty={<EmptyState title="Sin eventos de crisis" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Feedback</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={feedbackColumns}
              data={feedbackQuery.data ?? []}
              getRowKey={(row) => row.id}
              empty={<EmptyState title="Sin feedback" />}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
