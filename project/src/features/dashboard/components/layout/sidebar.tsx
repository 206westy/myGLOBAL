'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Settings, HelpCircle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore, type MainTab } from '../../hooks/use-dashboard-store';
import { SIDEBAR_ITEMS, MAIN_TABS } from '../../constants/nav';
import { MyGlobalMark } from '../shared/my-global-mark';

const KPI_GROUPS = [
  { key: 'kpi-index',    label: 'KPI Index'     },
  { key: 'live-analysis', label: 'Live Analysis' },
  { key: 'forecast',     label: 'Forecast'      },
] as const;

const TAB_ROUTES: Record<MainTab, string> = {
  dashboard:  '/dashboard',
  workspace:  '/workspace',
  strategy:   '/strategy',
  aichat:     '/aichat',
};

function getActiveMainTab(pathname: string): MainTab {
  if (pathname.startsWith('/strategy'))  return 'strategy';
  if (pathname.startsWith('/workspace')) return 'workspace';
  if (pathname.startsWith('/aichat'))    return 'aichat';
  return 'dashboard';
}

export function Sidebar() {
  const pathname = usePathname();
  const activeMainTab = getActiveMainTab(pathname);
  const { activeSidebarItem, setSidebarItem } = useDashboardStore();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-card border-r border-outline-variant/30">
      {/* Logo + collapse — height matches ContentHeader row 1 (h-14) */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-2">
          <MyGlobalMark size={26} />
          <span className="font-headline text-[0.95rem] font-bold tracking-tight text-foreground">
            my<span className="text-primary">GLOBAL</span>
          </span>
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Search — aligned with ContentHeader row 2 (h-11) */}
      <div className="flex h-11 shrink-0 items-center border-b border-outline-variant/30 px-4">
        <div className="relative flex w-full items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            readOnly
            placeholder="Search"
            className="h-8 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low pl-8 pr-10 text-[0.78rem] text-muted-foreground placeholder:text-muted-foreground/60 outline-none cursor-default"
          />
          <span className="absolute right-2.5 flex items-center gap-0.5">
            <kbd className="rounded border border-outline-variant/40 px-1 py-px font-sans text-[0.58rem] text-muted-foreground/60">⌘</kbd>
            <kbd className="rounded border border-outline-variant/40 px-1 py-px font-sans text-[0.58rem] text-muted-foreground/60">K</kbd>
          </span>
        </div>
      </div>

      {/* Scrollable nav section */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {/* Main Menu — app-level navigation */}
        <p className="px-3 pb-1 pt-1 text-[0.63rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Main Menu
        </p>
        {MAIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMainTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={TAB_ROUTES[tab.id]}
              className={cn(
                'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 transition-colors duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-surface-container-low hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[0.82rem]">{tab.label}</span>
            </Link>
          );
        })}

        {/* KPI sub-groups — only when Dashboard is active */}
        {activeMainTab === 'dashboard' && (
          <div className="mt-2 space-y-1 border-t border-outline-variant/20 pt-3">
            {KPI_GROUPS.map((group) => {
              const items = SIDEBAR_ITEMS.filter((i) => i.group === group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  <p className="px-3 pb-1 pt-1 text-[0.63rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSidebarItem === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSidebarItem(item.id)}
                        className={cn(
                          'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 transition-colors duration-150',
                          isActive
                            ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold'
                            : 'text-muted-foreground hover:bg-surface-container-low hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-[0.82rem]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-outline-variant/30 px-3 py-3 space-y-0.5">
        <button className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[0.82rem] text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
          <Settings className="h-3.5 w-3.5 shrink-0" />
          Settings
        </button>
        <button className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[0.82rem] text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          Help Center
        </button>
      </div>
    </aside>
  );
}
