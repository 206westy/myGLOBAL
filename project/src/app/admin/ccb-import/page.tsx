'use client';

import { useState } from 'react';
import { Loader2, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ImportResult {
  ok?: boolean;
  received?: number;
  inserted?: number;
  updated?: number;
  embeddingsPending?: number;
  hint?: string;
  error?: string;
  sampleInvalid?: unknown[];
}

const SAMPLE_JSONL = `{"ccb_no":"CCB-2025-Q1-001","title":"RF Cable shielding upgrade","summary":"Replace AWG-22 with shielded AWG-20","target_model":["050"],"target_module":["EFEM"],"country_codes":["KR"],"solution_type":"part_replacement","verified":true}
{"ccb_no":"CCB-2025-Q1-002","title":"PM2 source baseplate retorque","summary":"Increase torque spec from 35Nm to 45Nm","target_model":["050","101"],"target_module":["PM2"],"verified":true}`;

export default function CcbImportPage() {
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onUpload() {
    if (!text.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const resp = await fetch('/api/admin/import-ccb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonl: text }),
      });
      const data = (await resp.json()) as ImportResult;
      setResult(data);
    } catch (e) {
      setResult({ error: (e as Error).message });
    } finally {
      setRunning(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight">CCB JSONL Import</h1>
        <p className="text-sm text-muted-foreground">
          Bulk-load CCB documents from JSONL. One JSON object per line. Embeddings remain NULL
          until <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/admin/embed-ccb</code>{' '}
          is run with OPENAI_API_KEY.
        </p>
      </header>

      <div className="rounded-2xl border border-outline-variant/30 bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-headline text-sm font-semibold">JSONL input</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setText(SAMPLE_JSONL)}
            >
              Load sample
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".jsonl,.txt,.json"
                onChange={onFileChange}
                className="hidden"
              />
              <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
                <Upload className="h-3.5 w-3.5" /> Choose file
              </span>
            </label>
          </div>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder='{"ccb_no":"CCB-2025-Q1-001","title":"...","target_model":["050"],...}'
          className="font-mono text-xs"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {text.split(/\r?\n/).filter((l) => l.trim()).length} non-empty line(s)
          </span>
          <Button onClick={onUpload} disabled={running || !text.trim()}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…
              </>
            ) : (
              'Import'
            )}
          </Button>
        </div>
      </div>

      {result && (
        <div
          className={
            result.error
              ? 'rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
              : 'rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
          }
        >
          <div className="mb-2 flex items-center gap-2">
            {result.error ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span className="font-headline font-semibold">
              {result.error ? 'Import failed' : 'Import complete'}
            </span>
          </div>
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <ul className="space-y-1 text-xs">
              <li>Received: {result.received}</li>
              <li>Inserted: {result.inserted}</li>
              <li>Updated: {result.updated}</li>
              <li>Embeddings pending: {result.embeddingsPending}</li>
              {result.hint && <li className="opacity-70">{result.hint}</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
