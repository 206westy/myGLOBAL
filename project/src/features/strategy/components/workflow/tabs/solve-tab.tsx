'use client';

import { useState } from 'react';
import { Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActionQueue } from '../../../hooks/use-cip-queries';
import { EmptyQueue } from '../empty-queue';
import { SolveIntakePanel } from './solve-intake-panel';

export function SolveTab() {
  const { data, isLoading } = useActionQueue('solve');
  const [activeCip, setActiveCip] = useState<{ id: string; cipNo: string } | null>(null);

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
          tabLabel="Solve"
          hint="No CIPs waiting for solution discovery. Items advance here from Investigate."
        />
      </div>
    );
  }

  if (activeCip) {
    return (
      <div className="space-y-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveCip(null)} className="text-xs">
          ← Back to Solve queue
        </Button>
        <SolveIntakePanel
          cipId={activeCip.id}
          cipNo={activeCip.cipNo}
          onClose={() => setActiveCip(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary-fixed/40 px-4 py-3 text-sm text-on-primary-fixed-variant">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">7-Question intake</span> — guided diagnostic that funnels
          CCB candidates and produces a final recommendation. Click a card to start.
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
              <Sparkles className="h-3 w-3" />
              Start intake
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
