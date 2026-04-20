'use client';

import { type ChatMessage, type Recommendation } from '@/features/strategy/lib/types';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface Props {
  message: ChatMessage;
}

function renderBoldMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

interface InlineRecCardProps {
  rec: Recommendation;
}

function InlineRecCard({ rec }: InlineRecCardProps) {
  const { addToShortlist, shortlisted } = useStrategyStore();
  const isShortlisted = shortlisted.some((r) => r.id === rec.id);

  return (
    <div
      className={cn(
        'flex-shrink-0 w-48 rounded-xl border border-outline-variant/30 bg-card p-3',
        'shadow-[0px_4px_12px_rgba(25,28,30,0.06)]',
      )}
    >
      <p className="text-[0.78rem] font-semibold text-foreground line-clamp-2 mb-2">
        {rec.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className="bg-primary-fixed text-on-primary-fixed-variant text-[0.65rem] rounded-full px-2 py-0.5">
          {rec.expectedImpact}
        </span>
        <span className="bg-gray-100 text-gray-600 text-[0.65rem] rounded-full px-2 py-0.5">
          {rec.effort}
        </span>
      </div>
      <button
        onClick={() => addToShortlist(rec)}
        disabled={isShortlisted}
        className={cn(
          'flex items-center gap-1 text-[0.68rem] rounded-full px-2 py-1 transition-colors',
          isShortlisted
            ? 'bg-primary-fixed text-on-primary-fixed-variant cursor-default'
            : 'bg-surface-container-low text-muted-foreground hover:bg-primary-fixed hover:text-on-primary-fixed-variant',
        )}
      >
        <Plus className="w-3 h-3" />
        {isShortlisted ? '추가됨' : '후보 추가'}
      </button>
    </div>
  );
}

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%]', isUser ? 'items-end' : 'items-start', 'flex flex-col')}>
        <div
          className={cn(
            'text-[0.85rem] leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5'
              : 'bg-surface-container-low text-foreground rounded-2xl rounded-bl-sm px-4 py-3',
          )}
        >
          {isUser
            ? message.content
            : message.content.split('\n').map((line, i) => (
                <span key={i}>
                  {renderBoldMarkdown(line)}
                  {i < message.content.split('\n').length - 1 && <br />}
                </span>
              ))}

          {!isUser && message.recommendations && message.recommendations.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {message.recommendations.map((rec) => (
                <InlineRecCard key={rec.id} rec={rec} />
              ))}
            </div>
          )}
        </div>

        <span
          className={cn(
            'text-[0.65rem] text-muted-foreground mt-1',
            isUser ? 'text-right' : 'text-left',
          )}
        >
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
