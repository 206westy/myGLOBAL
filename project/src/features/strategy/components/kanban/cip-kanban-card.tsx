'use client';

import { useSortable } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { type CipItem, type ActionPriority } from '@/features/strategy/lib/types';
import { cn } from '@/lib/utils';

interface CipKanbanCardProps {
  item: CipItem;
}

const PRIORITY_STYLES: Record<ActionPriority, { dot: string; bg: string; text: string; label: string }> = {
  HIGH:   { dot: 'bg-rose-500',  bg: 'bg-rose-50',  text: 'text-rose-700',  label: 'HIGH' },
  MEDIUM: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'MED' },
  LOW:    { dot: 'bg-blue-500',  bg: 'bg-blue-50',  text: 'text-blue-700',  label: 'LOW' },
};

function daysElapsed(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86400000));
}

export function CipKanbanCard({ item }: CipKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = item.action_priority ?? 'MEDIUM';
  const pStyle = PRIORITY_STYLES[priority];
  const elapsed = daysElapsed(item.created_at);

  const modelPart = [item.model_code, item.target_part_group]
    .filter(Boolean)
    .join(' \u00D7 ');

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
      >
        <SectionCard
          className={cn(
            'p-3.5 cursor-grab active:cursor-grabbing',
            'hover:border-primary/30',
            isDragging && 'shadow-lg ring-2 ring-primary/20',
          )}
        >
          <div className="space-y-2">
            <span className="font-mono text-[0.72rem] font-bold tracking-wide text-primary">
              {item.cip_no}
            </span>

            <p className="text-[0.82rem] font-semibold text-foreground leading-snug line-clamp-2">
              {item.title}
            </p>

            {modelPart && (
              <p className="text-[0.7rem] text-muted-foreground font-medium tracking-wide">
                {modelPart}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.62rem] font-bold',
                  pStyle.bg,
                  pStyle.text,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', pStyle.dot)} />
                {pStyle.label}
              </span>

              <span className="text-[0.68rem] font-semibold tabular-nums text-muted-foreground">
                D+{elapsed}
              </span>

              <span className="flex-1" />

              {item.assigned_engineer ? (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[0.55rem] font-bold text-white shrink-0"
                  title={item.assigned_engineer}
                >
                  {item.assigned_engineer.charAt(0)}
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
