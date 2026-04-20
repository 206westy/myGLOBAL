'use client';

import { type StrategyStatus, type Priority, type Effort } from '../lib/types';

export interface ColumnDef {
  id: StrategyStatus;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

export const COLUMNS: ColumnDef[] = [
  {
    id: 'backlog',
    label: '백로그',
    color: '#9CA3AF',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    dotClass: 'bg-gray-400',
  },
  {
    id: 'ready',
    label: '준비',
    color: '#7857F8',
    bgClass: 'bg-primary-fixed',
    textClass: 'text-on-primary-fixed-variant',
    dotClass: 'bg-primary',
  },
  {
    id: 'in_progress',
    label: '실행중',
    color: '#5F3ADD',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    dotClass: 'bg-primary',
  },
  {
    id: 'review',
    label: '리뷰',
    color: '#F59E0B',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'done',
    label: '완료',
    color: '#10B981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
];

export const COLUMN_MAP: Record<StrategyStatus, ColumnDef> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, c])
) as Record<StrategyStatus, ColumnDef>;

// Gantt bar fill colors (hardcoded hex for canvas-style rendering; light-mode-first)
export const GANTT_COLORS: Record<StrategyStatus, string> = {
  backlog: '#E5E7EB',
  ready: '#E6DEFF',
  in_progress: '#5F3ADD',
  review: '#FDE68A',
  done: '#6EE7B7',
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  critical: { label: '긴급', bgClass: 'bg-rose-50', textClass: 'text-rose-700', borderClass: 'border-rose-200' },
  high:     { label: '높음', bgClass: 'bg-amber-50', textClass: 'text-amber-700', borderClass: 'border-amber-200' },
  medium:   { label: '보통', bgClass: 'bg-primary-fixed', textClass: 'text-on-primary-fixed-variant', borderClass: 'border-primary/20' },
  low:      { label: '낮음', bgClass: 'bg-gray-50', textClass: 'text-gray-500', borderClass: 'border-gray-200' },
};

export const EFFORT_CONFIG: Record<Effort, { label: string; days: number }> = {
  S:  { label: 'S (1~2주)', days: 10 },
  M:  { label: 'M (1개월)', days: 30 },
  L:  { label: 'L (2~3개월)', days: 75 },
  XL: { label: 'XL (6개월+)', days: 180 },
};

export const STATUS_ORDER: StrategyStatus[] = ['backlog', 'ready', 'in_progress', 'review', 'done'];

export function nextStatus(status: StrategyStatus): StrategyStatus | null {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}
