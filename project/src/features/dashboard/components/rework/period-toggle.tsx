'use client';

import { cn } from '@/lib/utils';
import { type Period, useDashboardStore } from '../../hooks/use-dashboard-store';

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',    label: 'Yearly'    },
];

export function PeriodToggle() {
  const { period, setPeriod } = useDashboardStore();

  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-container-low p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setPeriod(opt.value)}
          className={cn(
            'rounded-full px-4 py-1.5 text-[0.75rem] font-medium transition-all duration-200',
            period === opt.value
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
