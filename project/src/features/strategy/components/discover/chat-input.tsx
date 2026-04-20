'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useChatFlow } from '@/features/strategy/hooks/use-chat-flow';
import { cn } from '@/lib/utils';

export function ChatInput() {
  const [text, setText] = useState('');
  const { send } = useChatFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    send(trimmed);
    setText('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-outline-variant/20 pt-4 px-6 pb-6">
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="개선 아이디어를 입력하거나 질문하세요... (Enter로 전송)"
        className={cn(
          'flex-1 min-h-[44px] max-h-[120px] resize-none text-[0.85rem]',
          'border-outline-variant/30 focus-visible:ring-primary/30',
        )}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className={cn(
          'flex-shrink-0 flex items-center justify-center',
          'h-8 w-8 rounded-full bg-primary text-primary-foreground',
          'transition-opacity disabled:opacity-40',
          'hover:opacity-90 cursor-pointer',
        )}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
