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
  type LookupMap,
} from '../api';
import type { CipItem } from '../lib/types';

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
