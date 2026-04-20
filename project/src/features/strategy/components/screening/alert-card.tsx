'use client';

import { AlertTriangle, TrendingUp, Lightbulb, ArrowUpRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TrendSparkline } from '../charts/trend-sparkline';
import type { ScreeningResult } from '../../lib/types';

interface AlertCardProps {
  result: ScreeningResult;
  trendData?: { month: string; value: number }[];
  resolveName?: (code: string, type: 'model' | 'partGroup' | 'customerLine') => string;
  onCreateCip?: () => void;
  onKeepWatch?: () => void;
  onClick?: () => void;
}

export function AlertCard({
  result,
  trendData,
  resolveName,
  onCreateCip,
  onKeepWatch,
  onClick,
}: AlertCardProps) {
  const rn = resolveName ?? ((code: string) => code);
  const callCountChange = result.call_count_avg > 0
    ? ((result.call_count - result.call_count_avg) / result.call_count_avg * 100)
    : 0;

  const reworkChange = result.rework_rate - result.rework_rate_prev;
  const watchMonths = result.watch_since
    ? Math.max(1, Math.round(
        (new Date(result.year_month + '-01').getTime() - new Date(result.watch_since + '-01').getTime())
        / (1000 * 60 * 60 * 24 * 30)
      ))
    : null;

  const hintCount = result.hints?.length ?? 0;
  const firstHint = result.hints?.[0];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-l-4 border-l-rose-500 bg-card',
        'p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
        'transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              <AlertTriangle className="h-3 w-3" />
              ALERT
            </span>
            {result.is_new_pareto && (
              <span className="rounded-md bg-primary-fixed px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">
                Pareto #{result.pareto_rank}
              </span>
            )}
          </div>

          <h4 className="mt-2 font-headline text-sm font-semibold leading-tight text-foreground">
            {rn(result.model_code, 'model')} &times; {rn(result.customer_line_code, 'customerLine')} &times; {rn(result.part_group_code, 'partGroup')}
          </h4>
        </div>

        {trendData && trendData.length > 1 && (
          <TrendSparkline data={trendData} color="hsl(0, 84%, 60%)" className="shrink-0" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {callCountChange !== 0 && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            호출빈도{' '}
            <span className={cn('font-semibold', callCountChange > 0 ? 'text-rose-600' : 'text-emerald-600')}>
              {callCountChange > 0 ? '+' : ''}{callCountChange.toFixed(0)}%
            </span>
          </span>
        )}
        {reworkChange !== 0 && (
          <span className="text-muted-foreground">
            리워크{' '}
            <span className={cn('font-semibold', reworkChange > 0 ? 'text-rose-600' : 'text-emerald-600')}>
              {(result.rework_rate_prev * 100).toFixed(0)}%&rarr;{(result.rework_rate * 100).toFixed(0)}%
            </span>
          </span>
        )}
        {watchMonths !== null && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Watch {watchMonths}개월 &rarr; Alert 승격
          </span>
        )}
      </div>

      {firstHint && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary-fixed/30 px-3 py-2 dark:bg-primary-fixed/10">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs leading-relaxed text-foreground/80">
              &ldquo;{firstHint.hint_text}&rdquo;
            </p>
            {hintCount > 1 && (
              <span className="text-[0.65rem] text-muted-foreground">
                외 {hintCount - 1}건의 힌트
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[0.65rem] text-muted-foreground">
        <span>
          장비 {result.affected_equip_count}/{result.total_equip_count}대 영향
        </span>
        <span>CUSUM: {result.cusum_value.toFixed(1)} / UCL {result.cusum_ucl.toFixed(1)}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-outline-variant/20 pt-4">
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-lg text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onCreateCip?.();
          }}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          CIP 아이템 생성
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onKeepWatch?.();
          }}
        >
          계속 Watch
        </Button>
      </div>
    </div>
  );
}
