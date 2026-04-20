'use client';

import { cn } from '@/lib/utils';
import { PRIORITY_CONFIG } from '@/features/strategy/constants/strategy-config';
import { type Priority } from '@/features/strategy/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold',
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
      )}
    >
      {cfg.label}
    </span>
  );
}
