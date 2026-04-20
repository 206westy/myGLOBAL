'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface TrendSparklineProps {
  data: { month: string; value: number }[];
  color?: string;
  className?: string;
}

export function TrendSparkline({
  data,
  color = 'hsl(var(--primary))',
  className,
}: TrendSparklineProps) {
  if (data.length < 2) return null;

  return (
    <div className={cn('h-10 w-[120px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
