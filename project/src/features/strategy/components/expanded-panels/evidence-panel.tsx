'use client';

import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEvidence12Month } from '../../hooks/use-cip-queries';
import { deriveEvidenceStats } from '../../api';
import { EvidenceChart } from './evidence-chart';
import type { ActionQueueRow } from '../../lib/workflow-types';

export function EvidencePanel({ row }: { row: ActionQueueRow }) {
  const meta = row.meta as Record<string, string | number | null>;
  const modelCode = meta.model_code as string | null;
  const customerLineCode = meta.customer_line_code as string | null;
  const partGroupCode = meta.part_group_code as string | null;

  const { data: points, isLoading } = useEvidence12Month(
    modelCode ?? undefined,
    customerLineCode ?? undefined,
    partGroupCode ?? undefined,
  );

  if (!modelCode || !customerLineCode || !partGroupCode) {
    return (
      <p className="text-sm text-muted-foreground">
        Evidence requires model/line/part_group context (not available for this card).
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = deriveEvidenceStats(points ?? [], meta);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 font-headline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          12-month call frequency
        </h4>
        <EvidenceChart points={points ?? []} ucl={stats.cusumUcl} avg={stats.callsAvg} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Calls (this month)"
          value={stats.callsThisMonth.toString()}
          comparison={
            stats.callsAvg > 0 ? (
              <ComparisonChip
                value={stats.callsChangePct}
                format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}% vs avg`}
              />
            ) : null
          }
        />
        <Stat
          label="CUSUM"
          value={stats.cusumValue !== null ? stats.cusumValue.toFixed(1) : '—'}
          comparison={
            stats.cusumMultiplier !== null ? (
              <span className={stats.cusumMultiplier > 1 ? 'text-rose-600' : 'text-muted-foreground'}>
                {stats.cusumMultiplier.toFixed(1)}× UCL
              </span>
            ) : null
          }
        />
        <Stat
          label="Affected equip"
          value={
            stats.affectedRatio !== null
              ? `${stats.affectedRatio.toFixed(0)}%`
              : '—'
          }
          comparison={
            <span className="text-muted-foreground">vs model avg (P1)</span>
          }
        />
        <Stat
          label="Trend p-value"
          value={stats.trendPValue !== null ? stats.trendPValue.toFixed(3) : '—'}
          comparison={
            stats.trendPValue !== null ? (
              <span className={stats.trendIsSignificant ? 'text-rose-600' : 'text-muted-foreground'}>
                {stats.trendIsSignificant ? 'Significant (p<0.1)' : 'Not significant'}
              </span>
            ) : null
          }
        />
      </div>

      <p className="text-[10px] text-muted-foreground/70">
        Source: <code className="rounded bg-surface-container-low px-1">service_orders</code>{' '}
        grouped by month for the same (model · line · part_group). Qualitative hints will appear once
        description data accumulates (Phase 2).
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  comparison,
}: {
  label: string;
  value: string;
  comparison: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/30 bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-headline text-base font-semibold">{value}</div>
      {comparison && <div className="mt-1 text-[11px]">{comparison}</div>}
    </div>
  );
}

function ComparisonChip({
  value,
  format,
}: {
  value: number;
  format: (v: number) => string;
}) {
  const Icon = value > 5 ? TrendingUp : value < -5 ? TrendingDown : Minus;
  const color = value > 5 ? 'text-rose-600' : value < -5 ? 'text-emerald-600' : 'text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="h-3 w-3" />
      {format(value)}
    </span>
  );
}
