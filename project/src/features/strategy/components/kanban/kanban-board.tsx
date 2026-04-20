'use client';

import { useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { COLUMNS } from '@/features/strategy/constants/strategy-config';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { type StrategyStatus, type StrategyItem } from '@/features/strategy/lib/types';
import { KanbanColumn } from './kanban-column';
import { ScheduleDialog } from './schedule-dialog';
import { NewItemDialog } from './new-item-dialog';

interface KanbanBoardProps {
  searchQuery?: string;
}

interface PendingMove {
  itemId: string;
  toStatus: StrategyStatus;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function KanbanBoard({ searchQuery = '' }: KanbanBoardProps) {
  const items = useStrategyStore((s) => s.items);
  const moveItem = useStrategyStore((s) => s.moveItem);
  const updateItem = useStrategyStore((s) => s.updateItem);

  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [addColumnStatus, setAddColumnStatus] = useState<StrategyStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const query = searchQuery.trim().toLowerCase();
  const filteredItems: StrategyItem[] = query
    ? items.filter((i) => i.title.toLowerCase().includes(query))
    : items;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const itemId = String(active.id);
    const overId = String(over.id);

    // Determine target status: over.id may be a column id or a card id
    const targetColumn = COLUMNS.find((c) => c.id === overId);
    const targetStatus: StrategyStatus | undefined = targetColumn
      ? targetColumn.id
      : (COLUMNS.find((c) =>
          filteredItems.filter((i) => i.status === c.id).some((i) => i.id === overId)
        )?.id as StrategyStatus | undefined);

    if (!targetStatus) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    if (item.status === targetStatus) return;

    // Moving to in_progress for the first time → ask for schedule
    if (targetStatus === 'in_progress' && !item.startedAt) {
      setPendingMove({ itemId, toStatus: 'in_progress' });
      return;
    }

    // Moving to done
    if (targetStatus === 'done') {
      updateItem(itemId, { status: 'done', completedAt: todayStr(), progress: 100 });
      return;
    }

    moveItem(itemId, targetStatus);
  };

  const handleScheduleConfirm = (dueDate: string) => {
    if (!pendingMove) return;
    updateItem(pendingMove.itemId, {
      status: 'in_progress',
      startedAt: todayStr(),
      dueDate,
      progress: 5,
    });
    setPendingMove(null);
  };

  const handleScheduleCancel = () => {
    setPendingMove(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              items={filteredItems.filter((i) => i.status === col.id)}
              onAddClick={() => setAddColumnStatus(col.id)}
            />
          ))}
        </div>
      </DndContext>

      <ScheduleDialog
        open={!!pendingMove}
        onConfirm={handleScheduleConfirm}
        onCancel={handleScheduleCancel}
      />

      <NewItemDialog
        open={!!addColumnStatus}
        onClose={() => setAddColumnStatus(null)}
        defaultStatus={addColumnStatus ?? 'backlog'}
      />
    </>
  );
}
