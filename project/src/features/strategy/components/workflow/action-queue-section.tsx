'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionQueueRow, DecisionOption } from '../../lib/workflow-types';
import { ActionCard } from './action-card';

interface ActionQueueSectionProps {
  title: string;
  icon: ReactNode;
  rows: ActionQueueRow[];
  buildOptions: (row: ActionQueueRow) => DecisionOption[];
  /** When true, the section starts collapsed and shows only the count. */
  collapsedByDefault?: boolean;
}

export function ActionQueueSection({
  title,
  icon,
  rows,
  buildOptions,
  collapsedByDefault = false,
}: ActionQueueSectionProps) {
  const [expanded, setExpanded] = useState(!collapsedByDefault);

  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left transition-colors',
          'hover:bg-surface-container-low/40',
        )}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        {icon}
        <h3 className="font-headline text-sm font-semibold tracking-tight">{title}</h3>
        <span className="text-xs font-normal text-muted-foreground">({rows.length})</span>
      </button>

      {expanded && (
        <div className="space-y-3">
          {rows.map((row) => (
            <ActionCard key={row.card_id} row={row} decisionOptions={buildOptions(row)} />
          ))}
        </div>
      )}
    </section>
  );
}
