'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeltaPillProps {
  value: string;
  positive: boolean;
}

export function DeltaPill({ value, positive }: DeltaPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold',
        positive
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-rose-50 text-rose-600'
      )}
    >
      {positive ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {value}
    </span>
  );
}
