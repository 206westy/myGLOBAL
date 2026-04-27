'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Send, Cog, Bot, User as UserIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCipTimeline, useAddCipComment } from '../../hooks/use-cip-queries';
import { toast } from '@/hooks/use-toast';
import type { ActionQueueRow, TimelineEntry } from '../../lib/workflow-types';

function actorIcon(kind: TimelineEntry['kind'], actor: string) {
  if (kind === 'system') return <Cog className="h-3.5 w-3.5 text-muted-foreground" />;
  if (actor === 'system' || kind === 'stage')
    return <Cog className="h-3.5 w-3.5 text-muted-foreground" />;
  if (actor.toLowerCase().includes('ai') || actor.toLowerCase().includes('llm'))
    return <Bot className="h-3.5 w-3.5 text-on-primary-fixed-variant" />;
  return <UserIcon className="h-3.5 w-3.5 text-foreground" />;
}

function actorLabel(kind: TimelineEntry['kind'], actor: string): string {
  if (kind === 'system' || actor === 'system') return 'System';
  return actor;
}

function describeEntry(entry: TimelineEntry): React.ReactNode {
  const p = entry.payload as Record<string, unknown>;
  if (entry.kind === 'stage') {
    return (
      <span className="text-sm">
        <span className="text-muted-foreground">Stage:</span>{' '}
        <code className="rounded bg-surface-container-low px-1.5 py-0.5 text-xs">
          {String(p.from_stage ?? '?')}
        </code>{' '}
        <ArrowRight className="inline h-3 w-3 text-muted-foreground" />{' '}
        <code className="rounded bg-surface-container-low px-1.5 py-0.5 text-xs">
          {String(p.to_stage ?? '?')}
        </code>
        {p.reason ? (
          <span className="ml-2 text-xs text-muted-foreground">— {String(p.reason)}</span>
        ) : null}
      </span>
    );
  }
  return <span className="whitespace-pre-wrap text-sm">{String(p.content ?? '')}</span>;
}

export function ActivityPanel({ row }: { row: ActionQueueRow }) {
  const isCip = row.card_id.startsWith('cip:');
  const cipId = isCip ? row.source_id : null;
  const { data: timeline, isLoading } = useCipTimeline(cipId ?? undefined);
  const addComment = useAddCipComment();
  const [draft, setDraft] = useState('');

  if (!isCip) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-xs text-muted-foreground">
          Created: {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm')}
        </p>
        <p className="text-xs text-muted-foreground">
          Comments and timeline are available once this screening is promoted to a CIP.
        </p>
      </div>
    );
  }

  async function submit() {
    if (!cipId || !draft.trim()) return;
    try {
      await addComment.mutateAsync({ cipId, content: draft.trim(), commentType: 'note' });
      setDraft('');
      toast({ title: 'Comment posted' });
    } catch (e) {
      toast({
        title: 'Post failed',
        description: (e as Error).message,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-outline-variant/30 bg-card p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment… (markdown / @mention coming in P2)"
          rows={2}
          className="text-sm"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={submit} disabled={addComment.isPending || !draft.trim()}>
            {addComment.isPending ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-2 h-3.5 w-3.5" />
            )}
            Post
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && (timeline ?? []).length === 0 && (
        <p className="text-xs text-muted-foreground">No activity yet.</p>
      )}
      {!isLoading && (timeline ?? []).length > 0 && (
        <ul className="space-y-2">
          {(timeline ?? []).map((entry, i) => (
            <li
              key={i}
              className={cn(
                'flex items-start gap-2 rounded-lg border border-outline-variant/30 bg-card p-3',
              )}
            >
              <div className="mt-0.5">{actorIcon(entry.kind, entry.actor)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium">{actorLabel(entry.kind, entry.actor)}</span>
                  <time className="text-muted-foreground">
                    {format(new Date(entry.ts), 'yyyy-MM-dd HH:mm')}
                  </time>
                </div>
                {describeEntry(entry)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
