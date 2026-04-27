'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useDashboardStore } from '@/features/dashboard/hooks/use-dashboard-store';
import { CipKanbanView } from '../kanban/cip-kanban-view';
import { GanttView } from '../gantt/gantt-view';
import { ScreeningView } from '../screening/screening-view';
import { WorkflowHeaderBar } from '../workflow/workflow-header-bar';
import { WorkflowTabContent } from '../workflow/workflow-tab-content';

export function StrategyPage() {
  const activeStrategyView = useDashboardStore((s) => s.activeStrategyView);

  let view;
  if (activeStrategyView === 'workflow') {
    view = (
      <div className="flex h-full flex-col">
        <WorkflowHeaderBar />
        <div className="flex-1 overflow-auto">
          <WorkflowTabContent />
        </div>
      </div>
    );
  } else if (activeStrategyView === 'kanban') {
    view = <CipKanbanView />;
  } else if (activeStrategyView === 'gantt') {
    view = <GanttView />;
  } else {
    view = <ScreeningView readOnly />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeStrategyView}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full"
      >
        {view}
      </motion.div>
    </AnimatePresence>
  );
}
