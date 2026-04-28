'use client';

import { Inbox } from 'lucide-react';

export function EmptyQueue({ tabLabel, hint }: { tabLabel: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/40 bg-background p-12 text-center">
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/60" />
      <p className="font-headline text-sm font-semibold text-foreground">No items to process</p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        {hint ?? `No items currently waiting in ${tabLabel}.`}
      </p>
    </div>
  );
}
