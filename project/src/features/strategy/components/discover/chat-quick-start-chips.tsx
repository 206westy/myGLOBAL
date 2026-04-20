'use client';

import { useChatFlow } from '@/features/strategy/hooks/use-chat-flow';
import { cn } from '@/lib/utils';

const CHIPS = ['리워크 감소', '에너지 절감', '사이클 단축', '품질 개선', '셋업 시간'];

export function ChatQuickStartChips() {
  const { send } = useChatFlow();

  return (
    <div className="flex flex-wrap gap-2 px-1 pb-3">
      {CHIPS.map((label) => (
        <button
          key={label}
          onClick={() => send(label)}
          className={cn(
            'rounded-full border border-outline-variant/40 px-3 py-1.5',
            'text-[0.78rem] text-muted-foreground',
            'hover:bg-primary-fixed hover:text-on-primary-fixed-variant hover:border-primary/30',
            'transition-colors cursor-pointer',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
