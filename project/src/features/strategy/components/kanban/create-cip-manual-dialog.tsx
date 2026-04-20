'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCipItem } from '@/features/strategy/hooks/use-cip-queries';
import { toast } from '@/hooks/use-toast';

interface CreateCipManualDialogProps {
  open: boolean;
  onClose: () => void;
}

const inputClass =
  'h-9 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 text-[0.82rem] text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30';
const labelClass = 'block text-[0.78rem] font-medium text-muted-foreground mb-1';

const MODEL_CODES = [
  'SUPRA N',
  'SUPRA Vp',
  'SUPRA XP',
  'PKE FLEX',
  'PKE S',
  'ARES',
  'PKA',
];

const PART_GROUPS: { code: string; label: string }[] = [
  { code: '00', label: '00 - General' },
  { code: '01', label: '01 - Gas Box' },
  { code: '02', label: '02 - Chamber Body' },
  { code: '03', label: '03 - Upper Electrode' },
  { code: '04', label: '04 - Lower Electrode' },
  { code: '05', label: '05 - Transfer Module' },
  { code: '06', label: '06 - Loadlock' },
  { code: '07', label: '07 - EFEM' },
  { code: '08', label: '08 - RF Generator' },
  { code: '09', label: '09 - Matcher' },
  { code: '10', label: '10 - ESC' },
  { code: '11', label: '11 - Cooling System' },
  { code: '12', label: '12 - Vacuum System' },
  { code: '13', label: '13 - Exhaust' },
  { code: '14', label: '14 - Sensor' },
  { code: '15', label: '15 - SW/Controller' },
  { code: '16', label: '16 - Power' },
  { code: '17', label: '17 - Heater' },
  { code: '18', label: '18 - Others' },
  { code: '99', label: '99 - Unknown' },
];

function computeAP(severity: number, occurrence: number, detection: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  const rpn = severity * occurrence * detection;
  if (rpn >= 200) return 'HIGH';
  if (rpn >= 80) return 'MEDIUM';
  return 'LOW';
}

function generateCipNo(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `CIP-${year}-${seq}`;
}

export function CreateCipManualDialog({ open, onClose }: CreateCipManualDialogProps) {
  const createMutation = useCreateCipItem();

  const [title, setTitle] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [partGroup, setPartGroup] = useState('');
  const [severity, setSeverity] = useState(5);
  const [occurrence, setOccurrence] = useState(5);
  const [detection, setDetection] = useState(5);
  const [description, setDescription] = useState('');

  const ap = computeAP(severity, occurrence, detection);

  const reset = useCallback(() => {
    setTitle('');
    setModelCode('');
    setPartGroup('');
    setSeverity(5);
    setOccurrence(5);
    setDetection(5);
    setDescription('');
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    createMutation.mutate(
      {
        cip_no: generateCipNo(),
        title: title.trim(),
        description: description.trim() || null,
        stage: 'registered',
        journey_type: 'B',
        model_code: modelCode || null,
        target_part_group: partGroup || null,
        severity,
        occurrence,
        detection,
        action_priority: ap,
      },
      {
        onSuccess: () => {
          toast({ title: 'CIP 생성 완료', description: `${title} 항목이 등록되었습니다.` });
          handleClose();
        },
        onError: () => {
          toast({ title: 'CIP 생성 실패', description: '다시 시도해주세요.', variant: 'destructive' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>CIP 수동 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <label className={labelClass}>제목 *</label>
            <input
              className={inputClass}
              placeholder="CIP 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>모델</label>
              <Select value={modelCode} onValueChange={setModelCode}>
                <SelectTrigger className="h-9 text-[0.82rem]">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_CODES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelClass}>파트 그룹</label>
              <Select value={partGroup} onValueChange={setPartGroup}>
                <SelectTrigger className="h-9 text-[0.82rem]">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {PART_GROUPS.map((pg) => (
                    <SelectItem key={pg.code} value={pg.code}>{pg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>심각도 (Severity)</label>
                <span className="text-[0.75rem] font-bold tabular-nums text-foreground">{severity}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>발생도 (Occurrence)</label>
                <span className="text-[0.75rem] font-bold tabular-nums text-foreground">{occurrence}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={occurrence}
                onChange={(e) => setOccurrence(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>검출도 (Detection)</label>
                <span className="text-[0.75rem] font-bold tabular-nums text-foreground">{detection}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={detection}
                onChange={(e) => setDetection(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
              <span className="text-[0.75rem] text-muted-foreground">RPN: {severity * occurrence * detection}</span>
              <span className="text-[0.6rem] text-muted-foreground">&rarr;</span>
              <span className={
                ap === 'HIGH' ? 'text-[0.75rem] font-bold text-rose-600'
                : ap === 'MEDIUM' ? 'text-[0.75rem] font-bold text-amber-600'
                : 'text-[0.75rem] font-bold text-blue-600'
              }>
                AP: {ap}
              </span>
            </div>
          </div>

          <div>
            <label className={labelClass}>설명</label>
            <textarea
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-[0.82rem] text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="증상 또는 상세 설명을 입력하세요"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={handleClose}
            className="rounded-full border border-outline-variant/30 px-4 py-1.5 text-[0.78rem] font-medium text-foreground hover:bg-surface-container-low transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || createMutation.isPending}
            className="rounded-full bg-primary px-4 py-1.5 text-[0.78rem] font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {createMutation.isPending ? '생성 중...' : '생성'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
