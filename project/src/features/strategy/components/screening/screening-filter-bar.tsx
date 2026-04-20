'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ScreeningFilterBarProps {
  modelFilter: string;
  partGroupFilter: string;
  models: string[];
  partGroups: string[];
  resolveName?: (code: string, type: 'model' | 'partGroup' | 'customerLine') => string;
  onModelChange: (value: string) => void;
  onPartGroupChange: (value: string) => void;
  onReset: () => void;
}

export function ScreeningFilterBar({
  modelFilter,
  partGroupFilter,
  models,
  partGroups,
  resolveName,
  onModelChange,
  onPartGroupChange,
  onReset,
}: ScreeningFilterBarProps) {
  const rn = resolveName ?? ((code: string) => code);
  const hasFilter = modelFilter !== 'all' || partGroupFilter !== 'all';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-card px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
        필터
      </span>

      <Select value={modelFilter} onValueChange={onModelChange}>
        <SelectTrigger className="h-9 w-[160px] rounded-lg border-outline-variant/40 bg-background text-sm">
          <SelectValue placeholder="모델 전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">모델 전체</SelectItem>
          {models.map((m) => (
            <SelectItem key={m} value={m}>
              {rn(m, 'model')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={partGroupFilter} onValueChange={onPartGroupChange}>
        <SelectTrigger className="h-9 w-[160px] rounded-lg border-outline-variant/40 bg-background text-sm">
          <SelectValue placeholder="파트그룹 전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">파트그룹 전체</SelectItem>
          {partGroups.map((p) => (
            <SelectItem key={p} value={p}>
              {rn(p, 'partGroup')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          초기화
        </Button>
      )}
    </div>
  );
}
