'use client';

import { Loader2, AlertTriangle, Microscope, FileText } from 'lucide-react';
import { useActionQueue } from '../../../hooks/use-cip-queries';
import { ActionQueueSection } from '../action-queue-section';
import { EmptyQueue } from '../empty-queue';
import type { ActionQueueRow, DecisionOption } from '../../../lib/workflow-types';

function buildDetectOptions(row: ActionQueueRow): DecisionOption[] {
  const screeningId = row.source_id;
  return [
    {
      label: 'Create CIP',
      action: { kind: 'create_cip', screeningId },
      isPrimary: true,
    },
    {
      label: 'Keep watching',
      action: { kind: 'keep_watch', screeningId, reason: '' },
      variant: 'outline',
    },
    {
      label: 'Dismiss',
      action: { kind: 'dismiss_screening', screeningId, reason: '' },
      variant: 'outline',
    },
  ];
}

export function DetectTab() {
  const { data, isLoading, error } = useActionQueue('detect');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load queue: {(error as Error).message}
      </div>
    );
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <div className="p-4">
        <EmptyQueue tabLabel="Detect" hint="No alerts or watch items currently waiting." />
      </div>
    );
  }

  const urgent = rows.filter((r) => r.urgency_group === 'URGENT');
  const normal = rows.filter((r) => r.urgency_group === 'NORMAL');
  const reference = rows.filter((r) => r.urgency_group === 'REFERENCE');

  return (
    <div className="space-y-6 p-4">
      <ActionQueueSection
        title="Urgent — high-priority new alerts"
        icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        rows={urgent}
        buildOptions={buildDetectOptions}
      />
      <ActionQueueSection
        title="Normal — watch items with significant trend"
        icon={<Microscope className="h-4 w-4 text-blue-500" />}
        rows={normal}
        buildOptions={buildDetectOptions}
      />
      <ActionQueueSection
        title="Reference — currently watched (no action)"
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        rows={reference}
        buildOptions={buildDetectOptions}
      />
    </div>
  );
}
