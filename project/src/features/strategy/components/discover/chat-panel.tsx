'use client';

import { useEffect, useRef } from 'react';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { ChatMessageBubble } from './chat-message-bubble';
import { ChatQuickStartChips } from './chat-quick-start-chips';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const chatMessages = useStrategyStore((s) => s.chatMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const showChips = chatMessages.length <= 1;

  return (
    <SectionCard
      title="AI 발굴 챗봇"
      action={
        <button
          onClick={() => console.log('개발 예정')}
          title="개발 예정"
          className={cn(
            'text-[0.75rem] text-muted-foreground px-2.5 py-1 rounded-lg',
            'border border-outline-variant/30 hover:bg-surface-container-low',
            'transition-colors cursor-pointer',
          )}
        >
          대화 초기화
        </button>
      }
      className="flex flex-col"
    >
      <ScrollArea className={cn('h-[calc(100vh-28rem)] px-6')}>
        <div className="flex flex-col py-2">
          {chatMessages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <TypingIndicator />
          <div ref={bottomRef} />
        </div>
        {showChips && (
          <div className="mt-2">
            <ChatQuickStartChips />
          </div>
        )}
      </ScrollArea>

      <ChatInput />
    </SectionCard>
  );
}
