'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ScheduleDialogProps {
  open: boolean;
  onConfirm: (dueDate: string) => void;
  onCancel: () => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function ScheduleDialog({ open, onConfirm, onCancel }: ScheduleDialogProps) {
  const [dueDate, setDueDate] = useState(defaultDueDate);

  const handleConfirm = () => {
    if (!dueDate) return;
    onConfirm(dueDate);
    setDueDate(defaultDueDate());
  };

  const handleCancel = () => {
    setDueDate(defaultDueDate());
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>실행 일정 설정</DialogTitle>
          <DialogDescription>
            이 아이템을 실행으로 옮깁니다. 목표 완료일을 설정해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.82rem] text-muted-foreground w-24 shrink-0">시작일</span>
            <span className="text-[0.82rem] font-medium text-foreground tabular-nums">
              {todayStr()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="schedule-due"
              className="text-[0.82rem] text-muted-foreground w-24 shrink-0"
            >
              목표 완료일
            </label>
            <input
              id="schedule-due"
              type="date"
              value={dueDate}
              min={tomorrowStr()}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 flex-1 rounded-md border border-outline-variant/30 bg-background px-3 text-[0.82rem] text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={handleCancel}
            className="rounded-full border border-outline-variant/30 px-4 py-1.5 text-[0.78rem] font-medium text-foreground hover:bg-surface-container-low transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!dueDate}
            className="rounded-full bg-primary px-4 py-1.5 text-[0.78rem] font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            확정
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
