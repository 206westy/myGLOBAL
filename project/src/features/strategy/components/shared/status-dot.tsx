'use client';

import { cn } from '@/lib/utils';
import { COLUMN_MAP } from '@/features/strategy/constants/strategy-config';
import { type StrategyStatus } from '@/features/strategy/lib/types';

interface StatusDotProps {
  status: StrategyStatus;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full flex-shrink-0',
        COLUMN_MAP[status].dotClass,
        className,
      )}
    />
  );
}
