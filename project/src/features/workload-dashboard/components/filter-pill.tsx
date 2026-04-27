'use client';

import { X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { type DimensionKey } from '../lib/types';
import { DIMENSION_INDICES } from '../constants/indices';
import { MOCK_DIMENSION_VALUES } from '../constants/mock-data';

interface FilterPillProps {
  dimension: DimensionKey;
  values: string[];
  onChange: (values: string[]) => void;
  onRemove: () => void;
}

export function FilterPill({ dimension, values, onChange, onRemove }: FilterPillProps) {
  const def = DIMENSION_INDICES.find((d) => d.key === dimension)!;
  const all = MOCK_DIMENSION_VALUES[dimension] ?? [];

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };

  const summary = values.length === 0
    ? 'All'
    : values.length <= 2
      ? values.join(', ')
      : `${values.length} selected`;

  return (
    <div className="inline-flex h-8 items-center gap-1 rounded-full border border-outline-variant/40 bg-card pr-1 pl-3 text-[0.75rem]">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none">
          <span className="font-medium text-foreground">{def.label}:</span>
          <span className="text-muted-foreground">{summary}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 w-56 overflow-y-auto">
          {all.map((v) => (
            <DropdownMenuCheckboxItem
              key={v}
              checked={values.includes(v)}
              onCheckedChange={() => toggle(v)}
              onSelect={(e) => e.preventDefault()}
            >
              {v}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        onClick={onRemove}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground"
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
