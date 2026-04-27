'use client';

import { Loader2 } from 'lucide-react';
import { useActionQueue } from '../../../hooks/use-cip-queries';
import { EmptyQueue } from '../empty-queue';

export function DevelopTab() {
  const { data, isLoading } = useActionQueue('develop');

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
          tabLabel="Develop"
          hint="Lab milestone tracking and answer approval — activated in P1 alongside lab_milestone JSONB structuring."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <p className="text-sm text-muted-foreground">
        {data.length} item(s) waiting in Develop phase. Decision UI will be added in P1.
      </p>
      {data.map((r) => (
        <div key={r.card_id} className="rounded border p-3 text-sm">
          {r.title}
          <span className="ml-2 text-muted-foreground">— {r.context_line}</span>
        </div>
      ))}
    </div>
  );
}
