'use client';

import { Lightbulb } from 'lucide-react';
import type { AiRecommendation } from '../../lib/workflow-types';

export function AiSuggestionLine({ rec }: { rec: AiRecommendation | null }) {
  if (!rec) return null;
  return (
    <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <span className="font-medium">Recommendation:</span> {rec.reason}
        <span className="ml-2 text-xs text-amber-700 dark:text-amber-300/70">
          (confidence {Math.round(rec.confidence * 100)}%)
        </span>
      </div>
    </div>
  );
}
