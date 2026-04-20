'use client';

import { useState } from 'react';
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
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { DUMMY_OWNERS } from '@/features/strategy/constants/strategy-data';
import { type StrategyStatus, type Priority, type Effort } from '@/features/strategy/lib/types';
import { newId } from '@/features/strategy/lib/id';

interface NewItemDialogProps {
  open: boolean;
  onClose: () => void;
  defaultStatus?: StrategyStatus;
}

const inputClass =
  'h-9 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 text-[0.82rem] text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30';
const labelClass = 'block text-[0.78rem] font-medium text-muted-foreground mb-1';

export function NewItemDialog({ open, onClose, defaultStatus = 'backlog' }: NewItemDialogProps) {
  const addItem = useStrategyStore((s) => s.addItem);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [ownerId, setOwnerId] = useState(DUMMY_OWNERS[0].id);
  const [effort, setEffort] = useState<Effort>('M');
  const [expectedImpact, setExpectedImpact] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setOwnerId(DUMMY_OWNERS[0].id);
    setEffort('M');
    setExpectedImpact('');
    setTagsRaw('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const owner = DUMMY_OWNERS.find((o) => o.id === ownerId) ?? DUMMY_OWNERS[0];
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addItem({
      id: newId(),
      title: title.trim(),
      description: description.trim(),
      status: defaultStatus,
      priority,
      effort,
      owner,
      tags,
      expectedImpact: expectedImpact.trim(),
      impactScore: 50,
      source: 'manual',
      createdAt: new Date().toISOString().slice(0, 10),
      progress: 0,
      subTasks: [],
      activity: [{ id: newId(), at: new Date().toISOString().slice(0, 10), text: '아이템 생성됨' }],
    });

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 아이템 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <label className={labelClass}>제목 *</label>
            <input
              className={inputClass}
              placeholder="아이템 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>설명</label>
            <textarea
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-[0.82rem] text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="아이템에 대한 설명을 입력하세요"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>우선순위</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-9 text-[0.82rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">긴급</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelClass}>노력 규모</label>
              <Select value={effort} onValueChange={(v) => setEffort(v as Effort)}>
                <SelectTrigger className="h-9 text-[0.82rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">S (1~2주)</SelectItem>
                  <SelectItem value="M">M (1개월)</SelectItem>
                  <SelectItem value="L">L (2~3개월)</SelectItem>
                  <SelectItem value="XL">XL (6개월+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className={labelClass}>담당자</label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger className="h-9 text-[0.82rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUMMY_OWNERS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={labelClass}>기대 효과</label>
            <input
              className={inputClass}
              placeholder="예: 리워크 10% 감소"
              value={expectedImpact}
              onChange={(e) => setExpectedImpact(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>태그 (쉼표로 구분)</label>
            <input
              className={inputClass}
              placeholder="예: 자동화, 품질, AI"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
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
            disabled={!title.trim()}
            className="rounded-full bg-primary px-4 py-1.5 text-[0.78rem] font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            추가
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
