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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { DUMMY_OWNERS } from '@/features/strategy/constants/strategy-data';
import { PRIORITY_CONFIG, EFFORT_CONFIG } from '@/features/strategy/constants/strategy-config';
import { type Recommendation, type Priority, type StrategyItem } from '@/features/strategy/lib/types';
import { newId } from '@/features/strategy/lib/id';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FormState {
  title: string;
  priority: Priority;
  ownerId: string;
  tags: string;
}

function buildInitialFormState(rec: Recommendation): FormState {
  return {
    title: rec.title,
    priority: 'medium',
    ownerId: DUMMY_OWNERS[0].id,
    tags: rec.tags.join(', '),
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RegisterDialog({ open, onClose }: Props) {
  const { shortlisted, addItem, clearShortlist } = useStrategyStore();
  const { toast } = useToast();

  const [formStates, setFormStates] = useState<Record<string, FormState>>(() =>
    Object.fromEntries(shortlisted.map((rec) => [rec.id, buildInitialFormState(rec)])),
  );

  // Re-init form states when shortlisted changes while dialog is closed
  const effectiveFormStates: Record<string, FormState> = {};
  for (const rec of shortlisted) {
    effectiveFormStates[rec.id] = formStates[rec.id] ?? buildInitialFormState(rec);
  }

  function patchForm(recId: string, patch: Partial<FormState>) {
    setFormStates((prev) => ({
      ...prev,
      [recId]: { ...effectiveFormStates[recId], ...patch },
    }));
  }

  function handleSubmit() {
    const today = new Date().toISOString().slice(0, 10);

    for (const rec of shortlisted) {
      const form = effectiveFormStates[rec.id];
      const owner = DUMMY_OWNERS.find((o) => o.id === form.ownerId) ?? DUMMY_OWNERS[0];
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const item: StrategyItem = {
        id: newId(),
        title: form.title,
        description: rec.description,
        status: 'ready',
        priority: form.priority,
        effort: rec.effort,
        owner,
        tags,
        expectedImpact: rec.expectedImpact,
        impactScore: rec.impactScore,
        source: 'chat',
        createdAt: today,
        progress: 0,
        subTasks: [],
        activity: [
          {
            id: newId(),
            at: today,
            text: 'AI 챗봇 추천으로 등록됨',
          },
        ],
      };

      addItem(item);
    }

    const count = shortlisted.length;
    clearShortlist();

    toast({
      title: 'Ready 컬럼에 추가됨',
      description: `${count}개 아이템이 칸반에 등록되었습니다.`,
    });

    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>아이템 등록</DialogTitle>
          <DialogDescription>
            선택한 개선 아이디어를 전략 칸반에 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-1">
          <div className="flex flex-col gap-5 py-2">
            {shortlisted.map((rec) => {
              const form = effectiveFormStates[rec.id];
              return (
                <div
                  key={rec.id}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-4 flex flex-col gap-3"
                >
                  {/* Title input */}
                  <div>
                    <label className="text-[0.72rem] text-muted-foreground font-medium mb-1 block">
                      제목
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) => patchForm(rec.id, { title: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  {/* Priority + Owner row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.72rem] text-muted-foreground font-medium mb-1 block">
                        우선순위
                      </label>
                      <Select
                        value={form.priority}
                        onValueChange={(v) => patchForm(rec.id, { priority: v as Priority })}
                      >
                        <SelectTrigger className="text-sm h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(
                            ([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                {cfg.label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[0.72rem] text-muted-foreground font-medium mb-1 block">
                        담당자
                      </label>
                      <Select
                        value={form.ownerId}
                        onValueChange={(v) => patchForm(rec.id, { ownerId: v })}
                      >
                        <SelectTrigger className="text-sm h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DUMMY_OWNERS.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Effort + Impact row (non-editable) */}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[0.72rem] text-muted-foreground font-medium mb-1">공수</p>
                      <span className="bg-gray-100 text-gray-600 text-[0.75rem] rounded-full px-2.5 py-1">
                        {EFFORT_CONFIG[rec.effort].label}
                      </span>
                    </div>
                    <div>
                      <p className="text-[0.72rem] text-muted-foreground font-medium mb-1">기대 효과</p>
                      <span className="text-[0.78rem] text-foreground">{rec.expectedImpact}</span>
                    </div>
                  </div>

                  {/* Tags input */}
                  <div>
                    <label className="text-[0.72rem] text-muted-foreground font-medium mb-1 block">
                      태그 (쉼표로 구분)
                    </label>
                    <Input
                      value={form.tags}
                      onChange={(e) => patchForm(rec.id, { tags: e.target.value })}
                      placeholder="태그1, 태그2, ..."
                      className="text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 mt-2">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 text-[0.82rem] rounded-full border border-outline-variant/30',
              'text-muted-foreground hover:bg-surface-container-low transition-colors cursor-pointer',
            )}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={shortlisted.length === 0}
            className={cn(
              'px-5 py-2 text-[0.82rem] font-semibold rounded-full',
              'bg-primary text-primary-foreground',
              'hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40',
            )}
          >
            등록하기
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
