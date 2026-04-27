'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, LineChart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface PlanRow {
  id: string;
  cip_id: string;
  plan_type: string | null;
  status: string | null;
  overall_result: string | null;
  result_data: Record<string, unknown> | null;
  created_at: string;
}

export function EffectivenessPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['intel', 'effectiveness'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('cip_test_plans')
        .select('id, cip_id, plan_type, status, overall_result, result_data, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (rows ?? []) as PlanRow[];
    },
  });

  const counts = (data ?? []).reduce(
    (acc, r) => {
      const key = r.overall_result ?? 'pending';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

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
        <h2 className="font-headline text-xl font-bold tracking-tight">Effectiveness</h2>
        <p className="text-sm text-muted-foreground">
          Outcome of CIP test plans (IQ/OQ/PQ, A/B test, marathon). Statistical tests will be added
          via an Edge Function in a future iteration.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {(['pass', 'partial', 'fail', 'pending'] as const).map((k) => (
          <div
            key={k}
            className="rounded-2xl border border-outline-variant/30 bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          >
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {k}
            </div>
            <div className="mt-1 font-headline text-2xl font-bold tracking-tight">
              {counts[k] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h3 className="border-b border-outline-variant/30 px-5 py-3 font-headline text-sm font-semibold">
          Recent test plans
        </h3>
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2">CIP</th>
              <th className="px-3 py-2">Plan type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-5 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-5 text-center text-muted-foreground">
                  <LineChart className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                  No test plans yet. Validate tab will populate this once test plans are created.
                </td>
              </tr>
            )}
            {(data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-outline-variant/20">
                <td className="px-5 py-2 font-mono">{r.cip_id.slice(0, 8)}…</td>
                <td className="px-3 py-2">{r.plan_type ?? '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.status ?? '—'}</td>
                <td className="px-3 py-2">{r.overall_result ?? '—'}</td>
                <td className="px-5 py-2 text-muted-foreground">{r.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
