import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Bot,
  Building2,
  ChartSpline,
  CircleDot,
  ClipboardList,
  DatabaseZap,
  FileText,
  Gauge,
  Headset,
  KeyRound,
  Layers3,
  LogOut,
  MessageSquareText,
  ScrollText,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/resources';
import { useAuth } from '@/features/auth/AuthProvider';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';

const navItems = [
  { to: '/console', label: 'Dashboard', icon: Gauge, superadminOnly: true },
  { to: '/console/organizations', label: 'Organizaciones', icon: Building2 },
  { to: '/console/bots', label: 'Agentes', icon: Bot },
  { to: '/console/channels', label: 'Canales WhatsApp', icon: Smartphone },
  { to: '/console/providers', label: 'Credenciales', icon: KeyRound },
  { to: '/console/knowledge', label: 'Knowledge', icon: DatabaseZap },
  { to: '/console/templates', label: 'Templates', icon: FileText },
  { to: '/console/conversations', label: 'Conversaciones', icon: MessageSquareText },
  { to: '/console/dlq', label: 'DLQ', icon: TriangleAlert },
  { to: '/console/audit', label: 'Auditoria', icon: ClipboardList },
  { to: '/console/compliance', label: 'ARCO', icon: ShieldCheck },
  { to: '/console/metrics', label: 'Metricas', icon: ChartSpline },
  { to: '/console/settings', label: 'Settings', icon: Settings },
];

const pageNames: Record<string, string> = {
  '/console': 'Dashboard',
  '/console/organizations': 'Organizaciones',
  '/console/bots': 'Agentes',
  '/console/channels': 'Canales WhatsApp',
  '/console/providers': 'Credenciales / Providers',
  '/console/knowledge': 'Knowledge / RAG',
  '/console/templates': 'Templates',
  '/console/conversations': 'Conversaciones',
  '/console/dlq': 'Dead-letter queue',
  '/console/audit': 'Auditoria',
  '/console/compliance': 'Compliance / ARCO',
  '/console/metrics': 'Metricas',
  '/console/settings': 'Settings',
};

export function AppLayout() {
  const { logout, user, selectedOrgId, setSelectedOrgId } = useAuth();
  const location = useLocation();
  const orgsQuery = useQuery({ queryKey: ['organizations'], queryFn: api.organizations });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 30_000 });
  const platformSummaryQuery = useQuery({
    queryKey: ['platform-summary', 'layout'],
    queryFn: api.platformSummary,
    enabled: Boolean(user?.isSuperadmin),
    refetchInterval: 30_000,
  });
  const visibleNavItems = navItems.filter((item) => !item.superadminOnly || user?.isSuperadmin);
  const currentPageName = pageNames[location.pathname] ?? 'Modulo';

  const orgs = orgsQuery.data ?? [];
  const activeOrg = orgs.find((org) => org.id === selectedOrgId) ?? orgs[0];
  const overview = platformSummaryQuery.data?.overview;

  if (!selectedOrgId && activeOrg) {
    queueMicrotask(() => setSelectedOrgId(activeOrg.id));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 bg-slate-950 text-slate-100 lg:block">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-500 text-white shadow-sm">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Whabo</p>
              <p className="text-xs text-slate-400">Operations Console</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              Vista actual
            </div>
            <p className="mt-2 text-sm font-medium text-white">{currentPageName}</p>
            <p className="mt-1 text-xs text-slate-400">
              {user?.isSuperadmin ? 'Modo plataforma completo' : 'Modo organizacion'}
            </p>
          </div>
        </div>

        <div className="flex h-[calc(100vh-125px)] flex-col">
          <nav className="space-y-1 px-3 py-4">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                end={item.to === '/console'}
                to={item.to}
                className={({ isActive }) =>
                  `flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/6 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3 px-4 pb-4">
            {user?.isSuperadmin ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Layers3 className="h-4 w-4 text-violet-300" />
                    Estado de plataforma
                  </div>
                  {platformSummaryQuery.isError ? (
                    <StatusBadge status="degraded" />
                  ) : (
                    <StatusBadge status={platformSummaryQuery.data?.health.status ?? 'pending'} />
                  )}
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <CircleDot className="h-3.5 w-3.5 text-emerald-300" />
                      Organizaciones
                    </span>
                    <span className="font-medium text-white">{overview ? overview.organizationCount : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <Bot className="h-3.5 w-3.5 text-sky-300" />
                      Bots activos
                    </span>
                    <span className="font-medium text-white">{overview ? overview.activeBotCount : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <TriangleAlert className="h-3.5 w-3.5 text-amber-300" />
                      DLQ
                    </span>
                    <span className="font-medium text-white">{overview ? overview.dlqCount : '-'}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Headset className="h-4 w-4 text-slate-300" />
                Sesion activa
              </div>
              <p className="mt-2 truncate text-sm text-slate-200">{user?.email ?? user?.userId}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b bg-slate-50/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Consola</span>
                <span>/</span>
                <span>{currentPageName}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <p className="truncate text-sm font-medium">{activeOrg?.name ?? 'Sin organizacion seleccionada'}</p>
                {user?.isSuperadmin ? <StatusBadge status="active" /> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm">
                <Activity className="h-4 w-4 text-muted-foreground" />
                {healthQuery.isError ? <StatusBadge status="degraded" /> : <StatusBadge status={healthQuery.data?.status ?? 'pending'} />}
                <span className="hidden text-muted-foreground sm:inline">
                  DB {healthQuery.data?.db ? 'ok' : '-'} / Redis {healthQuery.data?.redis ? 'ok' : '-'}
                </span>
              </div>

              <Select
                className="w-56 bg-white shadow-sm"
                value={activeOrg?.id ?? ''}
                onChange={(event) => setSelectedOrgId(event.target.value || null)}
                disabled={orgsQuery.isLoading || !orgs.length}
                aria-label="Organizacion"
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>

              <div className="hidden rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm md:block">
                {user?.email ?? user?.userId} · {user?.role}
              </div>

              <Button size="icon" variant="outline" onClick={logout} title="Logout" className="bg-white shadow-sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t bg-white px-3 py-2 lg:hidden">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                end={item.to === '/console'}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-4 py-5 lg:px-6">
          {orgsQuery.isError ? (
            <div className="mb-4">
              <ErrorState error={orgsQuery.error} />
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
