'use client';

import { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RegenResult {
  ok?: boolean;
  processed?: number;
  llmCalls?: number;
  ruleCalls?: number;
  llmAvailable?: boolean;
  hint?: string;
  error?: string;
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function AiToolsPage() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [status, setStatus] = useState<'alert' | 'watch' | 'all'>('alert');
  const [limit, setLimit] = useState(100);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RegenResult | null>(null);

  async function regenerate() {
    setRunning(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = { yearMonth, limit };
      if (status !== 'all') body.status = status;
      const res = await fetch('/api/admin/regenerate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as RegenResult;
      setResult(data);
    } catch (e) {
      setResult({ error: (e as Error).message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight">AI Tools</h1>
        <p className="text-sm text-muted-foreground">
          Regenerate AI recommendations for screening results. Uses OpenAI gpt-5.4-mini when{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">OPENAI_API_KEY</code> is set;
          otherwise falls back to the rule-based generator (rule_v1).
        </p>
      </header>

      <div className="rounded-2xl border border-outline-variant/30 bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h2 className="mb-3 flex items-center gap-2 font-headline text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Regenerate screening recommendations
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Year-month (YYYYMM)
            </label>
            <Input
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              placeholder="202604"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="alert">alert only</option>
              <option value="watch">watch only</option>
              <option value="all">all (alert + watch)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Row limit
            </label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={1}
              max={1000}
              className="text-sm"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end">
          <Button onClick={regenerate} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Regenerating…
              </>
            ) : (
              'Regenerate'
            )}
          </Button>
        </div>
      </div>

      {result && (
        <div
          className={
            result.error
              ? 'rounded-2xl border border-rose-200/60 bg-rose-50/60 p-4 text-sm text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
              : 'rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground'
          }
        >
          <div className="mb-2 flex items-center gap-2">
            {result.error ? (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            )}
            <span className="font-headline font-semibold">
              {result.error ? 'Regeneration failed' : 'Regeneration complete'}
            </span>
          </div>
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <ul className="space-y-1 text-xs">
              <li>Processed: {result.processed}</li>
              <li>OpenAI calls: {result.llmCalls}</li>
              <li>Rule fallback: {result.ruleCalls}</li>
              <li>OpenAI key configured: {result.llmAvailable ? 'yes' : 'no'}</li>
              {result.hint && <li className="opacity-70">{result.hint}</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
