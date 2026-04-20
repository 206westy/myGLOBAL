'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDashboardStore, type MainTab } from '../../hooks/use-dashboard-store';

const VALID_MAIN_TABS: MainTab[] = ['dashboard', 'workspace', 'strategy', 'aichat'];

export function InitMainTabFromQuery() {
  const searchParams = useSearchParams();
  const setMainTab = useDashboardStore((s) => s.setMainTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (VALID_MAIN_TABS as string[]).includes(tab)) {
      setMainTab(tab as MainTab);
    }
  }, [searchParams, setMainTab]);

  return null;
}
