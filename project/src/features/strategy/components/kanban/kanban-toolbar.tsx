'use client';

import { Search } from 'lucide-react';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';

interface KanbanToolbarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onAddItem: () => void;
}

export function KanbanToolbar({ searchQuery, onSearchChange, onAddItem }: KanbanToolbarProps) {
  return (
    <SectionCard className="px-5 py-3">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="아이템 검색..."
            className="h-8 rounded-lg border border-outline-variant/30 bg-surface-container-low pl-3 pr-8 text-[0.82rem] outline-none placeholder:text-muted-foreground/60 w-48 focus:ring-2 focus:ring-primary/30"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        </div>

        <span className="flex-1" />

        {/* Add item button */}
        <button
          onClick={onAddItem}
          className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-[0.78rem] font-semibold hover:opacity-90 transition-opacity"
        >
          + 새 아이템 추가
        </button>
      </div>
    </SectionCard>
  );
}
