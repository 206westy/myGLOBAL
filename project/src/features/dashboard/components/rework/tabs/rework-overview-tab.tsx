'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SectionCard } from '../../shared/section-card';
import { DeltaPill } from '../../shared/delta-pill';
import { REWORK_DATASETS } from '../../../constants/rework-data';
import { useDashboardStore } from '../../../hooks/use-dashboard-store';

export function ReworkOverviewTab() {
  const { period } = useDashboardStore();
  const data = REWORK_DATASETS[period];

  const stats = [
    { label: 'Avg Rework Rate', value: `${data.avgRework}%`, delta: '-0.9%', positive: true },
    { label: 'Worst Branch',    value: data.worstBranch,     delta: `${data.worstRate}%`, positive: false },
    { label: 'Best Branch',     value: data.bestBranch,      delta: `${data.bestRate}%`,  positive: true  },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-5">
        {stats.map((s) => (
          <SectionCard key={s.label} className="p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
                {s.value}
              </span>
              <DeltaPill value={s.delta} positive={s.positive} />
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Rework Rate Trend">
        <div className="px-6 pb-6">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(255 20% 81% / 0.5)" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: 'hsl(251 10% 30%)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(251 10% 30%)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Rework Rate']}
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid hsl(255 20% 81% / 0.3)',
                  fontSize: '0.75rem',
                  boxShadow: '0px 8px 20px rgba(25,28,30,0.08)',
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#5F3ADD"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#5F3ADD', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
