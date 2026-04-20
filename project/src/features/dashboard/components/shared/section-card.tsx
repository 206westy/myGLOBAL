'use client';

import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, action, children, className }: SectionCardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.5rem] border border-outline-variant/30 bg-card',
        'shadow-[0px_12px_32px_rgba(25,28,30,0.06)]',
        'transition-shadow duration-300',
        'hover:shadow-[0px_18px_36px_rgba(25,28,30,0.08)]',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          {title && (
            <h3 className="font-headline text-base font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
