'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type StrategyItem, type ChatMessage, type Recommendation } from '../lib/types';
import { INITIAL_ITEMS, SEED_CHAT_MESSAGES } from '../constants/strategy-data';
import { newId } from '../lib/id';

interface StrategyStore {
  items: StrategyItem[];
  chatMessages: ChatMessage[];
  shortlisted: Recommendation[];
  selectedItemId: string | null;
  isTyping: boolean;

  // Item CRUD
  addItem: (item: StrategyItem) => void;
  updateItem: (id: string, patch: Partial<StrategyItem>) => void;
  deleteItem: (id: string) => void;
  moveItem: (id: string, newStatus: StrategyItem['status']) => void;

  // Chat
  sendUserMessage: (content: string) => void;
  appendAssistantMessage: (content: string, recommendations?: Recommendation[]) => void;
  setTyping: (v: boolean) => void;

  // Shortlist
  addToShortlist: (rec: Recommendation) => void;
  removeFromShortlist: (id: string) => void;
  clearShortlist: () => void;

  // Detail sheet
  setSelectedItem: (id: string | null) => void;
}

export const useStrategyStore = create<StrategyStore>()(
  persist(
    (set) => ({
      items: INITIAL_ITEMS,
      chatMessages: SEED_CHAT_MESSAGES,
      shortlisted: [],
      selectedItemId: null,
      isTyping: false,

      addItem: (item) => set((s) => ({ items: [item, ...s.items] })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),

      deleteItem: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

      moveItem: (id, newStatus) => {
        const now = new Date().toISOString().slice(0, 10);
        set((s) => ({
          items: s.items.map((it) => {
            if (it.id !== id) return it;
            const updates: Partial<StrategyItem> = { status: newStatus };
            if (newStatus === 'done') {
              updates.completedAt = now;
              updates.progress = 100;
            }
            return { ...it, ...updates };
          }),
        }));
      },

      sendUserMessage: (content) =>
        set((s) => ({
          chatMessages: [
            ...s.chatMessages,
            { id: newId(), role: 'user', content, timestamp: new Date().toISOString() },
          ],
        })),

      appendAssistantMessage: (content, recommendations) =>
        set((s) => ({
          chatMessages: [
            ...s.chatMessages,
            { id: newId(), role: 'assistant', content, recommendations, timestamp: new Date().toISOString() },
          ],
        })),

      setTyping: (v) => set({ isTyping: v }),

      addToShortlist: (rec) =>
        set((s) => {
          if (s.shortlisted.some((r) => r.id === rec.id)) return s;
          return { shortlisted: [...s.shortlisted, rec] };
        }),

      removeFromShortlist: (id) =>
        set((s) => ({ shortlisted: s.shortlisted.filter((r) => r.id !== id) })),

      clearShortlist: () => set({ shortlisted: [] }),

      setSelectedItem: (id) => set({ selectedItemId: id }),
    }),
    {
      name: 'strategy-store',
      partialize: (s) => ({
        items: s.items,
        chatMessages: s.chatMessages,
        shortlisted: s.shortlisted,
      }),
    }
  )
);
