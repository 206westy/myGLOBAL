'use client';

import { type ElementType, type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="font-headline text-[0.95rem] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-[0.82rem] text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
