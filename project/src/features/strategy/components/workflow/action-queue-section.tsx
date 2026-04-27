'use client';

import type { ReactNode } from 'react';
import type { ActionQueueRow, DecisionOption } from '../../lib/workflow-types';
import { ActionCard } from './action-card';

export function ActionQueueSection({
  title,
  icon,
  rows,
  buildOptions,
}: {
  title: string;
  icon: ReactNode;
  rows: ActionQueueRow[];
  buildOptions: (row: ActionQueueRow) => DecisionOption[];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
        <span className="text-xs text-muted-foreground">({rows.length})</span>
      </h3>
      <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <ActionCard key={row.card_id} row={row} decisionOptions={buildOptions(row)} />
        ))}
      </div>
    </section>
  );
}
