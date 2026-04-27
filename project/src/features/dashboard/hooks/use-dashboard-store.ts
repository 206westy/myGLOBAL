'use client';

import { create } from 'zustand';

export type MainTab = 'dashboard' | 'workspace' | 'strategy' | 'aichat';
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
export type StrategyView = 'workflow' | 'kanban' | 'gantt' | 'screening-archive';
export type DetailTab = 'chart' | 'detail' | 'raw-data';

interface DashboardStore {
  activeMainTab: MainTab;
  activeSubTab: SubTab;
  activeSidebarItem: SidebarItem;
  activeDetailTab: DetailTab;
  period: Period;
  activeStrategyView: StrategyView;
  setMainTab: (t: MainTab) => void;
  setSubTab: (t: SubTab) => void;
  setSidebarItem: (i: SidebarItem) => void;
  setDetailTab: (t: DetailTab) => void;
  setPeriod: (p: Period) => void;
  setStrategyView: (v: StrategyView) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeMainTab: 'dashboard',
  activeSubTab: 'overview',
  activeSidebarItem: 'overview',
  activeDetailTab: 'chart',
  period: 'monthly',
  activeStrategyView: 'workflow',
  setMainTab: (t) => set({ activeMainTab: t }),
  setSubTab: (t) => set({ activeSubTab: t }),
  setSidebarItem: (i) => set({ activeSidebarItem: i, activeDetailTab: 'chart' }),
  setDetailTab: (t) => set({ activeDetailTab: t }),
  setPeriod: (p) => set({ period: p }),
  setStrategyView: (v) => set({ activeStrategyView: v }),
}));
