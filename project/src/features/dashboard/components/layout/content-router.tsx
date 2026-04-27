'use client';

import { useDashboardStore } from '../../hooks/use-dashboard-store';
import { SIDEBAR_LABELS } from '../../constants/nav';
import { OverviewPage }      from '../overview/overview-page';
import { MaintReworkPage }   from '../rework/maint-rework-page';
import { PlaceholderPage }   from '../placeholder/placeholder-page';
import { WorkloadPage }      from '@/features/workload-dashboard/components/workload-page';

export function ContentRouter() {
  const { activeSubTab, activeSidebarItem } = useDashboardStore();

  if (activeSubTab === 'live') {
    return <PlaceholderPage name="Live Monitoring" />;
  }
  if (activeSubTab === 'forecast') {
    return <PlaceholderPage name="Forecast" />;
  }

  if (activeSidebarItem === 'overview') {
    return <OverviewPage />;
  }
  if (activeSidebarItem === 'maint-rework') {
    return <MaintReworkPage />;
  }
  if (activeSidebarItem === 'workload') {
    return <WorkloadPage />;
  }

  return <PlaceholderPage name={SIDEBAR_LABELS[activeSidebarItem]} />;
}
