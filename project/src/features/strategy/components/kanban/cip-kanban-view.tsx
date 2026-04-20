'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  type DragEndEvent,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  LayoutGrid,
  Table2,
  GanttChartSquare,
  Filter,
  Plus,
  Search,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { useCipItems, useUpdateCipStage } from '@/features/strategy/hooks/use-cip-queries';
import { validateStageTransition } from '@/features/strategy/lib/cip-validators';
import { type CipItem, type CipStage } from '@/features/strategy/lib/types';
import { CipKanbanCard } from './cip-kanban-card';
import { CreateCipManualDialog } from './create-cip-manual-dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CipColumnDef {
  id: CipStage;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const CIP_COLUMNS: CipColumnDef[] = [
  {
    id: 'registered',
    label: '접수',
    color: '#7857F8',
    bgClass: 'bg-[#7857F8]/10',
    textClass: 'text-[#7857F8]',
    borderClass: 'border-[#7857F8]/30',
  },
  {
    id: 'investigating',
    label: '조사중',
    color: '#3B82F6',
    bgClass: 'bg-[#3B82F6]/10',
    textClass: 'text-[#3B82F6]',
    borderClass: 'border-[#3B82F6]/30',
  },
  {
    id: 'searching_solution',
    label: '솔루션탐색',
    color: '#F59E0B',
    bgClass: 'bg-[#F59E0B]/10',
    textClass: 'text-[#F59E0B]',
    borderClass: 'border-[#F59E0B]/30',
  },
];


const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function CipColumn({
  column,
  items,
}: {
  column: CipColumnDef;
  items: CipItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex-1 min-w-[280px] max-w-[400px] flex flex-col gap-3">
      <div className="flex items-center gap-2.5 px-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <span className="text-[0.82rem] font-semibold text-foreground">
          {column.label}
        </span>
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

      <SectionCard
        className={cn(
          'flex flex-col gap-2 p-3 min-h-[300px] transition-colors',
          isOver && 'ring-2 ring-primary/30',
        )}
      >
        <div ref={setNodeRef} className="flex flex-col gap-2 flex-1">
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/30 py-10">
                <span className="text-[0.78rem] text-muted-foreground">
                  항목 없음
                </span>
              </div>
            ) : (
              items.map((item) => <CipKanbanCard key={item.id} item={item} />)
            )}
          </SortableContext>
        </div>
      </SectionCard>
    </div>
  );
}

export function CipKanbanView() {
  const { data: dbItems, isLoading } = useCipItems();
  const updateStageMutation = useUpdateCipStage();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterEngineer, setFilterEngineer] = useState<string>('all');

  const cipItems: CipItem[] = useMemo(() => {
    const raw = dbItems ?? [];
    return raw.filter((item) => {
      const inKanbanStages = ['registered', 'investigating', 'searching_solution'].includes(item.stage);
      if (!inKanbanStages) return false;

      const q = searchQuery.trim().toLowerCase();
      if (q && !item.title.toLowerCase().includes(q) && !item.cip_no.toLowerCase().includes(q)) {
        return false;
      }
      if (filterModel !== 'all' && item.model_code !== filterModel) return false;
      if (filterPriority !== 'all' && item.action_priority !== filterPriority) return false;
      if (filterEngineer !== 'all' && item.assigned_engineer !== filterEngineer) return false;

      return true;
    });
  }, [dbItems, searchQuery, filterModel, filterPriority, filterEngineer]);

  const allItems = useMemo(() => dbItems ?? [], [dbItems]);

  const uniqueModels = useMemo(
    () => [...new Set(allItems.map((i) => i.model_code).filter(Boolean))] as string[],
    [allItems],
  );
  const uniqueEngineers = useMemo(
    () => [...new Set(allItems.map((i) => i.assigned_engineer).filter(Boolean))] as string[],
    [allItems],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const itemId = String(active.id);
      const overId = String(over.id);

      const targetColumn = CIP_COLUMNS.find((c) => c.id === overId);
      const targetStage: CipStage | undefined = targetColumn
        ? targetColumn.id
        : (CIP_COLUMNS.find((c) =>
            cipItems.filter((i) => i.stage === c.id).some((i) => i.id === overId),
          )?.id as CipStage | undefined);

      if (!targetStage) return;

      const item = cipItems.find((i) => i.id === itemId);
      if (!item) return;
      if (item.stage === targetStage) return;

      const validation = validateStageTransition(item, item.stage, targetStage);
      if (!validation.valid) {
        toast({
          title: '단계 전환 불가',
          description: validation.message ?? '유효하지 않은 전환입니다.',
          variant: 'destructive',
        });
        return;
      }

      updateStageMutation.mutate(
        { id: item.id, stage: targetStage },
        {
          onError: () => {
            toast({
              title: '단계 전환 실패',
              description: '서버 오류가 발생했습니다. 다시 시도해주세요.',
              variant: 'destructive',
            });
          },
        },
      );
    },
    [cipItems, updateStageMutation],
  );

  return (
    <motion.div
      className="space-y-5 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <SectionCard className="px-5 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded-lg border border-outline-variant/30 p-0.5">
              <button
                className="rounded-md bg-primary px-3 py-1.5 text-[0.72rem] font-semibold text-primary-foreground"
              >
                <LayoutGrid className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
                보드
              </button>
              <button
                className="rounded-md px-3 py-1.5 text-[0.72rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Table2 className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
                테이블
              </button>
              <button
                className="rounded-md px-3 py-1.5 text-[0.72rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <GanttChartSquare className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
                타임라인
              </button>
            </div>

            <div className="h-5 w-px bg-outline-variant/30" />

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="CIP 검색..."
                className="h-8 rounded-lg border border-outline-variant/30 bg-surface-container-low pl-3 pr-8 text-[0.82rem] outline-none placeholder:text-muted-foreground/60 w-44 focus:ring-2 focus:ring-primary/30"
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filterModel} onValueChange={setFilterModel}>
                <SelectTrigger className="h-8 w-32 text-[0.78rem]">
                  <SelectValue placeholder="모델" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 모델</SelectItem>
                  {uniqueModels.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-8 w-28 text-[0.78rem]">
                  <SelectValue placeholder="우선순위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="LOW">LOW</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEngineer} onValueChange={setFilterEngineer}>
                <SelectTrigger className="h-8 w-28 text-[0.78rem]">
                  <SelectValue placeholder="담당자" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {uniqueEngineers.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="flex-1" />

            <button
              onClick={() => setCreateDialogOpen(true)}
              className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-[0.78rem] font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
              수동 생성
            </button>
          </div>
        </SectionCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-5">
              {CIP_COLUMNS.map((col) => (
                <CipColumn
                  key={col.id}
                  column={col}
                  items={cipItems.filter((i) => i.stage === col.id)}
                />
              ))}
            </div>
          </DndContext>
        )}
      </motion.div>

      <CreateCipManualDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </motion.div>
  );
}
