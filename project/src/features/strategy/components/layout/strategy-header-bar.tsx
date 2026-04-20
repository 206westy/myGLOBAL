'use client';

import { ScanSearch, Columns3, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore, type StrategyView } from '@/features/dashboard/hooks/use-dashboard-store';
import { useCipItems } from '@/features/strategy/hooks/use-cip-queries';

interface TabDef {
  value: StrategyView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STRATEGY_TABS: TabDef[] = [
  { value: 'screening', label: '스크리닝',  icon: ScanSearch    },
  { value: 'kanban',    label: 'CIP 보드',  icon: Columns3      },
  { value: 'gantt',     label: '타임라인',   icon: CalendarRange },
];

export function StrategyHeaderBar() {
  const activeStrategyView = useDashboardStore((s) => s.activeStrategyView);
  const setStrategyView    = useDashboardStore((s) => s.setStrategyView);
  const { data: cipItems } = useCipItems();

  return (
    <div className="flex h-11 items-center justify-between px-7">
      {/* Left: strategy sub-tab buttons */}
      <div className="flex items-center gap-0.5">
        {STRATEGY_TABS.map(({ value, label, icon: Icon }) => {
          const isActive = activeStrategyView === value;
          return (
            <button
              key={value}
              onClick={() => setStrategyView(value)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.8rem] font-medium transition-colors duration-150',
                isActive
                  ? 'bg-surface-container-low text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-surface-container-low/60 hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {value === 'kanban' && (
                <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[0.62rem] px-1.5 py-px tabular-nums">
                  {cipItems?.length ?? 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Strategy badge */}
      <span className="text-[0.72rem] font-medium bg-primary-fixed text-on-primary-fixed-variant rounded-full px-3 py-1">
        Strategy
      </span>
    </div>
  );
}
