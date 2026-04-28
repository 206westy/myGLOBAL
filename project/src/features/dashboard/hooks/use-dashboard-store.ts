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
export type StrategyView =
  | 'workflow'
  | 'kanban'
  | 'gantt'
  | 'screening-archive'
  | 'screening-run'
  | 'intel-roi'
  | 'intel-health'
  | 'intel-effectiveness';
export type DetailTab = 'chart' | 'detail' | 'raw-data';

interface DashboardStore {
  activeMainTab: MainTab;
  activeSubTab: SubTab;
  activeSidebarItem: SidebarItem;
  activeDetailTab: DetailTab;
  period: Period;
  activeStrategyView: StrategyView;
  sidebarCollapsed: boolean;
  setMainTab: (t: MainTab) => void;
  setSubTab: (t: SubTab) => void;
  setSidebarItem: (i: SidebarItem) => void;
  setDetailTab: (t: DetailTab) => void;
  setPeriod: (p: Period) => void;
  setStrategyView: (v: StrategyView) => void;
  setSidebarCollapsed: (c: boolean) => void;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeMainTab: 'dashboard',
  activeSubTab: 'overview',
  activeSidebarItem: 'overview',
  activeDetailTab: 'chart',
  period: 'monthly',
  activeStrategyView: 'workflow',
  sidebarCollapsed: false,
  setMainTab: (t) => set({ activeMainTab: t }),
  setSubTab: (t) => set({ activeSubTab: t }),
  setSidebarItem: (i) => set({ activeSidebarItem: i, activeDetailTab: 'chart' }),
  setDetailTab: (t) => set({ activeDetailTab: t }),
  setPeriod: (p) => set({ period: p }),
  setStrategyView: (v) => set({ activeStrategyView: v }),
  setSidebarCollapsed: (c) => set({ sidebarCollapsed: c }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
