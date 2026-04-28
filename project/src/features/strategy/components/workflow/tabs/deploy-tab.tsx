'use client';

import { useEffect, useState } from 'react';
import { Loader2, Share2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useActionQueue } from '../../../hooks/use-cip-queries';
import { EmptyQueue } from '../empty-queue';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface WhereUsedTarget {
  equip_no: string;
  customer_line_code: string | null;
  country_code: string | null;
  tier: 'same_line' | 'same_country' | 'other';
  already_deployed: boolean;
}

interface WhereUsedResponse {
  targets: WhereUsedTarget[];
  count: number;
  breakdown: { same_line: number; same_country: number; other: number };
}

const TIER_LABEL: Record<WhereUsedTarget['tier'], string> = {
  same_line: 'Same line',
  same_country: 'Same country',
  other: 'Other regions',
};

export function DeployTab() {
  const { data, isLoading } = useActionQueue('deploy');
  const qc = useQueryClient();
  const [activeCip, setActiveCip] = useState<{ id: string; cipNo: string } | null>(null);
  const [whereUsed, setWhereUsed] = useState<WhereUsedResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scheduling, setScheduling] = useState(false);
  const [tierFilter, setTierFilter] = useState<'all' | WhereUsedTarget['tier']>('all');
  const [loadingWhere, setLoadingWhere] = useState(false);

  useEffect(() => {
    if (!activeCip) return;
    setLoadingWhere(true);
    setWhereUsed(null);
    setSelected(new Set());
    fetch(`/api/where-used?cipId=${activeCip.id}`)
      .then((r) => r.json())
      .then((d: WhereUsedResponse | { error: string }) => {
        if ('error' in d) throw new Error(d.error);
        setWhereUsed(d);
      })
      .catch((e: Error) => toast({ title: 'Where-used failed', description: e.message, variant: 'destructive' }))
      .finally(() => setLoadingWhere(false));
  }, [activeCip]);

  function toggle(equipNo: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(equipNo)) next.delete(equipNo);
      else next.add(equipNo);
      return next;
    });
  }

  function selectTier(tier: WhereUsedTarget['tier']) {
    if (!whereUsed) return;
    const ids = whereUsed.targets
      .filter((t) => t.tier === tier && !t.already_deployed)
      .map((t) => t.equip_no);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function schedule() {
    if (!activeCip || selected.size === 0) return;
    setScheduling(true);
    try {
      const res = await fetch('/api/where-used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cipId: activeCip.id, equipNos: Array.from(selected) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: 'Rollout scheduled', description: `${selected.size} target(s)` });
      qc.invalidateQueries({ queryKey: ['action-queue'] });
      qc.invalidateQueries({ queryKey: ['action-queue-counts'] });
      // Refetch where-used to mark them as already_deployed
      const refetch = await fetch(`/api/where-used?cipId=${activeCip.id}`).then((r) => r.json());
      setWhereUsed(refetch);
      setSelected(new Set());
    } catch (e) {
      toast({ title: 'Schedule failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setScheduling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <EmptyQueue
          tabLabel="Deploy"
          hint="No CIPs in deployment phase. Items advance here from Validate or via Solve's Apply-existing path."
        />
      </div>
    );
  }

  if (activeCip) {
    const filteredTargets =
      whereUsed?.targets.filter((t) => tierFilter === 'all' || t.tier === tierFilter) ?? [];

    return (
      <div className="space-y-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveCip(null)} className="text-xs">
          ← Back to Deploy queue
        </Button>

        <div className="rounded-2xl border border-outline-variant/30 bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-headline text-sm font-semibold tracking-tight">
              Where-used candidates — {activeCip.cipNo}
            </h3>
            {whereUsed && (
              <span className="text-xs text-muted-foreground">
                {whereUsed.count} candidate(s)
              </span>
            )}
          </div>

          {whereUsed && (
            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
              {(['same_line', 'same_country', 'other'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectTier(t)}
                  className="rounded-lg border border-primary/20 bg-primary-fixed/30 px-3 py-2 text-on-primary-fixed-variant transition-colors hover:bg-primary-fixed/50"
                >
                  <div className="font-headline text-sm font-semibold">
                    {whereUsed.breakdown[t]}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">
                    {TIER_LABEL[t]} · select all
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Filter:</span>
            {(['all', 'same_line', 'same_country', 'other'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTierFilter(t)}
                className={cn(
                  'rounded-full px-3 py-1 transition-colors',
                  tierFilter === t
                    ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold'
                    : 'text-muted-foreground hover:bg-surface-container-low',
                )}
              >
                {t === 'all' ? 'All' : TIER_LABEL[t]}
              </button>
            ))}
          </div>

          {loadingWhere && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loadingWhere && whereUsed && (
            <div className="max-h-96 overflow-y-auto rounded-lg border border-outline-variant/30">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface-container-low text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-8 px-3 py-2"></th>
                    <th className="px-3 py-2">Equipment</th>
                    <th className="px-3 py-2">Line</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">Tier</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTargets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        No candidates in this tier.
                      </td>
                    </tr>
                  )}
                  {filteredTargets.map((t) => (
                    <tr
                      key={t.equip_no}
                      className={cn(
                        'border-t border-outline-variant/30',
                        t.already_deployed && 'opacity-50',
                      )}
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(t.equip_no)}
                          onCheckedChange={() => toggle(t.equip_no)}
                          disabled={t.already_deployed}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono">{t.equip_no}</td>
                      <td className="px-3 py-2">{t.customer_line_code ?? '-'}</td>
                      <td className="px-3 py-2">{t.country_code ?? '-'}</td>
                      <td className="px-3 py-2">{TIER_LABEL[t.tier]}</td>
                      <td className="px-3 py-2">
                        {t.already_deployed ? (
                          <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-semibold text-on-primary-fixed-variant">
                            Scheduled
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selected.size} selected
            </span>
            <Button onClick={schedule} disabled={scheduling || selected.size === 0}>
              {scheduling ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Scheduling…
                </>
              ) : (
                `Schedule rollout (${selected.size})`
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary-fixed/40 px-4 py-3 text-sm text-on-primary-fixed-variant">
        <Share2 className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Journey B + Where-used analysis</span> — pick a CIP to
          see equipment candidates by tier (same line / same country / other) and schedule rollout.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
        {data.map((row) => (
          <button
            key={row.card_id}
            type="button"
            onClick={() => setActiveCip({ id: row.source_id, cipNo: row.cip_no ?? row.step })}
            className="group rounded-2xl border border-outline-variant/30 bg-card p-5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                {row.cip_no ?? row.step}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <h3 className="mb-1 line-clamp-2 font-headline text-sm font-semibold tracking-tight">
              {row.title}
            </h3>
            <p className="text-xs text-muted-foreground">{row.context_line}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-fixed/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-primary-fixed-variant">
              <Share2 className="h-3 w-3" />
              Plan rollout
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
