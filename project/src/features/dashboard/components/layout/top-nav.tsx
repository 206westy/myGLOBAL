'use client';

import { Download, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '../../hooks/use-dashboard-store';
import { MAIN_TABS, type MainTabDef } from '../../constants/nav';
import { type SubTab } from '../../hooks/use-dashboard-store';

const SUB_TABS: { value: SubTab; label: string }[] = [
  { value: 'overview',  label: 'Overview'  },
  { value: 'live',      label: 'Live'      },
  { value: 'forecast',  label: 'Forecast'  },
];

export function TopNav() {
  const {
    activeMainTab, setMainTab,
    activeSubTab, setSubTab,
  } = useDashboardStore();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-outline-variant/30 bg-card px-6">
      {/* Main tabs */}
      <nav className="flex items-center gap-1">
        {MAIN_TABS.map((tab) => (
          <MainTabButton
            key={tab.id}
            tab={tab}
            isActive={activeMainTab === tab.id}
            onClick={() => setMainTab(tab.id)}
          />
        ))}
      </nav>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Sub-tab pills */}
        <div className="flex items-center gap-1 rounded-full bg-surface-container-low p-1">
          {SUB_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setSubTab(t.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-[0.75rem] font-medium transition-all duration-200',
                activeSubTab === t.value
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Monthly dropdown */}
        <button className="flex h-9 items-center gap-1.5 rounded-full border border-outline-variant/40 bg-card px-4 text-[0.78rem] font-medium text-foreground transition-colors hover:bg-surface-container-low">
          Monthly
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Download */}
        <button className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[0.78rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          <Download className="h-3.5 w-3.5" />
          Download
        </button>

        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://i.pravatar.cc/32?img=7" alt="User avatar" />
          <AvatarFallback className="text-[0.7rem] font-semibold bg-primary-fixed text-on-primary-fixed-variant">
            GF
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function MainTabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: MainTabDef;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex h-16 items-center px-4 text-[0.85rem] transition-colors duration-150',
        isActive
          ? 'font-semibold text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {tab.label}
      {isActive && (
        <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary" />
      )}
    </button>
  );
}
