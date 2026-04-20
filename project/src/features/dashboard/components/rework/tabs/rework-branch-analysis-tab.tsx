'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { SectionCard } from '../../shared/section-card';
import { REWORK_DATASETS } from '../../../constants/rework-data';
import { useDashboardStore } from '../../../hooks/use-dashboard-store';

const TARGET = 7.9;

export function ReworkBranchAnalysisTab() {
  const { period } = useDashboardStore();
  const data = REWORK_DATASETS[period];

  const sorted = [...data.byBranch].sort((a, b) => b.rate - a.rate);

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-8">
        <SectionCard title="Rework Rate by Branch">
          <div className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={sorted}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                barSize={18}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(255 20% 81% / 0.5)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(251 10% 30%)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 25]}
                />
                <YAxis
                  type="category"
                  dataKey="branch"
                  tick={{ fontSize: 11, fill: 'hsl(251 10% 30%)' }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Rework Rate']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid hsl(255 20% 81% / 0.3)',
                    fontSize: '0.75rem',
                  }}
                  cursor={{ fill: 'hsl(255 20% 81% / 0.2)' }}
                />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                  {sorted.map((entry) => (
                    <Cell
                      key={entry.branch}
                      fill={entry.rate > TARGET * 1.5 ? '#F43F5E' : entry.rate > TARGET ? '#F59E0B' : '#5F3ADD'}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="col-span-4 space-y-4">
        <SectionCard className="p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Target
          </p>
          <p className="mt-1 font-headline text-2xl font-bold tracking-tight text-foreground">
            {TARGET}%
          </p>
          <p className="mt-1 text-[0.72rem] text-muted-foreground">Global rework target</p>
        </SectionCard>

        <SectionCard className="p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Above Target
          </p>
          <p className="mt-1 font-headline text-2xl font-bold tracking-tight text-rose-600">
            {sorted.filter((b) => b.rate > TARGET).length} branches
          </p>
          <div className="mt-3 space-y-1">
            {sorted
              .filter((b) => b.rate > TARGET)
              .slice(0, 4)
              .map((b) => (
                <div key={b.branch} className="flex items-center justify-between text-[0.75rem]">
                  <span className="text-foreground">{b.branch}</span>
                  <span className="font-semibold tabular-nums text-rose-600">{b.rate}%</span>
                </div>
              ))}
          </div>
        </SectionCard>

        <SectionCard className="p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
            On/Below Target
          </p>
          <p className="mt-1 font-headline text-2xl font-bold tracking-tight text-emerald-600">
            {sorted.filter((b) => b.rate <= TARGET).length} branches
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
