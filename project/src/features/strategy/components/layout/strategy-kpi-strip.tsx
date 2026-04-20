'use client';

import { Target, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';

const TODAY = new Date().toISOString().slice(0, 10);

export function StrategyKpiStrip() {
  const items = useStrategyStore((s) => s.items);

  const totalCount      = items.length;
  const inProgressCount = items.filter((it) => it.status === 'in_progress').length;
  const doneCount       = items.filter((it) => it.status === 'done').length;
  const overdueCount    = items.filter(
    (it) => it.dueDate && it.dueDate < TODAY && it.status !== 'done'
  ).length;

  const kpis = [
    {
      label: '전체 아이템',
      value: totalCount,
      icon: Target,
      sub: '등록된 전략 아이템',
      danger: false,
    },
    {
      label: '진행 중',
      value: inProgressCount,
      icon: TrendingUp,
      sub: '현재 실행중인 아이템',
      danger: false,
    },
    {
      label: '완료',
      value: doneCount,
      icon: CheckCircle2,
      sub: '완료된 아이템',
      danger: false,
    },
    {
      label: '위험 (기한 초과)',
      value: overdueCount,
      icon: AlertTriangle,
      sub: '기한을 초과한 아이템',
      danger: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-5">
      {kpis.map(({ label, value, icon: Icon, sub, danger }) => (
        <SectionCard
          key={label}
          className="p-5 transition-transform duration-300 hover:-translate-y-0.5"
        >
          {/* Top row: label + icon chip */}
          <div className="flex items-start justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </div>

          {/* Big number */}
          <div className="mt-3">
            <span
              className={cn(
                'font-headline text-[1.85rem] font-bold leading-none tracking-tight tabular-nums',
                danger && value > 0 ? 'text-rose-600' : 'text-foreground'
              )}
            >
              {value}
            </span>
          </div>

          {/* Divider + sub-text */}
          <div className="mt-3 border-t border-outline-variant/20 pt-3">
            <span className="text-[0.72rem] text-muted-foreground">{sub}</span>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
