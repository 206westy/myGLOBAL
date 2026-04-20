'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Minus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScreeningResult } from '../../lib/types';

interface ScreeningSummaryCardsProps {
  results: ScreeningResult[];
  onScrollToSection?: (section: 'alert' | 'watch') => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const accentMap = {
  alert: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: 'text-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  },
  watch: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  normal: {
    border: 'border-l-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/30',
    icon: 'text-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
  },
  resolved: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
};

export function ScreeningSummaryCards({ results, onScrollToSection }: ScreeningSummaryCardsProps) {
  const alertCount = results.filter((r) => r.status === 'alert').length;
  const watchCount = results.filter((r) => r.status === 'watch' && r.prev_status !== 'watch').length;
  const watchMaintainCount = results.filter((r) => r.status === 'watch' && r.prev_status === 'watch').length;
  const resolvedCount = results.filter((r) => r.status === 'resolved').length;

  const cards = [
    {
      key: 'alert' as const,
      label: 'Alert 승격',
      sub: '즉시 조치 필요',
      count: alertCount,
      Icon: AlertTriangle,
      accent: accentMap.alert,
      clickable: true,
    },
    {
      key: 'watch' as const,
      label: '신규 Watch',
      sub: '모니터링 시작',
      count: watchCount,
      Icon: Eye,
      accent: accentMap.watch,
      clickable: true,
    },
    {
      key: 'normal' as const,
      label: 'Watch 유지',
      sub: '지속 관찰 중',
      count: watchMaintainCount,
      Icon: Minus,
      accent: accentMap.normal,
      clickable: false,
    },
    {
      key: 'resolved' as const,
      label: '해소',
      sub: '정상 복귀',
      count: resolvedCount,
      Icon: CheckCircle2,
      accent: accentMap.resolved,
      clickable: false,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {cards.map(({ key, label, sub, count, Icon, accent, clickable }) => (
        <motion.div
          key={key}
          variants={cardVariants}
          className={cn(
            'relative overflow-hidden rounded-2xl border border-l-4 bg-card p-5',
            'shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
            'transition-all duration-200',
            accent.border,
            clickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]',
          )}
          onClick={() => {
            if (clickable && (key === 'alert' || key === 'watch')) {
              onScrollToSection?.(key);
            }
          }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <div className="font-headline text-3xl font-bold tracking-tight tabular-nums text-foreground">
                {count}
              </div>
            </div>
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', accent.bg)}>
              <Icon className={cn('h-5 w-5', accent.icon)} />
            </div>
          </div>
          <div className="mt-3 border-t border-outline-variant/20 pt-3">
            <span className="text-xs text-muted-foreground">{sub}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
