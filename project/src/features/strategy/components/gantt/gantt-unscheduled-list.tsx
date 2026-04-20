'use client';

import { type StrategyItem } from '@/features/strategy/lib/types';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { StatusDot } from '@/features/strategy/components/shared/status-dot';
import { EffortBadge } from '@/features/strategy/components/shared/effort-badge';
import { ImpactPill } from '@/features/strategy/components/shared/impact-pill';

interface GanttUnscheduledListProps {
  items: StrategyItem[];
}

export function GanttUnscheduledList({ items }: GanttUnscheduledListProps) {
  if (items.length === 0) return null;

  return (
    <SectionCard title={`일정 미정 (Unscheduled) · ${items.length}`}>
      <div className="pb-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-2 px-4 flex items-center gap-2 border-b border-outline-variant/10 text-[0.82rem] last:border-b-0"
          >
            <StatusDot status={item.status} />
            <span className="flex-1 min-w-0 truncate font-medium text-foreground">
              {item.title}
            </span>
            <EffortBadge effort={item.effort} />
            <ImpactPill text={item.expectedImpact} />
            <button className="text-primary text-[0.75rem] font-medium whitespace-nowrap hover:underline ml-1 flex-shrink-0">
              일정 설정하기
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
