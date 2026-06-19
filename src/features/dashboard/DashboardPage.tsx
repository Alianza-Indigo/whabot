import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  CreditCard,
  Database,
  DatabaseZap,
  MessageSquareText,
  ShieldAlert,
  Smartphone,
  TriangleAlert,
  Users,
  Workflow,
} from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { MetricCard } from '@/components/common/MetricCard';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/AuthProvider';
import { api } from '@/lib/resources';
import type { PlatformOrganizationRow } from '@/lib/types';
import { formatDate, formatNumber, formatPercent } from '@/lib/utils';

const COLORS = ['#0f766e', '#0369a1', '#b45309', '#b91c1c', '#475569'];

function formatActivityAction(action: string): string {
  return action.replace(/[._]/g, ' ');
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { setSelectedOrgId } = useAuth();
  const summaryQuery = useQuery({ queryKey: ['platform-summary'], queryFn: api.platformSummary, refetchInterval: 30_000 });

  const summary = summaryQuery.data;
  const overview = summary?.overview;
  const health = summary?.health;
  const orgRows = summary?.organizations.rows ?? [];
  const topAttentionOrgs = summary?.organizations.attention ?? [];
  const usageData = summary?.charts.topUsageOrganizations ?? [];
  const statusData = summary?.charts.botStatuses ?? [];
  const planData = summary?.charts.planDistribution ?? [];
  const recentActivity = summary?.recentActivity ?? [];

  const openOrganization = (orgId: string) => {
    setSelectedOrgId(orgId);
    navigate('/console/organizations');
  };

  const embeddedCoverage =
    overview && overview.knowledgeItemCount > 0
      ? overview.embeddedKnowledgeCount / overview.knowledgeItemCount
      : null;

  return (
    <>
      <PageHeader
        title="Resumen de plataforma"
        description="Vista general de operaciones, riesgo y adopcion para la consola superadmin."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => navigate('/console/organizations')}>
              Organizaciones
            </Button>
            <Button type="button" onClick={() => navigate('/console/dlq')}>
              Revisar DLQ
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr_1fr]">
        <Card>
          <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
            <div>
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Superadmin
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal">Centro operativo de Whabo</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                La plataforma ya corre sobre un resumen unificado, asi que esta vista puede crecer sin volver a ensamblar datos en cliente.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase text-muted-foreground">Ultima lectura</p>
                <p className="mt-2 text-sm font-medium">{summary ? formatDate(summary.generatedAt) : 'Cargando'}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase text-muted-foreground">Knowledge con embeddings</p>
                <p className="mt-2 text-sm font-medium">
                  {embeddedCoverage === null ? 'Sin base' : formatPercent(embeddedCoverage)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase text-muted-foreground">Pagos aprobados</p>
                <p className="mt-2 text-sm font-medium">{formatNumber(overview?.approvedPaymentCount ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Knowledge</p>
                <p className="mt-2 text-2xl font-semibold">{formatNumber(overview?.knowledgeItemCount ?? 0)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatNumber(overview?.embeddedKnowledgeCount ?? 0)} piezas listas para retrieval
                </p>
              </div>
              <div className="rounded-md bg-violet-50 p-2 text-violet-700">
                <DatabaseZap className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Uso conversacional</p>
                <p className="mt-2 text-2xl font-semibold">{formatNumber(overview?.messageCount ?? 0)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatNumber(overview?.endUserCount ?? 0)} usuarios finales registrados
                </p>
              </div>
              <div className="rounded-md bg-sky-50 p-2 text-sky-700">
                <Workflow className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Organizaciones"
          value={formatNumber(overview?.organizationCount ?? 0)}
          detail={`${formatNumber(overview?.operatingOrganizationCount ?? 0)} con operacion detectable`}
          icon={Building2}
        />
        <MetricCard
          title="Agentes activos"
          value={formatNumber(overview?.activeBotCount ?? 0)}
          detail={`${formatNumber(overview?.botCount ?? 0)} agentes, ${formatNumber(overview?.connectedChannelCount ?? 0)} canales conectados`}
          icon={Bot}
          tone={(overview?.activeBotCount ?? 0) > 0 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Uso de cuota"
          value={overview?.totalQuota ? formatPercent(overview.totalUsed / overview.totalQuota) : 'Ilimitado'}
          detail={`${formatNumber(overview?.totalUsed ?? 0)} usados de ${overview?.totalQuota ? formatNumber(overview.totalQuota) : 'cuota abierta'}`}
          icon={MessageSquareText}
          tone={(overview?.quotaPressureOrganizationCount ?? 0) > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Atencion requerida"
          value={formatNumber(overview?.organizationsNeedingAttention ?? 0)}
          detail={`${formatNumber(overview?.credentialErrorBotCount ?? 0)} agentes con credenciales rotas, DLQ ${overview?.dlqCount ?? 0}`}
          icon={TriangleAlert}
          tone={(overview?.organizationsNeedingAttention ?? 0) > 0 || (overview?.dlqCount ?? 0) > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title="Usuarios finales"
          value={formatNumber(overview?.endUserCount ?? 0)}
          detail={`${formatNumber(overview?.messageCount ?? 0)} mensajes historicos`}
          icon={Users}
          tone={(overview?.endUserCount ?? 0) > 0 ? 'success' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Organizaciones con mayor uso</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Prioriza a los tenants que ya están empujando volumen real.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/console/organizations')}>
                Ver organizaciones
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="h-80">
              {usageData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-14} textAnchor="end" height={56} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="used" name="Usados" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="Sin uso registrado" description="Aun no hay organizaciones con consumo acumulado para comparar." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Vista por organizacion</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Estado compacto para decidir dónde intervenir primero.</p>
              </div>
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {formatNumber(overview?.organizationsNeedingAttention ?? 0)} con foco inmediato
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Organizacion',
                    render: (org: PlatformOrganizationRow) => (
                      <button className="text-left font-medium text-primary hover:underline" onClick={() => openOrganization(org.id)}>
                        {org.name}
                      </button>
                    ),
                  },
                  { key: 'plan', header: 'Plan', render: (org: PlatformOrganizationRow) => <StatusBadge status={org.plan} /> },
                  {
                    key: 'bots',
                    header: 'Agentes',
                    render: (org: PlatformOrganizationRow) => (
                      <span>{formatNumber(org.activeBotCount)} / {formatNumber(org.botCount)} activos</span>
                    ),
                  },
                  {
                    key: 'channels',
                    header: 'Canales',
                    render: (org: PlatformOrganizationRow) => (
                      <span>{formatNumber(org.connectedChannelCount)} / {formatNumber(org.channelCount)} conectados</span>
                    ),
                  },
                  {
                    key: 'usage',
                    header: 'Uso',
                    render: (org: PlatformOrganizationRow) => (
                      <span>
                        {formatNumber(org.msgUsed)}
                        {org.msgQuota > 0 ? ` (${formatPercent(org.msgUsed / org.msgQuota)})` : ' (ilimitado)'}
                      </span>
                    ),
                  },
                  {
                    key: 'state',
                    header: 'Estado',
                    render: (org: PlatformOrganizationRow) =>
                      org.issues.length ? (
                        <div className="flex flex-wrap gap-2">
                          {org.issues.map((issue) => (
                            <Badge key={issue} tone={issue === 'cuota alta' ? 'warning' : 'danger'}>{issue}</Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge tone={org.isOperating ? 'success' : 'neutral'}>
                          {org.isOperating ? 'operando' : 'sin actividad'}
                        </Badge>
                      ),
                  },
                  { key: 'createdAt', header: 'Alta', render: (org: PlatformOrganizationRow) => formatDate(org.createdAt) },
                ]}
                data={orgRows}
                getRowKey={(org) => org.id}
                empty={<EmptyState title="Sin organizaciones" description="Crea o registra una organizacion para empezar a monitorear la plataforma." />}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Salud operativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summaryQuery.isError ? (
                <ErrorState error={summaryQuery.error} onRetry={() => summaryQuery.refetch()} />
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-medium">API</span>
                    <StatusBadge status={health?.status ?? 'degraded'} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm"><Database className="h-4 w-4" /> PostgreSQL</span>
                    <StatusBadge status={health?.db ? 'ok' : 'degraded'} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm"><Database className="h-4 w-4" /> Redis / BullMQ</span>
                    <StatusBadge status={health?.redis ? 'ok' : 'degraded'} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border p-3">
                      <p className="text-xs uppercase text-muted-foreground">DLQ</p>
                      <p className="mt-2 text-xl font-semibold">{formatNumber(health?.dlqCount ?? 0)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Canales conectados</p>
                      <p className="mt-2 text-xl font-semibold">
                        {formatNumber(overview?.connectedChannelCount ?? 0)} / {formatNumber(overview?.totalChannelCount ?? 0)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas y actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topAttentionOrgs.length ? (
                topAttentionOrgs.map((org) => (
                  <div key={org.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{org.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatNumber(org.activeBotCount)} activos de {formatNumber(org.botCount)} agentes
                          {' - '}
                          {formatNumber(org.connectedChannelCount)} de {formatNumber(org.channelCount)} canales conectados
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {org.issues.map((issue) => (
                            <Badge key={issue} tone={issue === 'cuota alta' ? 'warning' : 'danger'}>{issue}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" type="button" variant="outline" onClick={() => openOrganization(org.id)}>
                        Abrir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  No se detectan tenants en riesgo con la data actual.
                </div>
              )}

              <div className="space-y-2 pt-1">
                {recentActivity.length ? (
                  recentActivity.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 rounded-md border p-3">
                      <div className="mt-0.5 rounded-full bg-slate-100 p-1.5 text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{formatActivityAction(entry.action)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {entry.orgName ?? 'Plataforma'}
                          {entry.targetType ? ` - ${entry.targetType}` : ''}
                          {entry.actorRole ? ` - ${entry.actorRole}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Sin actividad reciente" description="Los cambios operativos y administrativos apareceran aqui." />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuciones de plataforma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Estado de agentes</p>
                  <div className="rounded-md bg-sky-50 px-2 py-1 text-xs text-sky-700">
                    {formatNumber(overview?.botCount ?? 0)} totales
                  </div>
                </div>
                <div className="h-52">
                  {statusData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={76} paddingAngle={3}>
                          {statusData.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState title="Sin agentes" description="Cuando existan agentes veras aqui la distribucion por estado." />
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Planes</p>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {planData.length ? (
                      planData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between rounded-md border p-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-sm">{entry.name}</span>
                          </div>
                          <span className="text-sm font-medium">{formatNumber(entry.value)}</span>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="Sin planes registrados" description="Aun no hay organizaciones para resumir por plan." />
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Providers LLM</p>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {(summary?.charts.providerDistribution ?? []).length ? (
                      summary!.charts.providerDistribution.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between rounded-md border p-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-sm">{entry.name}</span>
                          </div>
                          <span className="text-sm font-medium">{formatNumber(entry.value)}</span>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="Sin providers" description="Todavia no hay providers configurados para resumir." />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enfoque comercial</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-muted-foreground">Pagos aprobados</p>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xl font-semibold">{formatNumber(overview?.approvedPaymentCount ?? 0)}</p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-muted-foreground">Credenciales en error</p>
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xl font-semibold">{formatNumber(overview?.credentialErrorBotCount ?? 0)}</p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-muted-foreground">Canales pendientes</p>
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xl font-semibold">
                  {formatNumber((overview?.totalChannelCount ?? 0) - (overview?.connectedChannelCount ?? 0))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {summaryQuery.isError ? (
        <div className="mt-4">
          <ErrorState error={summaryQuery.error ?? new Error('Error de dashboard')} />
        </div>
      ) : null}
    </>
  );
}
