'use client';

import { Eye, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendSparkline } from '../charts/trend-sparkline';
import type { ScreeningResult } from '../../lib/types';

interface WatchCardProps {
  result: ScreeningResult;
  trendData?: { month: string; value: number }[];
  resolveName?: (code: string, type: 'model' | 'partGroup' | 'customerLine') => string;
}

export function WatchCard({ result, trendData, resolveName }: WatchCardProps) {
  const rn = resolveName ?? ((code: string) => code);
  const callCountChange = result.call_count_avg > 0
    ? ((result.call_count - result.call_count_avg) / result.call_count_avg * 100)
    : 0;

  const reworkChange = result.rework_rate - result.rework_rate_prev;
  const isNewWatch = result.prev_status !== 'watch';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-l-4 border-l-amber-400 bg-card',
        'p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
        'transition-all duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)]',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Eye className="h-3 w-3" />
              WATCH
            </span>
            {isNewWatch && (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[0.6rem] font-semibold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                NEW
              </span>
            )}
          </div>

          <h4 className="mt-2 font-headline text-sm font-semibold leading-tight text-foreground">
            {rn(result.model_code, 'model')} &times; {rn(result.customer_line_code, 'customerLine')} &times; {rn(result.part_group_code, 'partGroup')}
          </h4>
        </div>

        {trendData && trendData.length > 1 && (
          <TrendSparkline data={trendData} color="hsl(38, 92%, 50%)" className="shrink-0" />
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs">
        {callCountChange !== 0 && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            호출빈도{' '}
            <span className={cn(callCountChange > 0 ? 'font-semibold text-amber-600' : 'text-emerald-600')}>
              {callCountChange > 0 ? '+' : ''}{callCountChange.toFixed(0)}%
            </span>
          </span>
        )}
        {reworkChange !== 0 && (
          <span className="text-muted-foreground">
            리워크{' '}
            <span className={cn(reworkChange > 0 ? 'font-semibold text-amber-600' : 'text-emerald-600')}>
              {(result.rework_rate_prev * 100).toFixed(0)}%&rarr;{(result.rework_rate * 100).toFixed(0)}%
            </span>
          </span>
        )}
      </div>

      {result.watch_reason && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50/60 px-3 py-2 dark:bg-amber-950/20">
          <Clock className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            {result.watch_reason}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[0.65rem] text-muted-foreground">
        <span>
          장비 {result.affected_equip_count}/{result.total_equip_count}대 영향
        </span>
        {result.watch_since && (
          <span>Watch 시작: {result.watch_since}</span>
        )}
      </div>
    </div>
  );
}
