'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, Settings, HelpCircle, ChevronLeft,
  BarChart3, Activity, LineChart,
  Columns3, CalendarRange, ScanSearch,
  Upload, Play, Database, Users,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore, type StrategyView } from '../../hooks/use-dashboard-store';
import { SIDEBAR_ITEMS } from '../../constants/nav';
import { MyGlobalMark } from '../shared/my-global-mark';

const KPI_GROUPS = [
  { key: 'kpi-index',    label: 'KPI Index'     },
  { key: 'live-analysis', label: 'Live Analysis' },
  { key: 'forecast',     label: 'Forecast'      },
] as const;

interface StrategySidebarItem {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  view?: StrategyView;
  href?: string;
  disabled?: boolean;
}

const STRATEGY_INTELLIGENCE: StrategySidebarItem[] = [
  { key: 'cip-roi',       label: 'CIP ROI',              icon: BarChart3, disabled: true },
  { key: 'equip-health',  label: 'Equipment health',     icon: Activity,  disabled: true },
  { key: 'effectiveness', label: 'Effectiveness',        icon: LineChart, disabled: true },
];

const STRATEGY_AUX: StrategySidebarItem[] = [
  { key: 'kanban',    label: 'Kanban (7 columns)', icon: Columns3,      view: 'kanban' },
  { key: 'gantt',     label: 'Timeline (Gantt)',   icon: CalendarRange, view: 'gantt' },
  { key: 'screening', label: 'Screening archive',  icon: ScanSearch,    view: 'screening-archive' },
];

const STRATEGY_SETTINGS: StrategySidebarItem[] = [
  { key: 'import',  label: 'CSV Import',     icon: Upload,   href: '/admin/import' },
  { key: 'run',     label: 'Run screening',  icon: Play,     view: 'screening-run' },
  { key: 'lookups', label: 'Lookup tables',  icon: Database, disabled: true },
  { key: 'users',   label: 'Users / Roles',  icon: Users,    disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard') || pathname === '/';
  const isStrategy = pathname.startsWith('/strategy');
  const { activeSidebarItem, setSidebarItem, activeStrategyView, setStrategyView } = useDashboardStore();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-card border-r border-outline-variant/30">
      {/* Logo + collapse — height matches ContentHeader row 1 (h-14) */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-outline-variant/30">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <MyGlobalMark size={26} />
          <span className="font-headline text-[0.95rem] font-bold tracking-tight text-foreground">
            my<span className="text-primary">GLOBAL</span>
          </span>
        </Link>
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
        {/* KPI sub-groups — only when Dashboard is active */}
        {isDashboard && (
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

        {/* Strategy sidebar — Intelligence / Workflow Aux / Settings */}
        {isStrategy && (
          <div className="mt-2 space-y-3">
            {activeStrategyView !== 'workflow' && (
              <button
                onClick={() => setStrategyView('workflow')}
                className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-[0.78rem] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                Back to Workflow
              </button>
            )}

            <StrategySidebarGroup
              title="Intelligence"
              items={STRATEGY_INTELLIGENCE}
              activeView={activeStrategyView}
              onSelectView={setStrategyView}
            />
            <StrategySidebarGroup
              title="Workflow Aux"
              items={STRATEGY_AUX}
              activeView={activeStrategyView}
              onSelectView={setStrategyView}
            />
            <StrategySidebarGroup
              title="Settings"
              items={STRATEGY_SETTINGS}
              activeView={activeStrategyView}
              onSelectView={setStrategyView}
            />
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

function StrategySidebarGroup({
  title,
  items,
  activeView,
  onSelectView,
}: {
  title: string;
  items: StrategySidebarItem[];
  activeView: StrategyView;
  onSelectView: (v: StrategyView) => void;
}) {
  return (
    <div>
      <p className="px-3 pb-1 pt-1 text-[0.63rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = !!item.view && activeView === item.view;

        const className = cn(
          'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 transition-colors duration-150 text-left',
          isActive
            ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold'
            : item.disabled
              ? 'text-muted-foreground/50 cursor-not-allowed'
              : 'text-muted-foreground hover:bg-surface-container-low hover:text-foreground',
        );

        if (item.href) {
          return (
            <Link key={item.key} href={item.href} className={className}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-[0.82rem]">{item.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => !item.disabled && item.view && onSelectView(item.view)}
            disabled={item.disabled}
            className={className}
            title={item.disabled ? 'Available in P1' : undefined}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-[0.82rem]">{item.label}</span>
            {item.disabled && (
              <span className="ml-auto text-[0.6rem] text-muted-foreground/60">P1</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
