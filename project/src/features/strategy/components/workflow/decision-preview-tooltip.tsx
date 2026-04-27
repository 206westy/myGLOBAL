'use client';

import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DecisionAction } from '../../lib/workflow-types';

const PREVIEW: Record<DecisionAction['kind'], string> = {
  create_cip: '→ Investigate queue · awaiting engineer assignment',
  keep_watch: '→ Stays in Detect (Reference) · re-evaluated next month',
  dismiss_screening: '→ Screening resolved · removed from queue',
  advance_to_solve: '→ Solve queue · CCB matching starts',
  request_more_investigation: '→ Stays in Investigate · note added',
  reject_investigation: '→ CIP cancelled · audit trail kept',
  advance_to_deploy: '→ Deploy queue · Where-used analysis next',
  collect_more_data: '→ Stays in Validate · note added',
  partial_deploy: '→ Deploy queue · journey type stays A',
};

export function DecisionPreviewTooltip({
  action,
  children,
}: {
  action: DecisionAction;
  children: ReactNode;
}) {
  const preview = PREVIEW[action.kind];
  if (!preview) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {preview}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
