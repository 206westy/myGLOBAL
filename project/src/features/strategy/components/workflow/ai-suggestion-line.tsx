'use client';

import { Lightbulb } from 'lucide-react';
import type { AiRecommendation } from '../../lib/workflow-types';

export function AiSuggestionLine({ rec }: { rec: AiRecommendation | null }) {
  if (!rec) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary-fixed/40 px-3 py-2 text-xs text-on-primary-fixed-variant">
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="flex-1">
        <span className="font-semibold">Recommendation:</span> {rec.reason}
        <span className="ml-2 text-[10px] opacity-70">
          (confidence {Math.round(rec.confidence * 100)}%)
        </span>
      </div>
    </div>
  );
}
