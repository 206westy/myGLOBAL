'use client';

import { Inbox } from 'lucide-react';

export function EmptyQueue({ tabLabel, hint }: { tabLabel: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/60" />
      <p className="text-sm font-medium text-muted-foreground">No items to process</p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        {hint ?? `No items currently waiting in ${tabLabel}.`}
      </p>
    </div>
  );
}
