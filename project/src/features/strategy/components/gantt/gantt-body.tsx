'use client';

import { type StrategyItem, type StrategyStatus } from '@/features/strategy/lib/types';
import { type GanttRange, type GanttZoom, todayOffset } from '@/features/strategy/lib/gantt-range';
import { GanttTimelineHeader } from './gantt-timeline-header';
import { GanttRow } from './gantt-row';

interface GanttBodyProps {
  range: GanttRange;
  items: StrategyItem[];
  zoom: GanttZoom;
}

const STATUS_GROUPS: { status: StrategyStatus; label: string }[] = [
  { status: 'in_progress', label: '실행중' },
  { status: 'review', label: '리뷰' },
  { status: 'done', label: '완료' },
];

export function GanttBody({ range, items, zoom }: GanttBodyProps) {
  const colWidth = zoom === 'week' ? '2.5rem' : '1rem';
  const todayCol = todayOffset(range);

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ minWidth: 'max-content' }}>
        {/* Timeline header row */}
        <GanttTimelineHeader range={range} zoom={zoom} colWidth={colWidth} />

        {/* Today vertical line spanning full body */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${todayCol} * ${colWidth} + 192px)`,
            top: 0,
            bottom: 0,
            width: '2px',
            zIndex: 5,
          }}
          className="bg-primary/40 pointer-events-none"
        />

        {/* Grouped rows */}
        {STATUS_GROUPS.map(({ status, label }) => {
          const group = items.filter((it) => it.status === status);
          if (group.length === 0) return null;
          return (
            <div key={status}>
              {/* Group section header */}
              <div className="flex items-stretch h-8 border-b border-outline-variant/10 bg-surface-container-low/30">
                <div className="w-48 shrink-0 sticky left-0 bg-surface-container-low/30 z-10 flex items-center px-3">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                </div>
                <div
                  className="flex-1"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${range.totalDays}, ${colWidth})`,
                  }}
                />
              </div>
              {/* Item rows */}
              {group.map((item) => (
                <GanttRow key={item.id} item={item} range={range} colWidth={colWidth} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
