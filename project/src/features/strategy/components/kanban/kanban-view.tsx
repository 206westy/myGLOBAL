'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { StrategyKpiStrip } from '@/features/strategy/components/layout/strategy-kpi-strip';
import { KanbanToolbar } from './kanban-toolbar';
import { KanbanBoard } from './kanban-board';
import { NewItemDialog } from './new-item-dialog';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function KanbanView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemOpen, setNewItemOpen] = useState(false);

  return (
    <motion.div
      className="space-y-5 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <StrategyKpiStrip />
      </motion.div>

      <motion.div variants={itemVariants}>
        <KanbanToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddItem={() => setNewItemOpen(true)}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <KanbanBoard searchQuery={searchQuery} />
      </motion.div>

      <NewItemDialog
        open={newItemOpen}
        onClose={() => setNewItemOpen(false)}
        defaultStatus="backlog"
      />
    </motion.div>
  );
}
