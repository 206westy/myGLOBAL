'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, ScanSearch, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import type { ScreeningResult } from '../../lib/types';
import { useScreeningResults, useLookupMaps } from '../../hooks/use-cip-queries';
import type { LookupMap } from '../../api';
import { ScreeningSummaryCards } from './screening-summary-cards';
import { ScreeningFilterBar } from './screening-filter-bar';
import { AlertCard } from './alert-card';
import { WatchCard } from './watch-card';
import { AlertDetailSheet } from './alert-detail-sheet';
import { CreateCipDialog } from './create-cip-dialog';
import { toast } from '@/hooks/use-toast';

function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function generateTrendData(result: ScreeningResult) {
  const base = result.call_count_avg || 10;
  const slope = result.trend_slope || 0;
  const std = result.call_count_std || 2;
  return Array.from({ length: 7 }, (_, i) => ({
    month: `M-${7 - i}`,
    value: Math.max(0, Math.round(base + (i - 3) * (slope * 0.4) + Math.sin(i * 1.5) * std * 0.3)),
  }));
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const cardStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
};

interface ScreeningViewProps {
  readOnly?: boolean;
}

export function ScreeningView({ readOnly = false }: ScreeningViewProps = {}) {
  const alertSectionRef = useRef<HTMLDivElement>(null);
  const watchSectionRef = useRef<HTMLDivElement>(null);

  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [modelFilter, setModelFilter] = useState('all');
  const [partGroupFilter, setPartGroupFilter] = useState('all');
  const [selectedResult, setSelectedResult] = useState<ScreeningResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cipDialogResult, setCipDialogResult] = useState<ScreeningResult | null>(null);
  const [cipDialogOpen, setCipDialogOpen] = useState(false);
  const [watchDialogResult, setWatchDialogResult] = useState<ScreeningResult | null>(null);
  const [watchDialogOpen, setWatchDialogOpen] = useState(false);
  const [watchReason, setWatchReason] = useState('');
  const [watchSaving, setWatchSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const { data: results = [], isLoading, refetch } = useScreeningResults(yearMonth);
  const { data: lookups } = useLookupMaps();

  const resolveName = useCallback((code: string, type: 'model' | 'partGroup' | 'customerLine') => {
    if (!lookups) return code;
    if (type === 'model') return lookups.models[code] ?? code;
    if (type === 'partGroup') return lookups.partGroups[code] ?? code;
    return lookups.customerLines[code] ?? code;
  }, [lookups]);

  const models = useMemo(() => [...new Set(results.map((r) => r.model_code))], [results]);
  const partGroups = useMemo(() => [...new Set(results.map((r) => r.part_group_code))], [results]);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (modelFilter !== 'all' && r.model_code !== modelFilter) return false;
      if (partGroupFilter !== 'all' && r.part_group_code !== partGroupFilter) return false;
      return true;
    });
  }, [results, modelFilter, partGroupFilter]);

  const alerts = useMemo(() => filtered.filter((r) => r.status === 'alert'), [filtered]);
  const watches = useMemo(() => filtered.filter((r) => r.status === 'watch'), [filtered]);

  const handleScrollToSection = useCallback((section: 'alert' | 'watch') => {
    const ref = section === 'alert' ? alertSectionRef : watchSectionRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleOpenDetail = useCallback((result: ScreeningResult) => {
    setSelectedResult(result);
    setSheetOpen(true);
  }, []);

  const handleCreateCip = useCallback((result: ScreeningResult) => {
    setCipDialogResult(result);
    setCipDialogOpen(true);
  }, []);

  const handleKeepWatch = useCallback((result: ScreeningResult) => {
    setWatchDialogResult(result);
    setWatchReason('');
    setWatchDialogOpen(true);
  }, []);

  const handleSubmitWatchReason = useCallback(async () => {
    if (!watchDialogResult || !watchReason.trim()) return;
    setWatchSaving(true);
    try {
      const { error } = await supabase
        .from('screening_results')
        .update({ watch_reason: watchReason.trim() })
        .eq('id', watchDialogResult.id);
      if (error) throw error;
      toast({ title: '계속 Watch', description: '사유가 저장되었습니다. 다음 달 재평가됩니다.' });
      setWatchDialogOpen(false);
      refetch();
    } catch (err) {
      toast({ title: '저장 실패', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setWatchSaving(false);
    }
  }, [watchDialogResult, watchReason, refetch]);

  const handleRunScreening = useCallback(async () => {
    setIsRunning(true);
    try {
      const resp = await fetch('/api/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearMonth }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Screening failed');
      if (data.diagnostic?.mvEmpty) {
        toast({
          title: '스크리닝 결과 없음',
          description: data.diagnostic.hint ?? '집계 대상 데이터가 없습니다.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '스크리닝 완료',
          description: `${data.processed}개 조합 분석, Alert ${data.alerts ?? 0}건, Watch ${data.watches ?? 0}건`,
        });
      }
      refetch();
    } catch (err) {
      toast({
        title: '스크리닝 실패',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  }, [yearMonth, refetch]);

  const formatYearMonth = (ym: string) => {
    if (ym.length === 6) return `${ym.slice(0, 4)}년 ${ym.slice(4)}월`;
    return ym;
  };

  return (
    <motion.div
      className="space-y-5 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Read-only banner */}
      {readOnly && (
        <motion.div
          variants={sectionVariants}
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <span className="font-semibold">Read-only archive.</span>{' '}
          For new processing, go to the <span className="font-semibold">Detect</span> tab in the
          main workflow.
        </motion.div>
      )}

      {/* Header: 월 선택 + 스크리닝 실행 */}
      <motion.div variants={sectionVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-headline text-base font-bold tracking-tight">
            Monthly screening
          </h2>
          <input
            type="month"
            value={`${yearMonth.slice(0, 4)}-${yearMonth.slice(4)}`}
            onChange={(e) => {
              const val = e.target.value.replace('-', '');
              if (val.length === 6) setYearMonth(val);
            }}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          />
          <span className="text-xs text-muted-foreground">
            {formatYearMonth(yearMonth)}
          </span>
        </div>
        <Button
          size="sm"
          onClick={handleRunScreening}
          disabled={isRunning}
          className="gap-1.5"
        >
          {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {isRunning ? '분석 중...' : '스크리닝 실행'}
        </Button>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <motion.div variants={sectionVariants} className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && results.length === 0 && (
        <motion.div
          variants={sectionVariants}
          className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-outline-variant/40"
        >
          <div className="text-center">
            <ScanSearch className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {formatYearMonth(yearMonth)} 스크리닝 결과가 없습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              CSV 데이터를 임포트한 후 &quot;스크리닝 실행&quot; 버튼을 클릭하세요
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={handleRunScreening}
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              스크리닝 실행
            </Button>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <>
          <motion.div variants={sectionVariants}>
            <ScreeningSummaryCards results={results} onScrollToSection={handleScrollToSection} />
          </motion.div>

          <motion.div variants={sectionVariants}>
            <ScreeningFilterBar
              modelFilter={modelFilter}
              partGroupFilter={partGroupFilter}
              models={models}
              partGroups={partGroups}
              resolveName={resolveName}
              onModelChange={setModelFilter}
              onPartGroupChange={setPartGroupFilter}
              onReset={() => { setModelFilter('all'); setPartGroupFilter('all'); }}
            />
          </motion.div>

          {alerts.length > 0 && (
            <motion.div variants={sectionVariants} ref={alertSectionRef}>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/40">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="font-headline text-sm font-semibold tracking-tight text-foreground">
                  Alert 승격
                </h3>
                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[0.65rem] font-bold tabular-nums text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  {alerts.length}
                </span>
              </div>
              <motion.div
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                variants={cardStagger}
                initial="hidden"
                animate="show"
              >
                {alerts.map((result) => (
                  <motion.div key={result.id} variants={cardItem}>
                    <AlertCard
                      result={result}
                      trendData={generateTrendData(result)}
                      resolveName={resolveName}
                      onClick={() => handleOpenDetail(result)}
                      onCreateCip={readOnly ? undefined : () => handleCreateCip(result)}
                      onKeepWatch={readOnly ? undefined : () => handleKeepWatch(result)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {watches.length > 0 && (
            <motion.div variants={sectionVariants} ref={watchSectionRef}>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-headline text-sm font-semibold tracking-tight text-foreground">
                  Watch 목록
                </h3>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold tabular-nums text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {watches.length}
                </span>
              </div>
              <motion.div
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                variants={cardStagger}
                initial="hidden"
                animate="show"
              >
                {watches.map((result) => (
                  <motion.div key={result.id} variants={cardItem}>
                    <WatchCard result={result} trendData={generateTrendData(result)} resolveName={resolveName} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {alerts.length === 0 && watches.length === 0 && (
            <motion.div
              variants={sectionVariants}
              className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-outline-variant/40"
            >
              <div className="text-center">
                <ScanSearch className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">필터 조건에 맞는 결과가 없습니다</p>
              </div>
            </motion.div>
          )}
        </>
      )}

      <AlertDetailSheet
        result={selectedResult}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <CreateCipDialog
        result={cipDialogResult}
        open={cipDialogOpen}
        onOpenChange={setCipDialogOpen}
      />

      {/* 계속 Watch 사유 입력 다이얼로그 */}
      <Dialog open={watchDialogOpen} onOpenChange={setWatchDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-headline">계속 Watch</DialogTitle>
            <DialogDescription>
              이 항목을 계속 Watch로 유지하는 사유를 입력하세요. 다음 달 스크리닝에서 자동 재평가됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {watchDialogResult && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {resolveName(watchDialogResult.model_code, 'model')} &times;{' '}
                {resolveName(watchDialogResult.customer_line_code, 'customerLine')} &times;{' '}
                {resolveName(watchDialogResult.part_group_code, 'partGroup')}
              </div>
            )}
            <Input
              placeholder="Watch 유지 사유를 입력하세요 (필수)"
              value={watchReason}
              onChange={(e) => setWatchReason(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setWatchDialogOpen(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitWatchReason}
              disabled={!watchReason.trim() || watchSaving}
            >
              {watchSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
