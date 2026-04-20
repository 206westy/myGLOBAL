'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mail,
  Bell,
  ChevronDown,
  Download,
  MoreHorizontal,
  LayoutGrid,
  Activity,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '../../hooks/use-dashboard-store';
import { MAIN_TABS, MAIN_TAB_LABELS } from '../../constants/nav';
import { type MainTab } from '../../hooks/use-dashboard-store';
import { type SubTab } from '../../hooks/use-dashboard-store';
import { StrategyHeaderBar } from '@/features/strategy/components/layout/strategy-header-bar';

const TAB_ROUTES: Record<MainTab, string> = {
  dashboard:  '/dashboard',
  workspace:  '/workspace',
  strategy:   '/strategy',
  aichat:     '/aichat',
};

function getActiveMainTab(pathname: string): MainTab {
  if (pathname.startsWith('/strategy'))  return 'strategy';
  if (pathname.startsWith('/workspace')) return 'workspace';
  if (pathname.startsWith('/aichat'))    return 'aichat';
  return 'dashboard';
}

const SUB_TABS: { value: SubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'overview', label: 'Overview', icon: LayoutGrid  },
  { value: 'live',     label: 'Live',     icon: Activity    },
  { value: 'forecast', label: 'Forecast', icon: TrendingUp  },
];

function DashboardHeaderBar() {
  const { activeSubTab, setSubTab } = useDashboardStore();

  return (
    <div className="flex h-11 items-center justify-between px-7">
      {/* Sub-tab flat buttons */}
      <div className="flex items-center gap-0.5">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSubTab(tab.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.8rem] font-medium transition-colors duration-150',
                isActive
                  ? 'bg-surface-container-low text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-surface-container-low/60 hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-full border border-outline-variant/40 bg-card px-3.5 text-[0.75rem] font-medium text-foreground transition-colors hover:bg-surface-container-low">
          Monthly
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-4 text-[0.75rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}

export function ContentHeader() {
  const pathname = usePathname();
  const activeMainTab = getActiveMainTab(pathname);
  const pageTitle = MAIN_TAB_LABELS[activeMainTab];

  return (
    <div className="shrink-0 bg-card border-b border-outline-variant/30">
      {/* Row 1: Page title + tab navigation + action icons */}
      <div className="flex h-14 items-center justify-between px-7">
        <h1 className="font-headline text-[1.45rem] font-bold tracking-tight text-foreground">
          {pageTitle}
        </h1>

        <div className="flex items-center gap-1">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={TAB_ROUTES[tab.id]}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-surface-container-low/60 hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
            <Mail className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
            <Bell className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-outline-variant/50" />
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-container-low">
            <Avatar className="h-7 w-7">
              <AvatarImage src="https://i.pravatar.cc/32?img=7" alt="User" />
              <AvatarFallback className="text-[0.62rem] font-bold bg-primary-fixed text-on-primary-fixed-variant">
                GF
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Sub-tabs + controls (context-aware) */}
      {activeMainTab === 'strategy' ? <StrategyHeaderBar /> : activeMainTab === 'dashboard' ? <DashboardHeaderBar /> : null}
    </div>
  );
}
