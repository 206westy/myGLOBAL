'use client';

import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { DetectTab } from './tabs/detect-tab';
import { InvestigateTab } from './tabs/investigate-tab';
import { SolveTab } from './tabs/solve-tab';
import { DevelopTab } from './tabs/develop-tab';
import { ValidateTab } from './tabs/validate-tab';
import { DeployTab } from './tabs/deploy-tab';

export function WorkflowTabContent() {
  const tab = useWorkflowStore((s) => s.activeTab);
  switch (tab) {
    case 'detect':
      return <DetectTab />;
    case 'investigate':
      return <InvestigateTab />;
    case 'solve':
      return <SolveTab />;
    case 'develop':
      return <DevelopTab />;
    case 'validate':
      return <ValidateTab />;
    case 'deploy':
      return <DeployTab />;
  }
}
