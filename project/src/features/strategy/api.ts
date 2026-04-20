'use client';

import { supabase } from '@/lib/supabase/client';
import type { ScreeningResult, CipItem, MonthlyPartStat, DescriptionHint } from './lib/types';

// ── Screening ──

export async function fetchScreeningResults(yearMonth: string) {
  const { data, error } = await supabase
    .from('screening_results')
    .select('*, screening_hints(*)')
    .eq('year_month', yearMonth)
    .order('status', { ascending: true });
  if (error) throw error;
  return data as ScreeningResult[];
}

export async function fetchScreeningHistory(modelCode: string, customerLineCode: string, partGroupCode: string) {
  const { data, error } = await supabase
    .from('screening_results')
    .select('*')
    .eq('model_code', modelCode)
    .eq('customer_line_code', customerLineCode)
    .eq('part_group_code', partGroupCode)
    .order('year_month', { ascending: true });
  if (error) throw error;
  return data as ScreeningResult[];
}

// ── CIP Items ──

export async function fetchCipItems() {
  const { data, error } = await supabase
    .from('cip_items')
    .select('*')
    .not('stage', 'in', '("completed","cancelled")')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as CipItem[];
}

export async function fetchCipItem(id: string) {
  const { data, error } = await supabase
    .from('cip_items')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as CipItem;
}

export async function createCipItem(item: Partial<CipItem>) {
  const { data, error } = await supabase
    .from('cip_items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data as CipItem;
}

export async function updateCipItem(id: string, updates: Partial<CipItem>) {
  const { data, error } = await supabase
    .from('cip_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CipItem;
}

export async function updateCipStage(id: string, newStage: string, reason?: string) {
  const item = await fetchCipItem(id);

  const [updateResult, historyResult] = await Promise.all([
    supabase.from('cip_items').update({
      stage: newStage,
      updated_at: new Date().toISOString(),
    }).eq('id', id),
    supabase.from('cip_stage_history').insert({
      cip_id: id,
      from_stage: item.stage,
      to_stage: newStage,
      reason,
    }),
  ]);

  if (updateResult.error) throw updateResult.error;
  if (historyResult.error) throw historyResult.error;
}

// ── Monthly Part Stats (MV) ──

export async function fetchMonthlyPartStats(modelCode?: string, partGroupCode?: string) {
  let query = supabase.from('mv_monthly_part_stats').select('*');
  if (modelCode) query = query.eq('model_code', modelCode);
  if (partGroupCode) query = query.eq('part_group_code', partGroupCode);
  const { data, error } = await query.order('month', { ascending: true });
  if (error) throw error;
  return data as MonthlyPartStat[];
}

// ── Lookup Tables (code → name) ──

export interface LookupMap {
  models: Record<string, string>;
  partGroups: Record<string, string>;
  customerLines: Record<string, string>;
}

export async function fetchLookupMaps(): Promise<LookupMap> {
  const [modelsRes, pgRes, clRes] = await Promise.all([
    supabase.from('lu_models').select('code, name'),
    supabase.from('lu_part_groups').select('code, name'),
    supabase.from('lu_customer_lines').select('code, name'),
  ]);

  const toMap = (data: { code: string; name: string }[] | null) =>
    (data ?? []).reduce((m, r) => { m[r.code] = r.name; return m; }, {} as Record<string, string>);

  return {
    models: toMap(modelsRes.data),
    partGroups: toMap(pgRes.data),
    customerLines: toMap(clRes.data),
  };
}

// ── Description Hints ──

export async function fetchDescriptionHints(orderNos: string[]) {
  const { data, error } = await supabase
    .from('so_description_hints')
    .select('*')
    .in('order_no', orderNos);
  if (error) throw error;
  return data as DescriptionHint[];
}
