'use client';

import { useState, useCallback } from 'react';
import {
  ArrowLeft,
  FileDown,
  Clock,
  User,
  Calendar,
  MapPin,
  Cpu,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TiptapEditor } from './tiptap-editor';
import { generateReportContent } from '../../lib/report-generator';
import { useUpdateCipItem } from '../../hooks/use-cip-queries';
import type { CipItem, CipStage, ActionPriority, ActivityEntry } from '../../lib/types';

const STAGE_CONFIG: Record<CipStage, { label: string; color: string; bg: string; text: string }> = {
  detected: { label: '감지됨', color: '#9CA3AF', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  registered: { label: '등록됨', color: '#6366F1', bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300' },
  investigating: { label: '조사중', color: '#F59E0B', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
  searching_solution: { label: '솔루션탐색', color: '#8B5CF6', bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300' },
  developing_solution: { label: '솔루션개발', color: '#7C3AED', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
  lab_transferred: { label: 'LAB 이관', color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  lab_responded: { label: 'LAB 응답', color: '#0891B2', bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
  testing: { label: '테스트', color: '#0D9488', bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300' },
  verifying: { label: '검증중', color: '#059669', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  rolling_out: { label: '롤아웃', color: '#16A34A', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300' },
  completed: { label: '완료', color: '#10B981', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  cancelled: { label: '취소', color: '#EF4444', bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300' },
};

const AP_CONFIG: Record<ActionPriority, { label: string; className: string }> = {
  HIGH: { label: 'HIGH', className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300' },
  MEDIUM: { label: 'MEDIUM', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300' },
  LOW: { label: 'LOW', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: 'act-1', at: '2026-04-01T09:00:00Z', text: 'CIP 아이템 생성됨 (스크리닝 자동 감지)' },
  { id: 'act-2', at: '2026-04-02T10:30:00Z', text: '매니저 검토 후 등록 처리 — 김재영' },
  { id: 'act-3', at: '2026-04-03T14:15:00Z', text: '현장조사 담당 배정 — 박지훈' },
  { id: 'act-4', at: '2026-04-05T11:00:00Z', text: '현장조사 진행 중' },
  { id: 'act-5', at: '2026-04-10T16:45:00Z', text: '현장사진 3건 업로드' },
];

const MOCK_CIP_ITEM: CipItem = {
  id: 'mock-cip-001',
  cip_no: 'CIP-2026-0012',
  stage: 'investigating',
  journey_type: 'A',
  severity: 7,
  occurrence: 8,
  detection: 5,
  action_priority: 'HIGH',
  anomaly_type: 'recurring_failure',
  anomaly_score: 0.87,
  anomaly_detail: null,
  equip_no: 'EQ-A301',
  model_code: 'SUPRA N',
  country_code: 'KR',
  customer_line_code: 'FAB-3L',
  target_module: 'PM2',
  target_chamber: 'CH-A',
  target_part_group: 'SOURCE',
  target_part_no: 'SRC-2200',
  title: '[SOURCE] PM2 Plasma 불균일 재발 건',
  description: 'FAB-3L PM2 챔버에서 SOURCE 관련 Plasma 불균일 현상이 반복적으로 발생. CUSUM 초과 감지 후 등록.',
  symptom: 'Plasma 균일도 저하, Edge 영역 Etch Rate 편차 증가',
  root_cause: null,
  root_cause_method: null,
  solution_summary: null,
  assigned_engineer: '박지훈',
  assigned_manager: '김재영',
  created_by: 'system',
  screening_result_id: 'sr-mock-001',
  investigation_status: 'in_progress',
  investigation_conclusion: null,
  five_why: null,
  fishbone: null,
  field_observation: null,
  field_confirmed: null,
  report_content: null,
  investigation_completed_at: null,
  created_at: '2026-04-01T09:00:00Z',
  updated_at: '2026-04-10T16:45:00Z',
  detected_at: '2026-04-01T09:00:00Z',
  registered_at: '2026-04-02T10:30:00Z',
  resolved_at: null,
};

interface CipDetailPageProps {
  cipItem?: CipItem;
  onBack?: () => void;
}

export function CipDetailPage({ cipItem, onBack }: CipDetailPageProps) {
  const item = cipItem ?? MOCK_CIP_ITEM;
  const updateCip = useUpdateCipItem();

  const initialContent = item.report_content ?? generateReportContent(item);
  const [reportContent, setReportContent] = useState<Record<string, unknown>>(initialContent);

  const handleReportUpdate = useCallback(
    (json: Record<string, unknown>) => {
      setReportContent(json);
    },
    [],
  );

  const handleSaveReport = useCallback(() => {
    updateCip.mutate({ id: item.id, updates: { report_content: reportContent } });
  }, [updateCip, item.id, reportContent]);

  const stageConf = STAGE_CONFIG[item.stage];
  const apConf = item.action_priority ? AP_CONFIG[item.action_priority] : null;
  const rpn = (item.severity ?? 0) * (item.occurrence ?? 0) * (item.detection ?? 0);
  const elapsedDays = differenceInCalendarDays(new Date(), new Date(item.created_at));
  const activity = MOCK_ACTIVITY;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-outline-variant/20 bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="font-headline text-sm font-bold tracking-wide text-muted-foreground">
              {item.cip_no}
            </span>
            <Badge className={cn('border text-[0.68rem] font-semibold', stageConf.bg, stageConf.text)}>
              {stageConf.label}
            </Badge>
            {apConf && (
              <Badge className={cn('border text-[0.68rem] font-semibold', apConf.className)}>
                {apConf.label}
              </Badge>
            )}
          </div>

          <Button variant="outline" size="sm" className="hidden gap-1.5 sm:flex" disabled>
            <FileDown className="h-4 w-4" />
            PDF 내보내기
          </Button>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
          <h1 className="font-headline text-lg font-bold text-foreground sm:text-xl">
            {item.title}
          </h1>
        </div>
      </header>

      {/* Body: 60/40 split */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        {/* Left panel — Report */}
        <div className="flex-1 space-y-6 lg:max-w-[60%]">
          {/* Tiptap editor */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">문제 정의 보고서</h2>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={handleSaveReport}
                disabled={updateCip.isPending}
              >
                {updateCip.isPending ? '저장 중...' : '보고서 저장'}
              </Button>
            </div>
            <TiptapEditor
              content={reportContent}
              onUpdate={handleReportUpdate}
              placeholder="보고서 내용을 작성하세요..."
            />
          </section>

          {/* Investigation summary (if data exists) */}
          {item.field_observation && (
            <section className="rounded-lg border border-outline-variant/20 bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">현장조사 결과</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.field_observation}
              </p>
            </section>
          )}
        </div>

        {/* Right panel — Metadata */}
        <aside className="w-full space-y-4 lg:w-[40%] lg:max-w-[420px]">
          {/* Status card */}
          <div className="rounded-lg border border-outline-variant/20 bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              상태 정보
            </h3>

            <div className="space-y-3">
              <MetaRow icon={<Clock className="h-4 w-4" />} label="상태">
                <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', stageConf.text)}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stageConf.color }} />
                  {stageConf.label}
                </span>
              </MetaRow>

              <MetaRow icon={<Cpu className="h-4 w-4" />} label="모델">
                <span className="text-sm text-foreground">{item.model_code ?? '-'}</span>
              </MetaRow>

              <MetaRow icon={<MapPin className="h-4 w-4" />} label="라인">
                <span className="text-sm text-foreground">{item.customer_line_code ?? '-'}</span>
              </MetaRow>

              <MetaRow icon={<AlertTriangle className="h-4 w-4" />} label="파트 그룹">
                <span className="text-sm text-foreground">{item.target_part_group ?? '-'}</span>
              </MetaRow>

              <MetaRow icon={<User className="h-4 w-4" />} label="담당 엔지니어">
                <span className="text-sm text-foreground">{item.assigned_engineer ?? '-'}</span>
              </MetaRow>

              <MetaRow icon={<User className="h-4 w-4" />} label="매니저">
                <span className="text-sm text-foreground">{item.assigned_manager ?? '-'}</span>
              </MetaRow>

              <MetaRow icon={<Calendar className="h-4 w-4" />} label="생성일">
                <span className="text-sm text-foreground">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </span>
              </MetaRow>

              <MetaRow icon={<Clock className="h-4 w-4" />} label="경과">
                <span className={cn('text-sm font-semibold', elapsedDays > 7 ? 'text-rose-600' : 'text-foreground')}>
                  D+{elapsedDays}
                </span>
              </MetaRow>
            </div>
          </div>

          {/* RPN card */}
          {(item.severity != null && item.occurrence != null && item.detection != null) && (
            <div className="rounded-lg border border-outline-variant/20 bg-card p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                RPN 평가
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <RpnCell label="심각도 (S)" value={item.severity ?? 0} />
                <RpnCell label="발생도 (O)" value={item.occurrence ?? 0} />
                <RpnCell label="검출도 (D)" value={item.detection ?? 0} />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                <span className="text-xs text-muted-foreground">RPN = S x O x D</span>
                <span className="font-headline text-lg font-bold tabular-nums text-foreground">{rpn}</span>
              </div>
            </div>
          )}

          {/* Equipment details */}
          {(item.equip_no || item.target_module || item.target_chamber) && (
            <div className="rounded-lg border border-outline-variant/20 bg-card p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                설비 정보
              </h3>
              <div className="space-y-2">
                {item.equip_no && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">설비 번호</span>
                    <span className="font-medium text-foreground">{item.equip_no}</span>
                  </div>
                )}
                {item.target_module && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">모듈</span>
                    <span className="font-medium text-foreground">{item.target_module}</span>
                  </div>
                )}
                {item.target_chamber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">챔버</span>
                    <span className="font-medium text-foreground">{item.target_chamber}</span>
                  </div>
                )}
                {item.target_part_no && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">파트 번호</span>
                    <span className="font-medium text-foreground">{item.target_part_no}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity log */}
          <div className="rounded-lg border border-outline-variant/20 bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              활동 로그
            </h3>
            <div className="space-y-3">
              {activity.map((entry, idx) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary/60" />
                    {idx < activity.length - 1 && (
                      <div className="mt-1 flex-1 border-l border-outline-variant/30" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm leading-snug text-foreground">{entry.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(entry.at).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investigation link */}
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-outline-variant/20 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">현장조사 입력</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.investigation_status === 'completed' ? '조사 완료' : '조사 진행 중'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </aside>
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      {children}
    </div>
  );
}

function RpnCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-2">
      <div className="font-headline text-lg font-bold tabular-nums text-foreground">{value}</div>
      <div className="mt-0.5 text-[0.65rem] text-muted-foreground">{label}</div>
    </div>
  );
}
