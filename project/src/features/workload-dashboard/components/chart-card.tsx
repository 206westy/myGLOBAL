'use client';

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { X, Activity, Gauge, BarChart3, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { useChartCards } from '../hooks/use-chart-cards';
import { aggregate, granularityForRange, summarizeKpis } from '../lib/aggregation';
import { MOCK_MONTHS } from '../constants/mock-data';
import { METRIC_INDICES, METRIC_COLORS } from '../constants/indices';
import { type ChartCardConfig, type MetricKey } from '../lib/types';
import { FilterPill } from './filter-pill';
import { WorkloadChart } from './workload-chart';

const METRIC_ICONS: Record<MetricKey, typeof LineChart> = {
  workload: LineChart,
  pr:       Activity,
  wpi:      Gauge,
  volume:   BarChart3,
};

interface ChartCardProps {
  card: ChartCardConfig;
  removable: boolean;
}

export function ChartCard({ card, removable }: ChartCardProps) {
  const removeCard       = useChartCards((s) => s.removeCard);
  const removeMetric     = useChartCards((s) => s.removeMetric);
  const removeFilter     = useChartCards((s) => s.removeFilter);
  const setFilterValues  = useChartCards((s) => s.setFilterValues);
  const setBrushRange    = useChartCards((s) => s.setBrushRange);

  const { setNodeRef, isOver } = useDroppable({
    id: `chart-${card.id}`,
    data: { zone: 'chart', cardId: card.id },
  });

  const kpis = useMemo(() => {
    const [startPct, endPct] = card.brushRange;
    const monthsInView = Math.max(1, ((endPct - startPct) / 100) * MOCK_MONTHS.length);
    const g = granularityForRange(monthsInView);
    return summarizeKpis(aggregate(card.filters, g));
  }, [card.filters, card.brushRange]);

  const filterSummary = card.filters.length === 0
    ? 'No filters — full dataset'
    : card.filters.map((f) => `${f.dimension}=${f.values.length === 0 ? 'All' : f.values.length}`).join(' · ');

  const hasActive = card.metrics.length > 0 || card.filters.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-2xl transition-shadow',
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <SectionCard className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-headline text-sm font-semibold tracking-tight text-foreground">
              Workload Chart
            </h3>
            <span className="text-[0.7rem] text-muted-foreground">{filterSummary}</span>
          </div>
          {removable && (
            <button
              onClick={() => removeCard(card.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground"
              aria-label="Remove chart"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Active strip — metric chips + filter pills, or hint */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 pb-1 pt-3">
          {!hasActive ? (
            <span className="text-[0.7rem] text-muted-foreground">
              왼쪽 팔레트에서 메트릭 또는 디멘전을 끌어다 놓으세요
            </span>
          ) : (
            <>
              {card.metrics.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {METRIC_INDICES.filter((m) => card.metrics.includes(m.key as MetricKey)).map((m) => {
                    const Icon = METRIC_ICONS[m.key as MetricKey];
                    return (
                      <span
                        key={m.key}
                        className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 pr-1 text-[0.72rem] font-medium"
                        style={{ borderColor: METRIC_COLORS[m.key], color: METRIC_COLORS[m.key], backgroundColor: `${METRIC_COLORS[m.key]}14` }}
                      >
                        <Icon className="h-3 w-3" />
                        {m.label}
                        <button
                          onClick={() => removeMetric(card.id, m.key as MetricKey)}
                          className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {card.metrics.length > 0 && card.filters.length > 0 && (
                <span className="h-4 w-px bg-outline-variant/40" />
              )}
              {card.filters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {card.filters.map((f) => (
                    <FilterPill
                      key={f.dimension}
                      dimension={f.dimension}
                      values={f.values}
                      onChange={(values) => setFilterValues(card.id, f.dimension, values)}
                      onRemove={() => removeFilter(card.id, f.dimension)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3 px-5 pt-4">
          <KpiBlock label="Total Volume" value={`${kpis.totalVolume.toLocaleString()}h`} />
          <KpiBlock label="Avg Workload" value={kpis.avgWorkload.toFixed(2)} />
          <KpiBlock label="Peak Period"  value={kpis.peakPeriod} />
          <KpiBlock label="Peak Volume"  value={`${kpis.peakVolume.toLocaleString()}h`} />
        </div>

        {/* Chart */}
        <div className="px-2 pb-3 pt-4">
          <WorkloadChart
            config={card}
            onBrushChange={(range) => setBrushRange(card.id, range)}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function KpiBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 px-3 py-2">
      <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-headline text-base font-bold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
