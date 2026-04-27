'use client';

import { Loader2, CheckCircle, FlaskConical, Clipboard } from 'lucide-react';
import { useActionQueue } from '../../../hooks/use-cip-queries';
import { ActionQueueSection } from '../action-queue-section';
import { EmptyQueue } from '../empty-queue';
import type { ActionQueueRow, DecisionOption } from '../../../lib/workflow-types';

function buildValidateOptions(row: ActionQueueRow): DecisionOption[] {
  const cipId = row.source_id;
  return [
    {
      label: 'Advance to Deploy',
      action: { kind: 'advance_to_deploy', cipId },
      isPrimary: true,
    },
    {
      label: 'Collect more data',
      action: { kind: 'collect_more_data', cipId, reason: '' },
      variant: 'outline',
    },
    {
      label: 'Partial deploy only',
      action: { kind: 'partial_deploy', cipId, reason: '' },
      variant: 'outline',
    },
  ];
}

export function ValidateTab() {
  const { data, isLoading } = useActionQueue('validate');

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
          tabLabel="Validate"
          hint="No CIPs in the validation phase. Items will appear after Detect → Investigate → Solve → Develop."
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
        title="Effectiveness results — final decision"
        icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        rows={urgent}
        buildOptions={buildValidateOptions}
      />
      <ActionQueueSection
        title="Test in progress"
        icon={<FlaskConical className="h-4 w-4 text-blue-500" />}
        rows={normal}
        buildOptions={buildValidateOptions}
      />
      <ActionQueueSection
        title="Test preparation"
        icon={<Clipboard className="h-4 w-4 text-muted-foreground" />}
        rows={reference}
        buildOptions={buildValidateOptions}
      />
    </div>
  );
}
