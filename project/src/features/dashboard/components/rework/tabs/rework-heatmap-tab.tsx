'use client';

import { SectionCard } from '../../shared/section-card';
import { REWORK_DATASETS, BRANCHES } from '../../../constants/rework-data';
import { useDashboardStore } from '../../../hooks/use-dashboard-store';
import { cn } from '@/lib/utils';

function getRateColor(rate: number): string {
  if (rate < 6)  return 'bg-primary/10 text-primary';
  if (rate < 10) return 'bg-primary/20 text-primary';
  if (rate < 14) return 'bg-amber-100 text-amber-800';
  if (rate < 18) return 'bg-rose-100 text-rose-700';
  return 'bg-rose-200 text-rose-800';
}

export function ReworkHeatmapTab() {
  const { period } = useDashboardStore();
  const data = REWORK_DATASETS[period];

  // Group heatmap by period
  const periods = Array.from(new Set(data.heatmap.map((c) => c.period)));
  const cellMap = new Map(data.heatmap.map((c) => [`${c.branch}|${c.period}`, c.rate]));

  return (
    <SectionCard title="Rework Heatmap">
      <div className="overflow-x-auto px-6 pb-6">
        <div className="min-w-max">
          {/* Header row */}
          <div
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: `140px repeat(${periods.length}, minmax(52px, 1fr))` }}
          >
            <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground px-2" />
            {periods.map((p) => (
              <div
                key={p}
                className="text-center text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground px-1"
              >
                {p}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {BRANCHES.map((branch) => (
            <div
              key={branch}
              className="grid gap-1 mb-1"
              style={{ gridTemplateColumns: `140px repeat(${periods.length}, minmax(52px, 1fr))` }}
            >
              <div className="flex items-center pr-3 text-[0.78rem] text-foreground font-medium">
                {branch}
              </div>
              {periods.map((p) => {
                const rate = cellMap.get(`${branch}|${p}`) ?? 0;
                return (
                  <div
                    key={p}
                    title={`${branch} · ${p}: ${rate}%`}
                    className={cn(
                      'flex items-center justify-center rounded-md py-2 text-[0.65rem] font-semibold tabular-nums transition-opacity duration-200 hover:opacity-80 cursor-default',
                      getRateColor(rate)
                    )}
                  >
                    {rate.toFixed(1)}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[0.68rem] text-muted-foreground">Rework rate:</span>
            {[
              { label: '<6%',    cls: 'bg-primary/10' },
              { label: '6–10%',  cls: 'bg-primary/20' },
              { label: '10–14%', cls: 'bg-amber-100'  },
              { label: '14–18%', cls: 'bg-rose-100'   },
              { label: '>18%',   cls: 'bg-rose-200'   },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span className={cn('h-3 w-5 rounded-sm', l.cls)} />
                <span className="text-[0.65rem] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
