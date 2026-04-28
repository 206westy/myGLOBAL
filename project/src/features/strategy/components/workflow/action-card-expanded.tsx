'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { EvidencePanel } from '../expanded-panels/evidence-panel';
import { ContextPanel } from '../expanded-panels/context-panel';
import { ImpactPanel } from '../expanded-panels/impact-panel';
import { ActivityPanel } from '../expanded-panels/activity-panel';
import type { ActionQueueRow } from '../../lib/workflow-types';

const PANEL_KEYS = ['evidence', 'context', 'impact', 'activity'] as const;

export function ActionCardExpanded({ row }: { row: ActionQueueRow }) {
  const idx = useWorkflowStore((s) => s.expandedTabIndex[row.card_id] ?? 0);
  const setIdx = useWorkflowStore((s) => s.setExpandedTabIndex);
  const value = PANEL_KEYS[idx];

  return (
    <Tabs
      value={value}
      onValueChange={(v) =>
        setIdx(row.card_id, PANEL_KEYS.indexOf(v as (typeof PANEL_KEYS)[number]))
      }
    >
      <TabsList>
        <TabsTrigger value="evidence">Evidence</TabsTrigger>
        <TabsTrigger value="context">Context</TabsTrigger>
        <TabsTrigger value="impact">Impact</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="evidence" className="mt-3">
        <EvidencePanel row={row} />
      </TabsContent>
      <TabsContent value="context" className="mt-3">
        <ContextPanel row={row} />
      </TabsContent>
      <TabsContent value="impact" className="mt-3">
        <ImpactPanel row={row} />
      </TabsContent>
      <TabsContent value="activity" className="mt-3">
        <ActivityPanel row={row} />
      </TabsContent>
    </Tabs>
  );
}
