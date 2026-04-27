'use client';

import type { ComponentType } from 'react';
import { Search, Wrench, Wand2, FlaskConical, ShieldCheck, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { useQueueCounts } from '../../hooks/use-cip-queries';
import { WORKFLOW_TABS, type WorkflowTabKey } from '../../lib/workflow-types';

const TAB_ICON: Record<WorkflowTabKey, ComponentType<{ className?: string }>> = {
  detect: Search,
  investigate: Wrench,
  solve: Wand2,
  develop: FlaskConical,
  validate: ShieldCheck,
  deploy: Share2,
};

export function WorkflowHeaderBar() {
  const activeTab = useWorkflowStore((s) => s.activeTab);
  const setActiveTab = useWorkflowStore((s) => s.setActiveTab);
  const { data: counts } = useQueueCounts();

  return (
    <div className="flex h-12 items-center gap-1 border-b border-border bg-background px-4">
      {WORKFLOW_TABS.map(({ key, label, steps }) => {
        const Icon = TAB_ICON[key];
        const tabCount = counts?.find((c) => c.tab === key);
        const total = tabCount?.total_count ?? 0;
        const hasUrgent = tabCount?.has_urgent ?? false;
        const isActive = activeTab === key;
        const isEmpty = total === 0;

        return (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'group relative flex h-full min-w-[120px] items-center gap-2 rounded-t-md px-3 transition-colors',
              isActive && 'border-b-2 border-primary bg-muted/50',
              !isActive && 'hover:bg-muted/30',
              isEmpty && 'opacity-60',
            )}
          >
            <Icon className={cn('h-4 w-4', isEmpty && 'text-muted-foreground')} />
            <div className="flex flex-col items-start leading-tight">
              <span className={cn('text-sm font-medium', isEmpty && 'text-muted-foreground')}>
                {label}
              </span>
              <span className="text-[10px] text-muted-foreground">STEP {steps}</span>
            </div>
            {total > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                {total}
              </Badge>
            )}
            {hasUrgent && (
              <span className="absolute right-2 top-1.5 inline-block h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
