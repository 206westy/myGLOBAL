'use client';

import { SectionCard } from '../shared/section-card';
import { EQUIPMENT_HEALTH } from '../../constants/overview-data';
import { cn } from '@/lib/utils';

export function EquipmentHealthFunnel() {
  const total = EQUIPMENT_HEALTH.reduce((acc, s) => acc + s.count, 0);

  return (
    <SectionCard title="Equipment Health">
      <div className="px-6 pb-6 space-y-4">
        <p className="text-[0.72rem] text-muted-foreground -mt-2">
          {total.toLocaleString()} total units
        </p>
        {EQUIPMENT_HEALTH.map((segment) => (
          <div key={segment.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', segment.color)} />
                <span className="text-[0.82rem] text-foreground">{segment.label}</span>
              </div>
              <div className="flex items-center gap-3 text-[0.78rem]">
                <span className="font-semibold tabular-nums text-foreground">
                  {segment.pct}%
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {segment.count.toLocaleString()} units
                </span>
              </div>
            </div>
            <div className={cn('h-2.5 w-full rounded-full', segment.bgColor)}>
              <div
                className={cn('h-full rounded-full transition-all duration-700', segment.color)}
                style={{ width: `${segment.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
