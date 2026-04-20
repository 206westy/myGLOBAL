'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useDashboardStore } from '@/features/dashboard/hooks/use-dashboard-store';
import { CipKanbanView } from '../kanban/cip-kanban-view';
import { GanttView } from '../gantt/gantt-view';
import { ScreeningView } from '../screening/screening-view';

export function StrategyPage() {
  const activeStrategyView = useDashboardStore((s) => s.activeStrategyView);

  const view =
    activeStrategyView === 'kanban'    ? <CipKanbanView />   :
    activeStrategyView === 'gantt'     ? <GanttView />       :
                                         <ScreeningView />;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeStrategyView}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {view}
      </motion.div>
    </AnimatePresence>
  );
}
