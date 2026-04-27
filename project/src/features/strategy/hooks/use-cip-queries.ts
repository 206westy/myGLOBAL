'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchScreeningResults,
  fetchScreeningHistory,
  fetchCipItems,
  fetchCipItem,
  createCipItem,
  updateCipItem,
  updateCipStage,
  fetchMonthlyPartStats,
  fetchLookupMaps,
  fetchActionQueue,
  fetchQueueCounts,
  decideOnCard,
  fetchEvidence12Month,
  fetchCipTimeline,
  fetchCipComments,
  addCipComment,
  type LookupMap,
} from '../api';
import type { CipItem } from '../lib/types';
import type { WorkflowTabKey, DecisionAction } from '../lib/workflow-types';

export function useScreeningResults(yearMonth: string) {
  return useQuery({
    queryKey: ['screening', yearMonth],
    queryFn: () => fetchScreeningResults(yearMonth),
    enabled: !!yearMonth,
  });
}

export function useScreeningHistory(modelCode: string, customerLineCode: string, partGroupCode: string) {
  return useQuery({
    queryKey: ['screening-history', modelCode, customerLineCode, partGroupCode],
    queryFn: () => fetchScreeningHistory(modelCode, customerLineCode, partGroupCode),
    enabled: !!(modelCode && customerLineCode && partGroupCode),
  });
}

export function useCipItems() {
  return useQuery({
    queryKey: ['cip-items'],
    queryFn: fetchCipItems,
  });
}

export function useCipItem(id: string) {
  return useQuery({
    queryKey: ['cip-item', id],
    queryFn: () => fetchCipItem(id),
    enabled: !!id,
  });
}

export function useCreateCipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<CipItem>) => createCipItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cip-items'] });
    },
  });
}

export function useUpdateCipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CipItem> }) =>
      updateCipItem(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cip-items'] });
      queryClient.invalidateQueries({ queryKey: ['cip-item', id] });
    },
  });
}

export function useUpdateCipStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, reason }: { id: string; stage: string; reason?: string }) =>
      updateCipStage(id, stage, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cip-items'] });
    },
  });
}

export function useLookupMaps() {
  return useQuery({
    queryKey: ['lookup-maps'],
    queryFn: fetchLookupMaps,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMonthlyPartStats(modelCode?: string, partGroupCode?: string) {
  return useQuery({
    queryKey: ['monthly-part-stats', modelCode, partGroupCode],
    queryFn: () => fetchMonthlyPartStats(modelCode, partGroupCode),
  });
}

// ── Action Queue (6-tab workflow) ──

export function useActionQueue(tab: WorkflowTabKey) {
  return useQuery({
    queryKey: ['action-queue', tab],
    queryFn: () => fetchActionQueue(tab),
    staleTime: 30_000,
  });
}

export function useQueueCounts() {
  return useQuery({
    queryKey: ['action-queue-counts'],
    queryFn: fetchQueueCounts,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useDecideOnCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: DecisionAction) => decideOnCard(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-queue'] });
      queryClient.invalidateQueries({ queryKey: ['action-queue-counts'] });
      queryClient.invalidateQueries({ queryKey: ['cip-items'] });
      queryClient.invalidateQueries({ queryKey: ['screening'] });
    },
  });
}

// ── PRD v3.2 additions ──

export function useEvidence12Month(modelCode?: string, customerLineCode?: string, partGroupCode?: string) {
  return useQuery({
    queryKey: ['evidence-12m', modelCode, customerLineCode, partGroupCode],
    queryFn: () => fetchEvidence12Month(modelCode!, customerLineCode!, partGroupCode!),
    enabled: !!(modelCode && customerLineCode && partGroupCode),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCipTimeline(cipId?: string) {
  return useQuery({
    queryKey: ['cip-timeline', cipId],
    queryFn: () => fetchCipTimeline(cipId!),
    enabled: !!cipId,
    staleTime: 30_000,
  });
}

export function useCipComments(cipId?: string) {
  return useQuery({
    queryKey: ['cip-comments', cipId],
    queryFn: () => fetchCipComments(cipId!),
    enabled: !!cipId,
    staleTime: 30_000,
  });
}

export function useAddCipComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cipId, content, commentType, createdBy }: {
      cipId: string;
      content: string;
      commentType?: string;
      createdBy?: string | null;
    }) => addCipComment(cipId, content, commentType ?? 'note', createdBy ?? null),
    onSuccess: (_, { cipId }) => {
      queryClient.invalidateQueries({ queryKey: ['cip-comments', cipId] });
      queryClient.invalidateQueries({ queryKey: ['cip-timeline', cipId] });
    },
  });
}
