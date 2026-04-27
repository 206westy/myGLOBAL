'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ActionQueueRow } from '../../lib/workflow-types';

function priorityToScore(priority: string): number {
  // PRD §3.1 mentions a 0-100 risk score; for P0 we derive from priority.
  // Real risk model (priority + cusum + 영향비율 + hint count weighted) is P1+.
  if (priority === 'HIGH') return 85;
  if (priority === 'MEDIUM') return 50;
  return 25;
}

export function CardHeader({ row }: { row: ActionQueueRow }) {
  const meta = row.meta as Record<string, string | number | null>;
  const modelName = (meta.model_name as string | null) ?? (meta.model_code as string | null) ?? '?';
  const customerLineName =
    (meta.customer_line_name as string | null) ?? (meta.customer_line_code as string | null) ?? '?';
  const partGroupName =
    (meta.part_group_name as string | null) ?? (meta.part_group_code as string | null) ?? '?';

  const isOverdue = row.sla_deadline ? new Date(row.sla_deadline) < new Date() : false;
  const daysToSla = row.sla_deadline
    ? Math.ceil((new Date(row.sla_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isSlaImminent = daysToSla !== null && daysToSla >= 0 && daysToSla <= 3;

  const score = priorityToScore(row.priority);
  const callCount = meta.call_count;
  const affected = meta.affected_equip_count;
  const total = meta.total_equip_count;
  const cusum = meta.cusum_value;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={row.priority === 'HIGH' ? 'destructive' : 'secondary'} className="h-5">
          {row.priority}
        </Badge>
        <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          Risk {score}
        </span>
        <span className="font-mono text-muted-foreground">{row.cip_no ?? row.step}</span>
        <span className="ml-auto flex items-center gap-2 text-muted-foreground">
          <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] uppercase tracking-wider">
            Unassigned
          </span>
          {row.sla_deadline && daysToSla !== null && (
            <span
              className={cn(
                'font-medium',
                isOverdue && 'text-rose-600',
                isSlaImminent && !isOverdue && 'text-amber-600',
              )}
            >
              {isOverdue ? `D+${Math.abs(daysToSla)}` : `D-${daysToSla}`}
            </span>
          )}
        </span>
      </div>

      <h3 className="font-headline text-base font-semibold tracking-tight leading-snug">
        <span>{modelName}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span>{customerLineName}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span>{partGroupName}</span>
      </h3>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {callCount !== null && callCount !== undefined && (
          <span><span className="font-medium text-foreground">{callCount}</span> calls</span>
        )}
        {affected !== null && affected !== undefined && total !== null && total !== undefined && (
          <span>
            영향 설비 <span className="font-medium text-foreground">{affected}/{total}</span>
          </span>
        )}
        {cusum !== null && cusum !== undefined && (
          <span>
            CUSUM <span className="font-medium text-foreground">{Number(cusum).toFixed(1)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
