import { FilePlus2, CheckCircle2, Wrench, Settings2 } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

export interface KpiData {
  id: string;
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  icon: LucideIcon;
  deltaLabel: string;
}

export const KPIS: KpiData[] = [
  {
    id: 'creation-rate',
    label: 'Creation Rate',
    value: '99.7%',
    delta: '+0.3%',
    isPositive: true,
    icon: FilePlus2,
    deltaLabel: '+0.3%',
  },
  {
    id: 'approval-rate',
    label: 'Approval Rate',
    value: '97.8%',
    delta: '+1.2%',
    isPositive: true,
    icon: CheckCircle2,
    deltaLabel: '+1.2%',
  },
  {
    id: 'maint-rework',
    label: 'Maint Rework',
    value: '10.5%',
    delta: '-0.8%',
    isPositive: true,
    icon: Wrench,
    deltaLabel: '-0.8%',
  },
  {
    id: 'setup-rework',
    label: 'Setup Rework',
    value: '20.3%',
    delta: '+2.1%',
    isPositive: false,
    icon: Settings2,
    deltaLabel: '+2.1%',
  },
];

export interface ReworkDataPoint {
  month: string;
  thisPeriod: number;
  lastPeriod: number;
}

export const OVERALL_REWORK_DATA: ReworkDataPoint[] = [
  { month: 'Apr 25', thisPeriod: 13.2, lastPeriod: 15.1 },
  { month: 'May 25', thisPeriod: 12.8, lastPeriod: 14.6 },
  { month: 'Jun 25', thisPeriod: 11.5, lastPeriod: 13.9 },
  { month: 'Jul 25', thisPeriod: 12.1, lastPeriod: 13.3 },
  { month: 'Aug 25', thisPeriod: 11.9, lastPeriod: 13.8 },
  { month: 'Sep 25', thisPeriod: 10.7, lastPeriod: 12.5 },
  { month: 'Oct 25', thisPeriod: 11.3, lastPeriod: 13.0 },
  { month: 'Nov 25', thisPeriod: 10.2, lastPeriod: 12.1 },
  { month: 'Dec 25', thisPeriod:  9.8, lastPeriod: 11.7 },
  { month: 'Jan 26', thisPeriod: 10.5, lastPeriod: 12.4 },
  { month: 'Feb 26', thisPeriod:  9.6, lastPeriod: 11.3 },
  { month: 'Mar 26', thisPeriod: 10.5, lastPeriod: 12.2 },
];

export interface FunnelSegment {
  label: string;
  pct: number;
  count: number;
  color: string;
  bgColor: string;
}

export const EQUIPMENT_HEALTH: FunnelSegment[] = [
  { label: 'Healthy',  pct: 72, count: 897, color: 'bg-emerald-500', bgColor: 'bg-emerald-100' },
  { label: 'Warning',  pct: 18, count: 224, color: 'bg-amber-500',   bgColor: 'bg-amber-100'   },
  { label: 'Critical', pct:  7, count:  87, color: 'bg-rose-500',    bgColor: 'bg-rose-100'    },
  { label: 'Offline',  pct:  3, count:  39, color: 'bg-slate-400',   bgColor: 'bg-slate-100'   },
];

export interface CountryRanking {
  rank: number;
  code: string;
  name: string;
  rate: number;
  trend: 'up' | 'down' | 'flat';
}

export const COUNTRY_RANKING: CountryRanking[] = [
  { rank: 1, code: 'JP', name: 'Japan',         rate: 19.7, trend: 'up'   },
  { rank: 2, code: 'TW', name: 'Taiwan',        rate: 11.2, trend: 'down' },
  { rank: 3, code: 'IE', name: 'Ireland',       rate:  7.7, trend: 'up'   },
  { rank: 4, code: 'KR', name: 'Korea',         rate:  7.0, trend: 'down' },
  { rank: 5, code: 'US', name: 'United States', rate:  4.4, trend: 'flat' },
  { rank: 6, code: 'SG', name: 'Singapore',     rate:  3.0, trend: 'down' },
  { rank: 7, code: 'CN', name: 'China',         rate:  3.0, trend: 'flat' },
];
