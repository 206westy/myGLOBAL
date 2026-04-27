'use client';

import { useDraggable } from '@dnd-kit/core';
import { LineChart, BarChart3, Activity, Gauge, Globe2, Building2, Briefcase, Wrench, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { METRIC_INDICES, DIMENSION_INDICES } from '../constants/indices';
import { type IndexDef } from '../lib/types';

const ICONS: Record<string, typeof LineChart> = {
  workload:             LineChart,
  pr:                   Activity,
  wpi:                  Gauge,
  volume:               BarChart3,
  country_code:         Globe2,
  branch:               Building2,
  business_type_code:   Briefcase,
  act_type_code:        Wrench,
  order_type_name:      Tag,
  partner_company_name: Briefcase,
};

function PaletteChip({ index }: { index: IndexDef }) {
  const Icon = ICONS[index.key] ?? LineChart;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${index.key}`,
    data: { source: 'palette', index },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex h-9 w-full cursor-grab items-center justify-start gap-2 rounded-full border px-3 text-[0.75rem] font-medium transition-colors select-none',
        index.kind === 'metric'
          ? 'border-primary/30 bg-primary-fixed text-primary hover:bg-primary/10'
          : 'border-outline-variant/40 bg-surface-container-low text-foreground hover:bg-surface-container',
        isDragging && 'opacity-40'
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{index.label}</span>
    </div>
  );
}

function PaletteSection({ title, items }: { title: string; items: IndexDef[] }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      <div className="flex flex-col gap-1.5">
        {items.map((idx) => (
          <PaletteChip key={idx.key} index={idx} />
        ))}
      </div>
    </section>
  );
}

export function IndexPalette() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <PaletteSection title="Metrics"    items={METRIC_INDICES} />
      <div className="h-px bg-outline-variant/30" />
      <PaletteSection title="Dimensions" items={DIMENSION_INDICES} />
    </div>
  );
}
