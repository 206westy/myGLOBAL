'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { SectionCard } from '../shared/section-card';
import { OVERALL_REWORK_DATA } from '../../constants/overview-data';

const TARGET = 7.9;

export function OverallReworkChart() {
  return (
    <SectionCard>
      <div className="px-6 pt-5 pb-6">
        {/* Header row */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Overall Rework
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-headline text-2xl font-bold tracking-tight tabular-nums text-foreground">
                10.5%
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700">
                ↓ 7.7%
              </span>
            </div>
          </div>

          {/* Period legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-[0.72rem] text-muted-foreground">This period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-[0.72rem] text-muted-foreground">Last period</span>
            </div>
          </div>
        </div>

        {/* Target reference label */}
        <div className="mb-1 flex items-center gap-1.5">
          <div className="h-px w-5 border-t-2 border-dashed border-muted-foreground/40" />
          <span className="text-[0.65rem] text-muted-foreground">{TARGET}% target</span>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={OVERALL_REWORK_DATA} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="thisGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#5F3ADD" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#5F3ADD" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="lastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(255 20% 81% / 0.4)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10.5, fill: 'hsl(251 10% 30%)' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10.5, fill: 'hsl(251 10% 30%)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 20]}
            />
            <Tooltip
              formatter={(value, name) => [
                `${value}%`,
                name === 'thisPeriod' ? 'This period' : 'Last period',
              ]}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid hsl(255 20% 81% / 0.3)',
                fontSize: '0.73rem',
                boxShadow: '0px 8px 20px rgba(25,28,30,0.08)',
              }}
            />
            <ReferenceLine
              y={TARGET}
              stroke="hsl(251 10% 30% / 0.4)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
            />

            {/* Last period — amber, rendered first (behind) */}
            <Area
              type="monotone"
              dataKey="lastPeriod"
              stroke="#F59E0B"
              strokeWidth={1.5}
              fill="url(#lastGrad)"
              dot={false}
              activeDot={{ r: 3.5, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }}
            />
            {/* This period — primary, rendered on top */}
            <Area
              type="monotone"
              dataKey="thisPeriod"
              stroke="#5F3ADD"
              strokeWidth={2}
              fill="url(#thisGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#5F3ADD', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
