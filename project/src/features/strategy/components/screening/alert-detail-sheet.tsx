'use client';

import { AlertTriangle, Eye, BarChart3, Lightbulb, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ScreeningResult, ScreeningHint } from '../../lib/types';

interface AlertDetailSheetProps {
  result: ScreeningResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    alert: { label: 'ALERT', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
    watch: { label: 'WATCH', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    resolved: { label: 'RESOLVED', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    normal: { label: 'NORMAL', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400' },
  }[status] ?? { label: status, className: '' };

  return (
    <Badge variant="outline" className={cn('border-0 text-[0.65rem] font-bold uppercase', config.className)}>
      {config.label}
    </Badge>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-muted/30">
      <div className="text-center">
        <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground/40" />
        <p className="mt-1.5 text-xs text-muted-foreground/60">{title}</p>
      </div>
    </div>
  );
}

function HintItem({ hint }: { hint: ScreeningHint }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-outline-variant/20 bg-muted/20 p-3">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-foreground/90">{hint.hint_text}</p>
        <div className="mt-1.5 flex items-center gap-2 text-[0.65rem] text-muted-foreground">
          <span>관련 S/O: {hint.hint_count}건</span>
          {hint.source_order_nos.length > 0 && (
            <span className="truncate">({hint.source_order_nos.slice(0, 3).join(', ')}...)</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function AlertDetailSheet({ result, open, onOpenChange }: AlertDetailSheetProps) {
  if (!result) return null;

  const callCountChange = result.call_count_avg > 0
    ? ((result.call_count - result.call_count_avg) / result.call_count_avg * 100)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-outline-variant/20 px-6 py-5">
            <div className="flex items-center gap-2">
              {result.status === 'alert' ? (
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              ) : (
                <Eye className="h-5 w-5 text-amber-500" />
              )}
              <SheetTitle className="font-headline text-base">
                {result.model_code} &times; {result.customer_line_code} &times; {result.part_group_code}
              </SheetTitle>
            </div>
            <SheetDescription asChild>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <StatusBadge status={result.status} />
                <span className="text-xs">{result.year_month}</span>
              </div>
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="analysis" className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-outline-variant/20 px-6">
              <TabsList className="h-10 w-full justify-start bg-transparent p-0">
                <TabsTrigger
                  value="analysis"
                  className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                  수치 분석
                </TabsTrigger>
                <TabsTrigger
                  value="hints"
                  className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
                  정성 힌트
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  관련 S/O
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="analysis" className="mt-0 px-6 py-5">
                <div className="space-y-5">
                  <div className="rounded-xl border border-outline-variant/20 p-4">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      핵심 지표
                    </h4>
                    <div className="divide-y divide-outline-variant/15">
                      <StatRow label="호출 건수 (이번 달)" value={result.call_count} />
                      <StatRow label="평균 호출 건수" value={result.call_count_avg.toFixed(1)} />
                      <StatRow
                        label="호출 변동률"
                        value={`${callCountChange > 0 ? '+' : ''}${callCountChange.toFixed(1)}%`}
                      />
                      <StatRow label="리워크율" value={`${(result.rework_rate * 100).toFixed(1)}%`} />
                      <StatRow label="이전 리워크율" value={`${(result.rework_rate_prev * 100).toFixed(1)}%`} />
                      <StatRow label="평균 작업시간" value={`${result.avg_work_time.toFixed(0)}분`} />
                      <StatRow label="CUSUM" value={`${result.cusum_value.toFixed(2)} / UCL ${result.cusum_ucl.toFixed(2)}`} />
                      <StatRow label="Trend Slope" value={result.trend_slope.toFixed(4)} />
                      <StatRow label="Trend p-value" value={result.trend_p_value.toFixed(4)} />
                      <StatRow label="Pareto 순위" value={result.pareto_rank} />
                      <StatRow label="영향 장비" value={`${result.affected_equip_count} / ${result.total_equip_count}`} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      추이 차트
                    </h4>
                    <ChartPlaceholder title="CUSUM 관리도" />
                    <ChartPlaceholder title="호출 추이 차트" />
                    <ChartPlaceholder title="Pareto 차트" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hints" className="mt-0 px-6 py-5">
                <div className="space-y-3">
                  {result.hints && result.hints.length > 0 ? (
                    result.hints.map((hint) => (
                      <HintItem key={hint.id} hint={hint} />
                    ))
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <p className="text-sm text-muted-foreground">등록된 힌트가 없습니다</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="orders" className="mt-0 px-6 py-5">
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-muted/30">
                  <div className="text-center">
                    <FileText className="mx-auto h-6 w-6 text-muted-foreground/40" />
                    <p className="mt-1.5 text-xs text-muted-foreground/60">관련 S/O 목록 영역</p>
                    <p className="mt-0.5 text-[0.65rem] text-muted-foreground/40">추후 연동 예정</p>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
