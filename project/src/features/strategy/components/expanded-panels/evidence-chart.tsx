'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import type { EvidencePoint } from '../../lib/workflow-types';

interface ChartDatum {
  ym: string;
  label: string;
  call_count: number;
  is_current: boolean;
}

function formatYm(ym: string): string {
  if (ym.length !== 6) return ym;
  const y = ym.slice(2, 4);
  const m = parseInt(ym.slice(4, 6), 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} '${y}`;
}

interface CurrentDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDatum;
}

function CurrentDot(props: CurrentDotProps) {
  const { cx, cy, payload } = props;
  if (!payload?.is_current || cx === undefined || cy === undefined) return null;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={5}
      fill="hsl(var(--primary))"
      stroke="hsl(var(--background))"
      strokeWidth={2}
    />
  );
}

export function EvidenceChart({
  points,
  ucl,
  avg,
}: {
  points: EvidencePoint[];
  ucl?: number | null;
  avg?: number;
}) {
  const data: ChartDatum[] = points.map((p) => ({
    ym: p.year_month,
    label: formatYm(p.year_month),
    call_count: p.call_count,
    is_current: p.is_current,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.3)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
          <YAxis tick={{ fontSize: 10 }} width={28} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid hsl(var(--outline-variant) / 0.3)',
            }}
            labelFormatter={(label: string) => label}
            formatter={(value: number) => [`${value} calls`, 'Calls']}
          />
          {avg !== undefined && (
            <ReferenceLine
              y={avg}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              label={{
                value: `avg ${avg.toFixed(1)}`,
                position: 'right',
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))',
              }}
            />
          )}
          {ucl !== null && ucl !== undefined && (
            <ReferenceLine
              y={ucl}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 4"
              label={{
                value: `UCL ${ucl.toFixed(1)}`,
                position: 'right',
                fontSize: 10,
                fill: 'hsl(var(--destructive))',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="call_count"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={(props: CurrentDotProps) => <CurrentDot {...props} />}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
