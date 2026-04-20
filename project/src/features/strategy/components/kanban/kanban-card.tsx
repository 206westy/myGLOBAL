'use client';

import { useSortable } from '@dnd-kit/sortable';
import { Progress } from '@/components/ui/progress';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { PriorityBadge } from '@/features/strategy/components/shared/priority-badge';
import { OwnerAvatar } from '@/features/strategy/components/shared/owner-avatar';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { type StrategyItem } from '@/features/strategy/lib/types';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  item: StrategyItem;
}

function isOverdue(item: StrategyItem): boolean {
  if (!item.dueDate || item.status === 'done') return false;
  return item.dueDate < new Date().toISOString().slice(0, 10);
}

function dueDateLabel(item: StrategyItem): string | null {
  if (!item.dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  const diffDays = Math.round(
    (new Date(item.dueDate).getTime() - new Date(today).getTime()) / 86400000,
  );
  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

export function KanbanCard({ item }: KanbanCardProps) {
  const setSelectedItem = useStrategyStore((s) => s.setSelectedItem);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = isOverdue(item);
  const dateLabel = dueDateLabel(item);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SectionCard
        className={cn(
          'p-4 cursor-grab active:cursor-grabbing',
          overdue && 'border-rose-300',
        )}
      >
        {/* Non-draggable inner content — click to open detail */}
        <div
          onClick={() => setSelectedItem(item.id)}
          className="space-y-2"
        >
          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[0.62rem] bg-surface-container-low rounded px-1.5 py-px text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <p className="text-[0.88rem] font-semibold text-foreground leading-snug line-clamp-2">
            {item.title}
          </p>

          {/* Description */}
          {item.description && (
            <p className="text-[0.75rem] text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}

          {/* Progress bar for in_progress */}
          {item.status === 'in_progress' && (
            <Progress value={item.progress} className="h-1 mt-2" />
          )}

          {/* Bottom meta row */}
          <div className="flex items-center gap-2 pt-1">
            <PriorityBadge priority={item.priority} />
            <span className="flex-1" />
            {dateLabel && (
              <span
                className={cn(
                  'text-[0.68rem] tabular-nums',
                  overdue ? 'text-rose-500 font-medium' : 'text-muted-foreground',
                )}
              >
                {dateLabel}
              </span>
            )}
            <OwnerAvatar owner={item.owner} size="sm" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
