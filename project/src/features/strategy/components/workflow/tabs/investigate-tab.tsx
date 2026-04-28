'use client';

import { Loader2, AlertTriangle, Microscope, Hourglass } from 'lucide-react';
import { useActionQueue } from '../../../hooks/use-cip-queries';
import { ActionQueueSection } from '../action-queue-section';
import { EmptyQueue } from '../empty-queue';
import type { ActionQueueRow, DecisionOption } from '../../../lib/workflow-types';

function buildInvestigateOptions(row: ActionQueueRow): DecisionOption[] {
  const cipId = row.source_id;
  return [
    {
      label: 'Advance to Solve',
      action: { kind: 'advance_to_solve', cipId },
      isPrimary: true,
    },
    {
      label: 'Request more investigation',
      action: { kind: 'request_more_investigation', cipId, reason: '' },
      variant: 'outline',
    },
    {
      label: 'Reject',
      action: { kind: 'reject_investigation', cipId, reason: '' },
      variant: 'outline',
    },
  ];
}

export function InvestigateTab() {
  const { data, isLoading } = useActionQueue('investigate');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <div className="p-4">
        <EmptyQueue
          tabLabel="Investigate"
          hint="No CIP items waiting in the investigation phase."
        />
      </div>
    );
  }

  const urgent = rows.filter((r) => r.urgency_group === 'URGENT');
  const normal = rows.filter((r) => r.urgency_group === 'NORMAL');
  const reference = rows.filter((r) => r.urgency_group === 'REFERENCE');

  return (
    <div className="space-y-6 p-4">
      <ActionQueueSection
        title="Urgent — investigation deadline imminent"
        icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        rows={urgent}
        buildOptions={buildInvestigateOptions}
      />
      <ActionQueueSection
        title="Normal — investigation complete, awaiting review"
        icon={<Microscope className="h-4 w-4 text-blue-500" />}
        rows={normal}
        buildOptions={buildInvestigateOptions}
      />
      <ActionQueueSection
        title="Reference — engineer working (no manager action)"
        icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}
        rows={reference}
        buildOptions={() => []}
        collapsedByDefault
      />
    </div>
  );
}
