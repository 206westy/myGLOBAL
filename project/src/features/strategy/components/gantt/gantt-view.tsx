'use client';

import { CalendarRange } from 'lucide-react';
import { useCipItems } from '@/features/strategy/hooks/use-cip-queries';

export function GanttView() {
  const { data: cipItems, isLoading } = useCipItems();
  const items = cipItems ?? [];

  const scheduled = items.filter((it) => it.detected_at && it.resolved_at);
  const total = items.length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-headline text-base font-bold tracking-tight">CIP 타임라인</h2>
        <span className="text-xs text-muted-foreground">
          {total}개 CIP 아이템
        </span>
      </div>

      {isLoading && (
        <div className="flex h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-outline-variant/40">
          <div className="text-center">
            <CalendarRange className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              CIP 아이템이 없습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              스크리닝에서 Alert를 확인하고 CIP를 생성하면 타임라인에 표시됩니다
            </p>
          </div>
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="space-y-4">
          {/* CIP 아이템 목록 (테이블 형태) */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">CIP No.</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">제목</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">단계</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">우선순위</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">모델</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">담당</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">생성일</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const daysElapsed = Math.floor(
                    (Date.now() - new Date(item.created_at).getTime()) / 86400000
                  );
                  const priorityColor =
                    item.action_priority === 'HIGH' ? 'text-rose-600 bg-rose-50' :
                    item.action_priority === 'MEDIUM' ? 'text-amber-600 bg-amber-50' :
                    'text-blue-600 bg-blue-50';
                  const stageLabel: Record<string, string> = {
                    detected: '감지',
                    registered: '접수',
                    investigating: '조사중',
                    searching_solution: '솔루션탐색',
                    developing_solution: '솔루션개발',
                    completed: '완료',
                    cancelled: '취소',
                  };
                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{item.cip_no}</td>
                      <td className="px-4 py-3 font-medium">{item.title}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                          {stageLabel[item.stage] ?? item.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.action_priority && (
                          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${priorityColor}`}>
                            {item.action_priority}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.model_code}</td>
                      <td className="px-4 py-3 text-xs">{item.assigned_engineer ?? '-'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('ko-KR')} (D+{daysElapsed})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
