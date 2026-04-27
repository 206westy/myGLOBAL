'use client';

import { Lightbulb } from 'lucide-react';
import type { AiRecommendation } from '../../lib/workflow-types';

const ACTION_LABEL: Record<string, string> = {
  create_cip: 'Create CIP',
  keep_watch: 'Keep watching',
  dismiss: 'Dismiss',
  advance_to_solve: 'Advance to Solve',
  advance_to_deploy: 'Advance to Deploy',
};

export function AiSuggestionLine({ rec }: { rec: AiRecommendation | null }) {
  if (!rec) return null;
  // PRD v3.2 §3.3: 권고: [액션] · [근거1] · [근거2] · [근거3]
  // screening-llm produces reasons joined by ", " — split into chips
  const reasonParts = rec.reason
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const actionLabel = ACTION_LABEL[rec.recommended_action] ?? rec.recommended_action;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary-fixed/40 px-3 py-2 text-xs text-on-primary-fixed-variant">
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="flex-1 leading-relaxed">
        <span className="font-semibold">Recommendation:</span>{' '}
        <span className="rounded-md bg-primary-fixed px-1.5 py-0.5 font-semibold">
          {actionLabel}
        </span>
        {reasonParts.map((p, i) => (
          <span key={i}>
            <span className="mx-1.5 opacity-50">·</span>
            {p}
          </span>
        ))}
        <span className="ml-2 text-[10px] opacity-70">
          ({Math.round(rec.confidence * 100)}%)
        </span>
      </div>
    </div>
  );
}
