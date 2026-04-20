'use client';

import { EFFORT_CONFIG } from '@/features/strategy/constants/strategy-config';
import { type Effort } from '@/features/strategy/lib/types';

interface EffortBadgeProps {
  effort: Effort;
}

export function EffortBadge({ effort }: EffortBadgeProps) {
  const cfg = EFFORT_CONFIG[effort];
  return (
    <span
      className="bg-gray-100 text-gray-600 text-[0.65rem] font-medium rounded-md px-2 py-0.5"
      title={cfg.label}
    >
      {effort}
    </span>
  );
}
