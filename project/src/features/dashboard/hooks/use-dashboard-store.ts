'use client';

import { create } from 'zustand';

export type MainTab = 'dashboard' | 'ai-chat' | 'agents' | 'strategy' | 'board';
export type SubTab = 'overview' | 'live' | 'forecast';
export type SidebarItem =
  | 'overview'
  | 'creation-approval'
  | 'maint-rework'
  | 'setup-rework'
  | 'setup-lead-time'
  | 'gcb-openings'
  | 'workload'
  | 'part-life-ftfr'
  | 'live-monitoring'
  | 'forecast-trend';
export type Period = 'monthly' | 'quarterly' | 'yearly';
export type StrategyView = 'screening' | 'kanban' | 'gantt';

interface DashboardStore {
  activeMainTab: MainTab;
  activeSubTab: SubTab;
  activeSidebarItem: SidebarItem;
  period: Period;
  activeStrategyView: StrategyView;
  setMainTab: (t: MainTab) => void;
  setSubTab: (t: SubTab) => void;
  setSidebarItem: (i: SidebarItem) => void;
  setPeriod: (p: Period) => void;
  setStrategyView: (v: StrategyView) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeMainTab: 'dashboard',
  activeSubTab: 'overview',
  activeSidebarItem: 'overview',
  period: 'monthly',
  activeStrategyView: 'screening',
  setMainTab: (t) => set({ activeMainTab: t }),
  setSubTab: (t) => set({ activeSubTab: t }),
  setSidebarItem: (i) => set({ activeSidebarItem: i }),
  setPeriod: (p) => set({ period: p }),
  setStrategyView: (v) => set({ activeStrategyView: v }),
}));
