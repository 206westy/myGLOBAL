'use client';

import { cn } from '@/lib/utils';
import { type StrategyItem } from '@/features/strategy/lib/types';
import { type GanttRange, dayOffset, durationDays, isOverdue, formatDate } from '@/features/strategy/lib/gantt-range';
import { GANTT_COLORS } from '@/features/strategy/constants/strategy-config';

interface GanttBarProps {
  item: StrategyItem;
  range: GanttRange;
}

export function GanttBar({ item, range }: GanttBarProps) {
  if (!item.startedAt || !item.dueDate) return null;

  const startDate = new Date(item.startedAt);
  const endDate = new Date(item.dueDate);

  const startCol = dayOffset(startDate, range.start);
  const rawSpan = durationDays(startDate, endDate);
  // Clamp span so bar doesn't extend past range end
  const maxSpan = range.totalDays - startCol;
  const span = Math.min(Math.max(rawSpan, 1), Math.max(maxSpan, 1));

  const bgColor = GANTT_COLORS[item.status];
  const isLight = item.status === 'review' || item.status === 'done' || item.status === 'ready' || item.status === 'backlog';
  const textColor = isLight ? '#374151' : '#ffffff';
  const overdue = isOverdue(item.dueDate) && item.status !== 'done';

  return (
    <div
      style={{
        gridColumn: `${startCol + 1} / span ${span}`,
        backgroundColor: bgColor,
        color: textColor,
      }}
      className={cn(
        'my-2 h-8 rounded-lg flex items-center px-2 overflow-hidden cursor-pointer',
        overdue && 'ring-2 ring-rose-400',
      )}
      title={`${item.title} — ${item.progress}% 완료 · ${formatDate(item.dueDate)}`}
    >
      <span className="text-[0.65rem] font-medium truncate leading-none">
        {item.title}
      </span>
    </div>
  );
}
