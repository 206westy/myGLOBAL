'use client';

import { DashboardShell } from '@/features/dashboard/components/layout/dashboard-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
