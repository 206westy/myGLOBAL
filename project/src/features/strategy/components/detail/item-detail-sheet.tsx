'use client';

import { useState } from 'react';
import { Calendar, Flag, Tag, Trash2, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { type SubTask } from '@/features/strategy/lib/types';
import { formatDate, isOverdue } from '@/features/strategy/lib/gantt-range';
import { nextStatus, COLUMN_MAP } from '@/features/strategy/constants/strategy-config';
import { PriorityBadge } from '../shared/priority-badge';
import { EffortBadge } from '../shared/effort-badge';
import { StatusDot } from '../shared/status-dot';
import { OwnerAvatar } from '../shared/owner-avatar';

export function ItemDetailSheet() {
  const selectedItemId = useStrategyStore((s) => s.selectedItemId);
  const item = useStrategyStore((s) => s.items.find((i) => i.id === s.selectedItemId));
  const setSelectedItem = useStrategyStore((s) => s.setSelectedItem);
  const updateItem = useStrategyStore((s) => s.updateItem);
  const deleteItem = useStrategyStore((s) => s.deleteItem);
  const moveItem = useStrategyStore((s) => s.moveItem);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  const isOpen = selectedItemId !== null;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setIsEditingTitle(false);
      setSelectedItem(null);
    }
  }

  function handleTitleClick() {
    if (!item) return;
    setDraftTitle(item.title);
    setIsEditingTitle(true);
  }

  function handleTitleBlur() {
    if (!item) return;
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== item.title) {
      updateItem(item.id, { title: trimmed });
    }
    setIsEditingTitle(false);
  }

  function handleToggleSubTask(stId: string) {
    if (!item) return;
    const newSubTasks: SubTask[] = item.subTasks.map((st) =>
      st.id === stId ? { ...st, done: !st.done } : st,
    );
    const doneCount = newSubTasks.filter((st) => st.done).length;
    const progress = newSubTasks.length > 0
      ? Math.round((doneCount / newSubTasks.length) * 100)
      : 0;
    updateItem(item.id, { subTasks: newSubTasks, progress });
  }

  function handleMoveNext() {
    if (!item) return;
    const next = nextStatus(item.status);
    if (next) {
      moveItem(item.id, next);
      setSelectedItem(null);
    }
  }

  function handleDelete() {
    if (!item) return;
    deleteItem(item.id);
    setSelectedItem(null);
  }

  // Render nothing if item not found (guard)
  if (isOpen && !item) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-[480px] sm:max-w-[480px]">
          <SheetHeader>
            <SheetTitle>아이템을 찾을 수 없습니다</SheetTitle>
            <SheetDescription>선택된 아이템이 삭제되었거나 존재하지 않습니다.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  if (!item) {
    return (
      <Sheet open={false} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-[480px] sm:max-w-[480px]" />
      </Sheet>
    );
  }

  const colDef = COLUMN_MAP[item.status];
  const next = nextStatus(item.status);
  const completedSubTasks = item.subTasks.filter((st) => st.done).length;
  const totalSubTasks = item.subTasks.length;
  const dueDateOverdue = item.dueDate ? isOverdue(item.dueDate) && item.status !== 'done' : false;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] overflow-y-auto flex flex-col gap-0 p-0"
      >
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <SheetHeader className="space-y-3">
            {/* Inline editable title */}
            <div className="pr-6">
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleBlur();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="w-full text-lg font-semibold text-foreground bg-transparent border-b-2 border-primary outline-none pb-0.5"
                  placeholder="아이템 제목을 입력하세요"
                />
              ) : (
                <SheetTitle
                  onClick={handleTitleClick}
                  className="text-lg font-semibold text-foreground cursor-text hover:text-primary transition-colors text-left"
                >
                  {item.title}
                </SheetTitle>
              )}
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <StatusDot status={item.status} />
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold',
                  colDef.bgClass,
                  colDef.textClass,
                )}
              >
                {colDef.label}
              </span>
            </div>

            <SheetDescription className="sr-only">
              전략 아이템 상세 정보
            </SheetDescription>
          </SheetHeader>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[0.78rem] text-muted-foreground">
            {/* Owner */}
            <div className="flex items-center gap-1.5">
              <OwnerAvatar owner={item.owner} size="sm" />
              <span>{item.owner.name}</span>
            </div>

            {/* Effort */}
            <div className="flex items-center gap-1.5">
              <EffortBadge effort={item.effort} />
            </div>

            {/* Priority */}
            <div className="flex items-center gap-1.5">
              <PriorityBadge priority={item.priority} />
            </div>

            {/* Start date */}
            {item.startedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{formatDate(item.startedAt)}</span>
              </div>
            )}

            {/* Due date */}
            {item.dueDate && (
              <div
                className={cn(
                  'flex items-center gap-1',
                  dueDateOverdue && 'text-rose-500 font-medium',
                )}
              >
                <Flag className={cn('h-3.5 w-3.5 flex-shrink-0', dueDateOverdue && 'text-rose-500')} />
                <span>{formatDate(item.dueDate)}</span>
              </div>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-surface-container-low text-muted-foreground rounded-full px-2 py-0.5 text-[0.68rem]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress section */}
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
              진행률
            </span>
            <span className="font-headline font-bold text-foreground text-[1.05rem]">
              {item.progress}%
            </span>
          </div>
          <Progress value={item.progress} className="h-2" />
          <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
            {completedSubTasks}/{totalSubTasks} 서브태스크 완료
          </p>
        </div>

        {/* Description section */}
        {item.description && (
          <div className="px-6 py-4 border-b border-outline-variant/20">
            <Separator className="mb-3" />
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              설명
            </p>
            <p className="text-[0.85rem] text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {item.description}
            </p>
          </div>
        )}

        {/* Sub-tasks section */}
        {item.subTasks.length > 0 && (
          <div className="px-6 py-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                서브태스크
              </p>
            </div>
            <div className="space-y-0.5">
              {item.subTasks.map((st) => (
                <label
                  key={st.id}
                  className="flex items-center gap-2 py-1.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => handleToggleSubTask(st.id)}
                    className="h-3.5 w-3.5 rounded border-outline-variant/50 text-primary accent-[#5F3ADD] cursor-pointer flex-shrink-0"
                  />
                  <span
                    className={cn(
                      'text-[0.85rem] select-none',
                      st.done ? 'line-through text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {st.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Activity section */}
        {item.activity.length > 0 && (
          <div className="px-6 py-4 border-b border-outline-variant/20">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              활동 내역
            </p>
            <div className="space-y-2">
              {item.activity.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] text-foreground leading-snug">{entry.text}</p>
                    <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                      {formatDate(entry.at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-2 px-6 mt-auto pt-4 pb-6 border-t border-outline-variant/20">
          {next && (
            <button
              onClick={handleMoveNext}
              className="flex-1 bg-primary text-primary-foreground rounded-full px-4 py-2 text-[0.82rem] font-semibold hover:opacity-90 transition-opacity"
            >
              {COLUMN_MAP[next].label}로 이동
            </button>
          )}
          <button
            onClick={handleDelete}
            className={cn(
              'flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 rounded-lg px-3 py-2 text-[0.82rem] transition-colors',
              !next && 'ml-auto',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            삭제
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
