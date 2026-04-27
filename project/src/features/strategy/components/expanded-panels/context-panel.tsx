'use client';

import type { ActionQueueRow } from '../../lib/workflow-types';

export function ContextPanel({ row }: { row: ActionQueueRow }) {
  const meta = row.meta as Record<string, string | number | null>;
  return (
    <div className="space-y-3 text-sm">
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
          Target information
        </h4>
        <dl className="grid grid-cols-2 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Model</dt>
          <dd>{meta.model_code != null ? String(meta.model_code) : '-'}</dd>
          <dt className="text-muted-foreground">Customer line</dt>
          <dd>{meta.customer_line_code != null ? String(meta.customer_line_code) : '-'}</dd>
          <dt className="text-muted-foreground">Part group</dt>
          <dd>{meta.part_group_code != null ? String(meta.part_group_code) : '-'}</dd>
          <dt className="text-muted-foreground">Equipment</dt>
          <dd>{meta.equip_no != null ? String(meta.equip_no) : '-'}</dd>
        </dl>
      </div>
      <p className="text-xs text-muted-foreground">
        Related service orders, prior history on the same line, and reference documents will be
        added in P1.
      </p>
    </div>
  );
}
