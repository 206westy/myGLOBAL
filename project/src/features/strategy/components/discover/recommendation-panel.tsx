'use client';

import { Lightbulb } from 'lucide-react';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { RecommendationCard } from './recommendation-card';
import { type Recommendation, type ChatMessage } from '@/features/strategy/lib/types';

function getLatestRecommendations(
  chatMessages: ChatMessage[],
): Recommendation[] {
  const assistantMessages = chatMessages.filter(
    (m) => m.role === 'assistant' && m.recommendations && m.recommendations.length > 0,
  );
  if (assistantMessages.length === 0) return [];
  return assistantMessages[assistantMessages.length - 1].recommendations ?? [];
}

export function RecommendationPanel() {
  const chatMessages = useStrategyStore((s) => s.chatMessages);
  const shortlisted = useStrategyStore((s) => s.shortlisted);
  const { addToShortlist, removeFromShortlist } = useStrategyStore();

  const recommendations = getLatestRecommendations(chatMessages);

  return (
    <SectionCard title="추천 아이템">
      <ScrollArea className="h-[calc(100vh-28rem)] px-6 pb-6">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-[0.85rem] text-muted-foreground font-medium">
              아직 추천이 없어요
            </p>
            <p className="text-[0.75rem] text-muted-foreground/60">
              대화를 시작해 보세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {recommendations.map((rec) => {
              const isShortlisted = shortlisted.some((r) => r.id === rec.id);
              return (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  isShortlisted={isShortlisted}
                  onShortlist={() =>
                    isShortlisted
                      ? removeFromShortlist(rec.id)
                      : addToShortlist(rec)
                  }
                />
              );
            })}
          </div>
        )}
      </ScrollArea>
    </SectionCard>
  );
}
