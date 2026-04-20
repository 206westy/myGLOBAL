'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PeriodToggle } from './period-toggle';
import { ReworkOverviewTab }         from './tabs/rework-overview-tab';
import { ReworkBranchAnalysisTab }   from './tabs/rework-branch-analysis-tab';
import { ReworkDetailedAnalysisTab } from './tabs/rework-detailed-analysis-tab';
import { ReworkHeatmapTab }          from './tabs/rework-heatmap-tab';
import { ReworkRawDataTab }          from './tabs/rework-raw-data-tab';

const TABS = [
  { value: 'overview',  label: 'Overview'          },
  { value: 'branch',    label: 'Branch Analysis'   },
  { value: 'detailed',  label: 'Detailed Analysis' },
  { value: 'heatmap',   label: 'Heatmap'           },
  { value: 'raw',       label: 'Raw Data'          },
] as const;

type TabValue = typeof TABS[number]['value'];

export function MaintReworkPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  return (
    <div className="space-y-5 p-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold tracking-tight text-foreground">
            Maint Rework
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manufacturing rework rate by branch and category
          </p>
        </div>
        <PeriodToggle />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="h-auto gap-1 rounded-full bg-surface-container-low p-1">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-full px-4 py-1.5 text-[0.78rem] data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=inactive]:text-muted-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-5"
          >
            <TabsContent value="overview"  forceMount className={activeTab !== 'overview'  ? 'hidden' : ''}>
              <ReworkOverviewTab />
            </TabsContent>
            <TabsContent value="branch"    forceMount className={activeTab !== 'branch'    ? 'hidden' : ''}>
              <ReworkBranchAnalysisTab />
            </TabsContent>
            <TabsContent value="detailed"  forceMount className={activeTab !== 'detailed'  ? 'hidden' : ''}>
              <ReworkDetailedAnalysisTab />
            </TabsContent>
            <TabsContent value="heatmap"   forceMount className={activeTab !== 'heatmap'   ? 'hidden' : ''}>
              <ReworkHeatmapTab />
            </TabsContent>
            <TabsContent value="raw"       forceMount className={activeTab !== 'raw'       ? 'hidden' : ''}>
              <ReworkRawDataTab />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
