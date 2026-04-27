'use client';

import { format } from 'date-fns';
import type { ActionQueueRow } from '../../lib/workflow-types';

export function ActivityPanel({ row }: { row: ActionQueueRow }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="text-xs">
        <span className="text-muted-foreground">Created: </span>
        {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm')}
      </div>
      {row.sla_deadline && (
        <div className="text-xs">
          <span className="text-muted-foreground">SLA deadline: </span>
          {format(new Date(row.sla_deadline), 'yyyy-MM-dd HH:mm')}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Comments, mentions, and attachments will be added in P1 along with cip_comments
        integration.
      </p>
    </div>
  );
}
