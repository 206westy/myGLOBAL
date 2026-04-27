'use client';

import { useScreeningHistory } from '../../hooks/use-cip-queries';
import { TrendSparkline } from '../charts/trend-sparkline';
import type { ActionQueueRow } from '../../lib/workflow-types';

export function EvidencePanel({ row }: { row: ActionQueueRow }) {
  const meta = row.meta as Record<string, string | number | null>;
  const isScreening = row.card_id.startsWith('screening:');

  const modelCode = isScreening ? String(meta.model_code ?? '') : '';
  const customerLineCode = isScreening ? String(meta.customer_line_code ?? '') : '';
  const partGroupCode = isScreening ? String(meta.part_group_code ?? '') : '';

  const { data: history } = useScreeningHistory(modelCode, customerLineCode, partGroupCode);

  if (!isScreening) {
    return (
      <p className="text-sm text-muted-foreground">
        Decision evidence will be added in P1 along with cip_items aggregation.
      </p>
    );
  }

  const trendData = (history ?? []).map((h) => ({
    month: h.year_month,
    value: h.call_count,
  }));

  return (
    <div className="space-y-3">
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
          Call frequency trend
        </h4>
        <TrendSparkline data={trendData} />
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="Calls" value={meta.call_count != null ? String(meta.call_count) : '-'} />
        <Stat
          label="CUSUM"
          value={meta.cusum_value != null ? Number(meta.cusum_value).toFixed(1) : '-'}
        />
        <Stat
          label="UCL"
          value={meta.cusum_ucl != null ? Number(meta.cusum_ucl).toFixed(1) : '-'}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
