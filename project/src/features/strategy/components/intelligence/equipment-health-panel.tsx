'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface HealthRow {
  equip_no: string;
  model_code: string | null;
  country_code: string | null;
  customer_line_code: string | null;
  month: string;
  total_calls: number | null;
  rework_calls: number | null;
  avg_work_time: number | null;
  unique_defect_codes: number | null;
}

/**
 * Naive health score: 100 - clamp(20 * normalized_calls + 30 * rework_rate + 10 * defect_diversity).
 * The real implementation will live in a SQL view; this component computes client-side as a
 * preview while the team aligns on the formula.
 */
function computeScore(row: HealthRow): number {
  const calls = row.total_calls ?? 0;
  const rework = row.rework_calls ?? 0;
  const defects = row.unique_defect_codes ?? 0;
  const reworkRate = calls > 0 ? rework / calls : 0;
  const callPenalty = Math.min(40, calls * 0.5);
  const reworkPenalty = reworkRate * 30;
  const defectPenalty = Math.min(15, defects * 1.5);
  return Math.max(0, Math.round(100 - callPenalty - reworkPenalty - defectPenalty));
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-on-primary-fixed-variant';
  if (score >= 40) return 'text-amber-600';
  return 'text-rose-600';
}

export function EquipmentHealthPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['intel', 'health'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('mv_equipment_monthly_summary')
        .select(
          'equip_no, model_code, country_code, customer_line_code, month, total_calls, rework_calls, avg_work_time, unique_defect_codes',
        )
        .order('month', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (rows ?? []) as HealthRow[];
    },
  });

  // Latest month per equipment
  const latestPerEquip = new Map<string, HealthRow>();
  for (const r of data ?? []) {
    if (!latestPerEquip.has(r.equip_no)) latestPerEquip.set(r.equip_no, r);
  }
  const ranked = Array.from(latestPerEquip.values())
    .map((r) => ({ ...r, score: computeScore(r) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 30);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <header>
        <h2 className="font-headline text-xl font-bold tracking-tight">Equipment health</h2>
        <p className="text-sm text-muted-foreground">
          Lowest health scores from latest month. Score = 100 − (call × 0.5 + rework rate × 30 +
          defect diversity × 1.5). Formula will be replaced with team-agreed weights.
        </p>
      </header>

      <div className="rounded-2xl border border-outline-variant/30 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-3">
          <h3 className="font-headline text-sm font-semibold">Lowest 30 (latest month)</h3>
          <span className="text-xs text-muted-foreground">
            {latestPerEquip.size} equipment tracked
          </span>
        </div>
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2">Equipment</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Line</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2 text-right">Calls</th>
              <th className="px-3 py-2 text-right">Rework</th>
              <th className="px-3 py-2 text-right">Defects</th>
              <th className="px-5 py-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {ranked.length === 0 && (
              <tr>
                <td colSpan={9} className="p-5 text-center text-muted-foreground">
                  No equipment health data available.
                </td>
              </tr>
            )}
            {ranked.map((r) => (
              <tr key={r.equip_no} className="border-t border-outline-variant/20">
                <td className="px-5 py-2 font-mono">{r.equip_no}</td>
                <td className="px-3 py-2">{r.model_code ?? '—'}</td>
                <td className="px-3 py-2">{r.customer_line_code ?? '—'}</td>
                <td className="px-3 py-2">{r.country_code ?? '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.month}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.total_calls ?? '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.rework_calls ?? '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.unique_defect_codes ?? '—'}
                </td>
                <td className="px-5 py-2 text-right">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-headline font-bold tabular-nums',
                      scoreColor(r.score),
                    )}
                  >
                    <Activity className="h-3 w-3" />
                    {r.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
