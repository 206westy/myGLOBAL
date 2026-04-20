'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { KanbanCard } from './kanban-card';
import { type ColumnDef } from '@/features/strategy/constants/strategy-config';
import { type StrategyItem } from '@/features/strategy/lib/types';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: ColumnDef;
  items: StrategyItem[];
  onAddClick: () => void;
}

export function KanbanColumn({ column, items, onAddClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="w-72 shrink-0 flex flex-col gap-3">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[0.82rem] font-semibold text-foreground">{column.label}</span>
          <span
            className={cn(
              'rounded-full px-2 py-px text-[0.65rem] font-bold tabular-nums',
              column.bgClass,
              column.textClass,
            )}
          >
            {items.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container-low hover:text-foreground transition-colors"
          aria-label={`${column.label}에 추가`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Column body */}
      <SectionCard
        className={cn(
          'flex flex-col gap-2 p-3 min-h-[200px] transition-colors',
          isOver && 'bg-primary-fixed/30',
        )}
      >
        <div ref={setNodeRef} className="flex flex-col gap-2 flex-1">
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/30 py-8">
                <span className="text-[0.78rem] text-muted-foreground">아직 없음</span>
              </div>
            ) : (
              items.map((item) => <KanbanCard key={item.id} item={item} />)
            )}
          </SortableContext>
        </div>
      </SectionCard>
    </div>
  );
}
