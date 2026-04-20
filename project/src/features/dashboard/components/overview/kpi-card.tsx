'use client';

import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard } from '../shared/section-card';
import { DeltaPill } from '../shared/delta-pill';

interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  icon: LucideIcon;
  className?: string;
}

export function KpiCard({ label, value, delta, isPositive, icon: Icon, className }: KpiCardProps) {
  return (
    <SectionCard
      className={cn(
        'p-5 transition-transform duration-300 hover:-translate-y-0.5',
        className
      )}
    >
      {/* Label + icon */}
      <div className="flex items-start justify-between">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Value + delta pill */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-headline text-[1.85rem] font-bold leading-none tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        <DeltaPill value={delta} positive={isPositive} />
      </div>

      {/* Bottom row: "from last month" + → arrow */}
      <div className="mt-3 flex items-center justify-between border-t border-outline-variant/20 pt-3">
        <span className="text-[0.72rem] text-muted-foreground">
          {delta} from last month
        </span>
        <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </SectionCard>
  );
}
