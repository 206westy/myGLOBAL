'use client';

import { Sidebar }       from './sidebar';
import { ContentHeader } from './content-header';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ContentHeader />
        <main className="flex-1 overflow-y-auto bg-muted">
          {children}
        </main>
      </div>
    </div>
  );
}
