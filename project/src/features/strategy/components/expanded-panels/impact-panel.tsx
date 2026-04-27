'use client';

import type { ActionQueueRow } from '../../lib/workflow-types';

export function ImpactPanel({ row }: { row: ActionQueueRow }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-muted-foreground">
        Impact analysis (Where-used / Collaborative Filtering) will be added in P1.
      </p>
      {row.ai_recommendation && (
        <div className="rounded-md border p-3 text-xs">
          <div className="mb-1 font-semibold">Current recommendation rationale</div>
          <div>{row.ai_recommendation.reason}</div>
        </div>
      )}
    </div>
  );
}
