'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type GanttZoom } from '@/features/strategy/lib/gantt-range';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';

interface GanttToolbarProps {
  zoom: GanttZoom;
  setZoom: (z: GanttZoom) => void;
  anchorOffset: number;
  setAnchorOffset: (n: number) => void;
}

const ZOOM_OPTIONS: { value: GanttZoom; label: string }[] = [
  { value: 'week', label: '주 단위' },
  { value: 'month', label: '월 단위' },
];

export function GanttToolbar({ zoom, setZoom, anchorOffset, setAnchorOffset }: GanttToolbarProps) {
  const isToday = anchorOffset === 0;

  return (
    <SectionCard className="px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: title */}
        <h3 className="font-headline text-base font-semibold text-foreground whitespace-nowrap">
          간트 차트
        </h3>

        {/* Middle: zoom toggle pills */}
        <div className="flex items-center rounded-full bg-surface-container-low p-1 gap-0.5">
          {ZOOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setZoom(opt.value)}
              className={cn(
                'rounded-full px-3 py-1 text-[0.75rem] transition-all',
                zoom === opt.value
                  ? 'bg-card shadow-sm font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Right: navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAnchorOffset(anchorOffset - 1)}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-outline-variant/30 hover:bg-surface-container-low text-muted-foreground transition-colors"
            aria-label="이전"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setAnchorOffset(0)}
            className={cn(
              'rounded-full px-3 text-[0.75rem] h-7 transition-colors font-medium',
              isToday
                ? 'bg-primary text-primary-foreground'
                : 'border border-outline-variant/30 hover:bg-surface-container-low text-muted-foreground',
            )}
          >
            오늘
          </button>

          <button
            onClick={() => setAnchorOffset(anchorOffset + 1)}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-outline-variant/30 hover:bg-surface-container-low text-muted-foreground transition-colors"
            aria-label="다음"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
