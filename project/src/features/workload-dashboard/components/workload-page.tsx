'use client';

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useChartCards } from '../hooks/use-chart-cards';
import { type DimensionKey, type MetricKey, type IndexDef } from '../lib/types';
import { IndexPalette } from './index-palette';
import { ChartCard } from './chart-card';

const METRIC_KEYS: MetricKey[]     = ['workload', 'pr', 'wpi', 'volume'];
const DIMENSION_KEYS: DimensionKey[] = [
  'country_code',
  'branch',
  'business_type_code',
  'act_type_code',
  'order_type_name',
  'partner_company_name',
];

const isMetricKey = (k: string): k is MetricKey =>
  (METRIC_KEYS as string[]).includes(k);
const isDimensionKey = (k: string): k is DimensionKey =>
  (DIMENSION_KEYS as string[]).includes(k);

export function WorkloadPage() {
  const cards         = useChartCards((s) => s.cards);
  const addCard       = useChartCards((s) => s.addCard);
  const toggleMetric  = useChartCards((s) => s.toggleMetric);
  const addFilter     = useChartCards((s) => s.addFilter);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const indexDef = active.data.current?.index as IndexDef | undefined;
    const zone     = over.data.current?.zone   as 'chart' | undefined;
    const cardId   = over.data.current?.cardId as string | undefined;
    if (zone !== 'chart' || !cardId || !indexDef) return;

    if (indexDef.kind === 'metric' && isMetricKey(indexDef.key)) {
      const card = cards.find((c) => c.id === cardId);
      if (card && !card.metrics.includes(indexDef.key)) {
        toggleMetric(cardId, indexDef.key);
      }
    } else if (indexDef.kind === 'dimension' && isDimensionKey(indexDef.key)) {
      addFilter(cardId, indexDef.key);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex">
        <aside className="sticky top-0 z-10 h-screen w-64 shrink-0 overflow-y-auto border-r border-outline-variant/30 bg-card">
          <IndexPalette />
        </aside>

        <div className="min-w-0 flex-1 space-y-4 p-6">
          {cards.map((card) => (
            <ChartCard
              key={card.id}
              card={card}
              removable={cards.length > 1}
            />
          ))}

          <button
            onClick={addCard}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-outline-variant/50 bg-card text-[0.78rem] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-fixed/30 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add Comparison Chart
          </button>
        </div>
      </div>
    </DndContext>
  );
}
