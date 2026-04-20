'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SectionCard } from '../../shared/section-card';
import { REWORK_DATASETS } from '../../../constants/rework-data';
import { useDashboardStore } from '../../../hooks/use-dashboard-store';

const COLORS = ['#5F3ADD', '#7857F8', '#A78BFA', '#C4B5FD', '#DDD6FE'];

export function ReworkDetailedAnalysisTab() {
  const { period } = useDashboardStore();
  const data = REWORK_DATASETS[period];

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Donut chart */}
      <div className="col-span-5">
        <SectionCard title="Rework by Category">
          <div className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.byCategory}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {data.byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [`${v}%`, name]}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid hsl(255 20% 81% / 0.3)',
                    fontSize: '0.75rem',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(210 12% 11%)' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Category table */}
      <div className="col-span-7">
        <SectionCard title="Category Breakdown">
          <div className="px-0 pb-6">
            <Table>
              <TableHeader>
                <TableRow className="border-outline-variant/30 hover:bg-transparent">
                  <TableHead className="pl-6 text-[0.68rem] uppercase tracking-wider">Category</TableHead>
                  <TableHead className="text-[0.68rem] uppercase tracking-wider">Share</TableHead>
                  <TableHead className="pr-6 text-right text-[0.68rem] uppercase tracking-wider">Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byCategory.map((cat, i) => (
                  <TableRow
                    key={cat.label}
                    className="border-outline-variant/20 hover:bg-surface-container-low/50"
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-[0.82rem] text-foreground">{cat.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[0.82rem] font-semibold tabular-nums text-foreground">
                      {cat.value}%
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-container-low">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${cat.value}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
