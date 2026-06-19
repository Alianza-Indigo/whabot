import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bot, Building2, Database, MessageSquareText, ShieldAlert, Smartphone, TriangleAlert } from 'lucide-react';
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
import type { Bot as BotType, Organization } from '@/lib/types';
import { formatDate, formatNumber, formatPercent } from '@/lib/utils';

const COLORS = ['#0f766e', '#0369a1', '#b45309', '#b91c1c', '#475569'];

type OrgDashboardRow = {
  id: string;
  name: string;
  plan: Organization['plan'];
  createdAt: string;
  botCount: number;
  activeBotCount: number;
  credentialErrorCount: number;
  channelCount: number;
  connectedChannelCount: number;
  msgUsed: number;
  msgQuota: number;
  usageRate: number | null;
  isOperating: boolean;
  issues: string[];
};

function buildOrgRows(orgs: Organization[], bots: BotType[]): OrgDashboardRow[] {
  return orgs
    .map((org) => {
      const orgBots = bots.filter((bot) => bot.orgId === org.id);
      const channels = orgBots.flatMap((bot) => bot.channels ?? []);
      const activeBotCount = orgBots.filter((bot) => bot.status === 'active').length;
      const credentialErrorCount = orgBots.filter((bot) => bot.status === 'credential_error').length;
      const connectedChannelCount = channels.filter((channel) => channel.status === 'connected').length;
      const usageRate = org.msgQuota > 0 ? org.msgUsed / org.msgQuota : null;
      const issues: string[] = [];

      if (credentialErrorCount > 0) issues.push('credenciales');
      if (orgBots.length > 0 && activeBotCount === 0) issues.push('sin agentes activos');
      if (orgBots.length > 0 && connectedChannelCount === 0) issues.push('sin canal conectado');
      if (usageRate !== null && usageRate >= 0.85) issues.push('cuota alta');

      return {
        id: org.id,
        name: org.name,
        plan: org.plan,
        createdAt: org.createdAt,
        botCount: orgBots.length,
        activeBotCount,
        credentialErrorCount,
        channelCount: channels.length,
        connectedChannelCount,
        msgUsed: org.msgUsed,
        msgQuota: org.msgQuota,
        usageRate,
        isOperating: activeBotCount > 0 || connectedChannelCount > 0 || org.msgUsed > 0,
        issues,
      };
    })
    .sort((a, b) => {
      if (b.issues.length !== a.issues.length) return b.issues.length - a.issues.length;
      if (b.msgUsed !== a.msgUsed) return b.msgUsed - a.msgUsed;
      return a.name.localeCompare(b.name, 'es');
    });
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { setSelectedOrgId } = useAuth();
  const orgsQuery = useQuery({ queryKey: ['organizations'], queryFn: api.organizations, refetchInterval: 30_000 });
  const botsQuery = useQuery({ queryKey: ['bots'], queryFn: api.bots, refetchInterval: 30_000 });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 30_000 });
  const credentialErrorsQuery = useQuery({ queryKey: ['credential-errors'], queryFn: api.credentialErrors, refetchInterval: 30_000 });
  const dlqCountQuery = useQuery({ queryKey: ['dlq-count'], queryFn: api.dlqCount, retry: false, refetchInterval: 30_000 });

  const orgs = useMemo(() => orgsQuery.data ?? [], [orgsQuery.data]);
  const bots = useMemo(() => botsQuery.data ?? [], [botsQuery.data]);
  const credentialErrors = credentialErrorsQuery.data ?? [];
  const orgRows = useMemo(() => buildOrgRows(orgs, bots), [orgs, bots]);
  const totalQuota = orgs.reduce((sum, org) => sum + org.msgQuota, 0);
  const totalUsed = orgs.reduce((sum, org) => sum + org.msgUsed, 0);
  const totalChannels = orgRows.reduce((sum, org) => sum + org.channelCount, 0);
  const connectedChannels = orgRows.reduce((sum, org) => sum + org.connectedChannelCount, 0);
  const activeBots = orgRows.reduce((sum, org) => sum + org.activeBotCount, 0);
  const operatingOrgs = orgRows.filter((org) => org.isOperating).length;
  const orgsNeedingAttention = orgRows.filter((org) => org.issues.length > 0).length;
  const quotaPressureOrgs = orgRows.filter((org) => org.usageRate !== null && org.usageRate >= 0.85).length;

  const usageData = useMemo(
    () =>
      [...orgRows]
        .sort((a, b) => b.msgUsed - a.msgUsed)
        .slice(0, 6)
        .map((org) => ({
          name: org.name,
          used: org.msgUsed,
        })),
    [orgRows],
  );

  const statusData = useMemo(() => {
    const counts = bots.reduce<Record<string, number>>((acc, bot) => {
      acc[bot.status] = (acc[bot.status] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bots]);

  const planData = useMemo(() => {
    const counts = orgs.reduce<Record<string, number>>((acc, org) => {
      acc[org.plan] = (acc[org.plan] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orgs]);

  const topAttentionOrgs = orgRows.filter((org) => org.issues.length > 0).slice(0, 5);

  const openOrganization = (orgId: string) => {
    setSelectedOrgId(orgId);
    navigate('/console/organizations');
  };

  return (
    <>
      <PageHeader
        title="Dashboard de plataforma"
        description="Panorama operativo para superadmin: cobertura, capacidad, tenants con riesgo y salud general del backend."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Organizaciones"
          value={formatNumber(orgs.length)}
          detail={`${formatNumber(operatingOrgs)} con operacion detectable`}
          icon={Building2}
        />
        <MetricCard
          title="Agentes activos"
          value={formatNumber(activeBots)}
          detail={`${formatNumber(bots.length)} agentes, ${formatNumber(connectedChannels)} canales conectados`}
          icon={Bot}
          tone={activeBots > 0 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Uso de cuota"
          value={totalQuota ? formatPercent(totalUsed / totalQuota) : 'Ilimitado'}
          detail={`${formatNumber(totalUsed)} usados de ${totalQuota ? formatNumber(totalQuota) : 'cuota abierta'}`}
          icon={MessageSquareText}
          tone={quotaPressureOrgs > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Atencion requerida"
          value={formatNumber(orgsNeedingAttention)}
          detail={`${formatNumber(credentialErrors.length)} agentes con credenciales rotas, DLQ ${dlqCountQuery.data?.count ?? 0}`}
          icon={TriangleAlert}
          tone={orgsNeedingAttention > 0 || (dlqCountQuery.data?.count ?? 0) > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Organizaciones con mas uso</CardTitle>
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
          <CardHeader>
            <CardTitle>Estado de agentes</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {statusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={3}>
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
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Salud de plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthQuery.isError ? (
              <ErrorState error={healthQuery.error} onRetry={() => healthQuery.refetch()} />
            ) : (
              <>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm font-medium">API</span>
                  <StatusBadge status={healthQuery.data?.status ?? 'degraded'} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <span className="flex items-center gap-2 text-sm"><Database className="h-4 w-4" /> PostgreSQL</span>
                  <StatusBadge status={healthQuery.data?.db ? 'ok' : 'degraded'} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <span className="flex items-center gap-2 text-sm"><Database className="h-4 w-4" /> Redis / BullMQ</span>
                  <StatusBadge status={healthQuery.data?.redis ? 'ok' : 'degraded'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border p-3">
                    <p className="text-xs uppercase text-muted-foreground">DLQ</p>
                    <p className="mt-2 text-xl font-semibold">{dlqCountQuery.isError ? 'sin acceso' : formatNumber(dlqCountQuery.data?.count ?? 0)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs uppercase text-muted-foreground">Canales conectados</p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatNumber(connectedChannels)} / {formatNumber(totalChannels)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atencion inmediata</CardTitle>
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
              <EmptyState title="Sin tenants en riesgo" description="No se detectan issues operativos evidentes con la data actual." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribucion de planes</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {planData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={3}>
                    {planData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Sin planes registrados" description="Aun no hay organizaciones para resumir por plan." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Vista por organizacion</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  key: 'name',
                  header: 'Organizacion',
                  render: (org: OrgDashboardRow) => (
                    <button className="text-left font-medium text-primary hover:underline" onClick={() => openOrganization(org.id)}>
                      {org.name}
                    </button>
                  ),
                },
                { key: 'plan', header: 'Plan', render: (org: OrgDashboardRow) => <StatusBadge status={org.plan} /> },
                {
                  key: 'bots',
                  header: 'Agentes',
                  render: (org: OrgDashboardRow) => (
                    <span>{formatNumber(org.activeBotCount)} / {formatNumber(org.botCount)} activos</span>
                  ),
                },
                {
                  key: 'channels',
                  header: 'Canales',
                  render: (org: OrgDashboardRow) => (
                    <span>{formatNumber(org.connectedChannelCount)} / {formatNumber(org.channelCount)} conectados</span>
                  ),
                },
                {
                  key: 'usage',
                  header: 'Uso',
                  render: (org: OrgDashboardRow) => (
                    <span>
                      {formatNumber(org.msgUsed)}
                      {org.msgQuota > 0 ? ` (${formatPercent(org.msgUsed / org.msgQuota)})` : ' (ilimitado)'}
                    </span>
                  ),
                },
                {
                  key: 'state',
                  header: 'Estado',
                  render: (org: OrgDashboardRow) =>
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
                { key: 'createdAt', header: 'Alta', render: (org: OrgDashboardRow) => formatDate(org.createdAt) },
              ]}
              data={orgRows}
              getRowKey={(org) => org.id}
              empty={<EmptyState title="Sin organizaciones" description="Crea o registra una organizacion para empezar a monitorear la plataforma." />}
            />
          </CardContent>
        </Card>
      </div>

      {orgsQuery.isError || botsQuery.isError || credentialErrorsQuery.isError ? (
        <div className="mt-4">
          <ErrorState error={orgsQuery.error ?? botsQuery.error ?? credentialErrorsQuery.error ?? new Error('Error de dashboard')} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Credenciales en error"
          value={formatNumber(credentialErrors.length)}
          icon={ShieldAlert}
          tone={credentialErrors.length ? 'danger' : 'success'}
        />
        <MetricCard
          title="Canales conectados"
          value={formatNumber(connectedChannels)}
          detail={`${formatNumber(totalChannels - connectedChannels)} requieren revision`}
          icon={Smartphone}
          tone={connectedChannels === totalChannels ? 'success' : 'warning'}
        />
        <MetricCard
          title="Tenants cerca del limite"
          value={formatNumber(quotaPressureOrgs)}
          detail="Uso >= 85% de su cuota configurada"
          icon={MessageSquareText}
          tone={quotaPressureOrgs ? 'warning' : 'success'}
        />
      </div>
    </>
  );
}
