'use client';

import { useStrategyStore } from './use-strategy-store';
import { getRecommendations } from '../lib/mock-recommender';

export function useChatFlow() {
  const { sendUserMessage, appendAssistantMessage, setTyping } = useStrategyStore();

  function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    sendUserMessage(trimmed);
    setTyping(true);

    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const { reply, recommendations } = getRecommendations(trimmed);
      appendAssistantMessage(reply, recommendations);
      setTyping(false);
    }, delay);
  }

  return { send };
}
