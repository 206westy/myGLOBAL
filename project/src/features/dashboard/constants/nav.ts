import {
  LayoutDashboard,
  MessagesSquare,
  Workflow,
  Target,
  FilePlus2,
  Wrench,
  Settings2,
  Clock,
  Package,
  Briefcase,
  Activity,
  TrendingUp,
  Zap,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { type MainTab, type SidebarItem } from '../hooks/use-dashboard-store';

export interface MainTabDef {
  id: MainTab;
  label: string;
  icon: LucideIcon;
}

export interface SidebarItemDef {
  id: SidebarItem;
  label: string;
  icon: LucideIcon;
  group: 'kpi-index' | 'live-analysis' | 'forecast';
}

export const MAIN_TABS: MainTabDef[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'workspace',  label: 'Workspace',  icon: Workflow },
  { id: 'strategy',   label: 'Strategy',   icon: Target },
  { id: 'aichat',     label: 'AI Chat',    icon: MessagesSquare },
];

export const SIDEBAR_ITEMS: SidebarItemDef[] = [
  { id: 'overview',           label: 'Overview',          icon: LayoutDashboard, group: 'kpi-index' },
  { id: 'creation-approval',  label: 'Creation / Approval', icon: FilePlus2,      group: 'kpi-index' },
  { id: 'maint-rework',       label: 'Maint Rework',      icon: Wrench,          group: 'kpi-index' },
  { id: 'setup-rework',       label: 'Setup Rework',      icon: Settings2,       group: 'kpi-index' },
  { id: 'setup-lead-time',    label: 'Setup Lead Time',   icon: Clock,           group: 'kpi-index' },
  { id: 'gcb-openings',       label: 'GCB Openings',      icon: Package,         group: 'kpi-index' },
  { id: 'workload',           label: 'Workload',          icon: Briefcase,       group: 'kpi-index' },
  { id: 'part-life-ftfr',     label: 'Part Life / FTFR',  icon: Zap,             group: 'kpi-index' },
  { id: 'live-monitoring',    label: 'Live Monitoring',   icon: Activity,        group: 'live-analysis' },
  { id: 'forecast-trend',     label: 'Forecast Trend',    icon: TrendingUp,      group: 'forecast' },
];

export const SIDEBAR_FOOTER_ITEMS = [
  { label: 'Settings',    icon: Settings },
  { label: 'Help Center', icon: HelpCircle },
];

export const MAIN_TAB_LABELS: Record<MainTab, string> = {
  'dashboard':  'Dashboard',
  'workspace':  'Workspace',
  'strategy':   'Strategy',
  'aichat':     'AI Chat',
};

export const SIDEBAR_LABELS: Record<SidebarItem, string> = {
  'overview':          'Overview',
  'creation-approval': 'Creation / Approval',
  'maint-rework':      'Maint Rework',
  'setup-rework':      'Setup Rework',
  'setup-lead-time':   'Setup Lead Time',
  'gcb-openings':      'GCB Openings',
  'workload':          'Workload',
  'part-life-ftfr':    'Part Life / FTFR',
  'live-monitoring':   'Live Monitoring',
  'forecast-trend':    'Forecast Trend',
};
