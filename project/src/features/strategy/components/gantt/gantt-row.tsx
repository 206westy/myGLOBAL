'use client';

import { type StrategyItem } from '@/features/strategy/lib/types';
import { type GanttRange } from '@/features/strategy/lib/gantt-range';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { StatusDot } from '@/features/strategy/components/shared/status-dot';
import { GanttBar } from './gantt-bar';

interface GanttRowProps {
  item: StrategyItem;
  range: GanttRange;
  colWidth: string;
}

export function GanttRow({ item, range, colWidth }: GanttRowProps) {
  const setSelectedItem = useStrategyStore((s) => s.setSelectedItem);

  return (
    <div
      className="flex items-stretch h-12 border-b border-outline-variant/10 hover:bg-surface-container-low/50 cursor-pointer"
      onClick={() => setSelectedItem(item.id)}
    >
      {/* Left sticky label column */}
      <div className="w-48 shrink-0 sticky left-0 bg-card z-10 flex items-center gap-2 px-3 border-r border-outline-variant/20">
        <StatusDot status={item.status} />
        <span className="text-[0.78rem] font-medium text-foreground truncate flex-1 min-w-0">
          {item.title}
        </span>
        {/* Owner initials avatar */}
        <span
          className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[0.52rem] font-bold text-white"
          style={{ backgroundColor: item.owner.color }}
          title={item.owner.name}
        >
          {item.owner.initials}
        </span>
      </div>

      {/* Bar area — grid matches header */}
      <div
        className="flex-1"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${range.totalDays}, ${colWidth})`,
        }}
      >
        <GanttBar item={item} range={range} />
      </div>
    </div>
  );
}
