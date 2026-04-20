'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { RegisterDialog } from './register-dialog';
import { cn } from '@/lib/utils';

export function ShortlistDock() {
  const shortlisted = useStrategyStore((s) => s.shortlisted);
  const removeFromShortlist = useStrategyStore((s) => s.removeFromShortlist);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (shortlisted.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          'sticky bottom-4',
          'rounded-2xl border border-primary/30 bg-card',
          'shadow-[0px_12px_32px_rgba(95,58,221,0.12)]',
          'px-5 py-3 flex items-center gap-3',
        )}
      >
        {/* Left: star icon chip */}
        <div className="flex-shrink-0 flex items-center justify-center bg-primary-fixed text-primary rounded-lg h-8 w-8">
          <Star className="w-4 h-4" fill="currentColor" />
        </div>

        {/* Middle: count + chips */}
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
          <span className="text-[0.78rem] font-semibold text-foreground whitespace-nowrap">
            선택된 후보 {shortlisted.length}건
          </span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {shortlisted.map((rec) => (
              <span
                key={rec.id}
                className={cn(
                  'flex items-center gap-1 flex-shrink-0',
                  'bg-surface-container-low rounded-full px-2.5 py-1',
                  'text-[0.72rem] text-muted-foreground',
                )}
              >
                {rec.title.length > 14 ? rec.title.slice(0, 14) + '…' : rec.title}
                <button
                  onClick={() => removeFromShortlist(rec.id)}
                  className="text-muted-foreground/60 hover:text-foreground transition-colors ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Right: register button */}
        <button
          onClick={() => setDialogOpen(true)}
          className={cn(
            'flex-shrink-0 rounded-full bg-primary text-primary-foreground',
            'px-5 py-2 text-[0.82rem] font-semibold',
            'hover:opacity-90 transition-opacity cursor-pointer',
          )}
        >
          등록하기
        </button>
      </div>

      <RegisterDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
