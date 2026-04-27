'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Settings, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '../../hooks/use-dashboard-store';
import { SIDEBAR_ITEMS } from '../../constants/nav';
import { MyGlobalMark } from '../shared/my-global-mark';

const KPI_GROUPS = [
  { key: 'kpi-index',     label: 'Historical Analytics' },
  { key: 'live-analysis', label: 'Real-Time Analytics'  },
  { key: 'forecast',      label: 'Forecast Analytics'   },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard') || pathname === '/';
  const {
    activeSidebarItem,
    setSidebarItem,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
  } = useDashboardStore();

  // Auto-collapse when Workload page is active; auto-expand otherwise.
  useEffect(() => {
    setSidebarCollapsed(activeSidebarItem === 'workload');
  }, [activeSidebarItem, setSidebarCollapsed]);

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-outline-variant/30 bg-card transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Logo + collapse — height matches ContentHeader row 1 (h-14) */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-outline-variant/30',
          collapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <MyGlobalMark size={26} />
            <span className="font-headline text-[0.95rem] font-bold tracking-tight text-foreground">
              my<span className="text-primary">GLOBAL</span>
            </span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Search — aligned with ContentHeader row 2 (h-11) */}
      <div
        className={cn(
          'flex h-11 shrink-0 items-center border-b border-outline-variant/30',
          collapsed ? 'justify-center px-0' : 'px-4'
        )}
      >
        {collapsed ? (
          <button
            aria-label="Search"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        ) : (
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
        )}
      </div>

      {/* Scrollable nav section */}
      <nav className={cn('flex-1 space-y-1 overflow-y-auto py-3', collapsed ? 'px-1.5' : 'px-3')}>
        {/* KPI sub-groups — only when Dashboard is active */}
        {isDashboard && (
          <div className={cn('mt-2 space-y-1 border-t border-outline-variant/20 pt-3')}>
            {KPI_GROUPS.map((group) => {
              const items = SIDEBAR_ITEMS.filter((i) => i.group === group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  {!collapsed && (
                    <p className="px-3 pb-1 pt-1 text-[0.63rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                  )}
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSidebarItem === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSidebarItem(item.id)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'flex h-9 w-full items-center rounded-lg transition-colors duration-150',
                          collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
                          isActive
                            ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold'
                            : 'text-muted-foreground hover:bg-surface-container-low hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {!collapsed && <span className="truncate text-[0.82rem]">{item.label}</span>}
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
      <div className={cn('shrink-0 space-y-0.5 border-t border-outline-variant/30 py-3', collapsed ? 'px-1.5' : 'px-3')}>
        <button
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'flex h-9 w-full items-center rounded-lg text-[0.82rem] text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
          )}
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && 'Settings'}
        </button>
        <button
          title={collapsed ? 'Help Center' : undefined}
          className={cn(
            'flex h-9 w-full items-center rounded-lg text-[0.82rem] text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
          )}
        >
          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && 'Help Center'}
        </button>
      </div>
    </aside>
  );
}
