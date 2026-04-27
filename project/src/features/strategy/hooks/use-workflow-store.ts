'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkflowTabKey } from '../lib/workflow-types';

interface WorkflowStore {
  activeTab: WorkflowTabKey;
  expandedCardIds: string[];                    // serialized as array (Set is not JSON-friendly)
  expandedTabIndex: Record<string, number>;     // card_id → 0~3 (Evidence/Context/Impact/Activity)
  setActiveTab: (tab: WorkflowTabKey) => void;
  toggleExpand: (cardId: string) => void;
  collapseAll: () => void;
  setExpandedTabIndex: (cardId: string, idx: number) => void;
  isExpanded: (cardId: string) => boolean;
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      activeTab: 'detect',
      expandedCardIds: [],
      expandedTabIndex: {},
      setActiveTab: (tab) => set({ activeTab: tab, expandedCardIds: [] }),
      toggleExpand: (cardId) => set((s) => {
        const exists = s.expandedCardIds.includes(cardId);
        return {
          expandedCardIds: exists
            ? s.expandedCardIds.filter((id) => id !== cardId)
            : [...s.expandedCardIds, cardId],
        };
      }),
      collapseAll: () => set({ expandedCardIds: [] }),
      setExpandedTabIndex: (cardId, idx) => set((s) => ({
        expandedTabIndex: { ...s.expandedTabIndex, [cardId]: idx },
      })),
      isExpanded: (cardId) => get().expandedCardIds.includes(cardId),
    }),
    {
      name: 'workflow-store',
      partialize: (s) => ({ activeTab: s.activeTab }),  // expanded state resets per session
    }
  )
);
