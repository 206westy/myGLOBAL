'use client';

import { motion } from 'framer-motion';
import { KpiCard } from './kpi-card';
import { OverallReworkChart } from './overall-rework-chart';
import { EquipmentHealthFunnel } from './equipment-health-funnel';
import { QuickActions } from './quick-actions';
import { CountryRankingTable } from './country-ranking-table';
import { KPIS } from '../../constants/overview-data';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export function OverviewPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5 p-6"
    >
      {/* KPI row */}
      <motion.div variants={item} className="grid grid-cols-4 gap-5">
        {KPIS.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
        ))}
      </motion.div>

      {/* Chart + funnel row */}
      <motion.div variants={item} className="grid grid-cols-12 gap-5">
        <div className="col-span-8">
          <OverallReworkChart />
        </div>
        <div className="col-span-4">
          <EquipmentHealthFunnel />
        </div>
      </motion.div>

      {/* Quick actions + country ranking */}
      <motion.div variants={item} className="grid grid-cols-12 gap-5">
        <div className="col-span-4">
          <QuickActions />
        </div>
        <div className="col-span-8">
          <CountryRankingTable />
        </div>
      </motion.div>
    </motion.div>
  );
}
