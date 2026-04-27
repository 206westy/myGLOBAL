'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { CardHeader } from './card-header';
import { AiSuggestionLine } from './ai-suggestion-line';
import { DecisionButtons } from './decision-buttons';
import { ActionCardExpanded } from './action-card-expanded';
import type { ActionQueueRow, DecisionOption } from '../../lib/workflow-types';

export function ActionCard({
  row,
  decisionOptions,
}: {
  row: ActionQueueRow;
  decisionOptions: DecisionOption[];
}) {
  const isExpanded = useWorkflowStore((s) => s.expandedCardIds.includes(row.card_id));
  const toggleExpand = useWorkflowStore((s) => s.toggleExpand);

  const isOverdue = row.sla_deadline ? new Date(row.sla_deadline) < new Date() : false;

  return (
    <div
      className={cn(
        'rounded-2xl border border-outline-variant/30 bg-card p-6',
        'shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200',
        'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
        row.priority === 'HIGH' && 'border-l-4 border-l-rose-500',
        isOverdue && 'border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20',
      )}
    >
      <div className="mb-3">
        <CardHeader row={row} />
      </div>

      <div className="mb-3">
        <AiSuggestionLine rec={row.ai_recommendation} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <DecisionButtons
          options={decisionOptions}
          recommendedAction={row.ai_recommendation?.recommended_action}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleExpand(row.card_id)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          <ActionCardExpanded row={row} />
        </div>
      )}
    </div>
  );
}
