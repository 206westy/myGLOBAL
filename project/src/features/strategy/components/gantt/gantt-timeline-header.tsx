'use client';

import { type GanttRange, type GanttZoom, buildWeekHeaders, buildMonthHeaders, todayOffset } from '@/features/strategy/lib/gantt-range';

interface GanttTimelineHeaderProps {
  range: GanttRange;
  zoom: GanttZoom;
  colWidth: string;
}

export function GanttTimelineHeader({ range, zoom, colWidth }: GanttTimelineHeaderProps) {
  const headers = zoom === 'week' ? buildWeekHeaders(range) : buildMonthHeaders(range);
  const todayCol = todayOffset(range);

  return (
    <div
      className="sticky top-0 z-10 bg-card border-b border-outline-variant/30 relative"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${range.totalDays}, ${colWidth})`,
      }}
    >
      {headers.map((h) => (
        <div
          key={h.startDay}
          style={{ gridColumn: `${h.startDay + 1} / span ${h.spanDays}` }}
          className="border-r border-outline-variant/20 px-2 py-1.5 text-[0.65rem] font-semibold text-muted-foreground"
        >
          {h.label}
        </div>
      ))}
      {/* Today indicator line in header */}
      <div
        style={{
          position: 'absolute',
          left: `calc(${todayCol} * ${colWidth})`,
          top: 0,
          bottom: 0,
          width: '2px',
          zIndex: 6,
        }}
        className="bg-primary/60 pointer-events-none"
      />
    </div>
  );
}
