'use client';

import { motion } from 'framer-motion';
import { StrategyKpiStrip } from '@/features/strategy/components/layout/strategy-kpi-strip';
import { ChatPanel } from './chat-panel';
import { RecommendationPanel } from './recommendation-panel';
import { ShortlistDock } from './shortlist-dock';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export function DiscoverView() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5 p-6"
    >
      {/* KPI strip */}
      <motion.div variants={item}>
        <StrategyKpiStrip />
      </motion.div>

      {/* Main body: chat + recommendations */}
      <motion.div variants={item} className="grid grid-cols-12 gap-5">
        <div className="col-span-7">
          <ChatPanel />
        </div>
        <div className="col-span-5">
          <RecommendationPanel />
        </div>
      </motion.div>

      {/* Shortlist dock (sticky) */}
      <ShortlistDock />
    </motion.div>
  );
}
