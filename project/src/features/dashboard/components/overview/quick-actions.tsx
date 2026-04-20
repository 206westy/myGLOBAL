'use client';

import { ArrowRight, Building2 } from 'lucide-react';
import { SectionCard } from '../shared/section-card';

const ACTIONS = [
  { id: 'kr', label: 'KR Branch', sub: 'Korea Operations', color: 'bg-primary-fixed text-primary' },
  { id: 'hs', label: 'HS Branch', sub: 'High Speed Line',  color: 'bg-emerald-50 text-emerald-700' },
];

export function QuickActions() {
  return (
    <SectionCard title="Quick Actions">
      <div className="px-6 pb-6 space-y-2">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => console.log(`Quick action: ${action.label}`)}
            className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors duration-200 hover:bg-surface-container-low"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{action.label}</p>
              <p className="text-[0.72rem] text-muted-foreground">{action.sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
