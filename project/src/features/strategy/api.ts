'use client';

import { supabase } from '@/lib/supabase/client';
import type { ScreeningResult, CipItem, MonthlyPartStat, DescriptionHint } from './lib/types';
import type {
  ActionQueueRow,
  QueueCounts,
  WorkflowTabKey,
  DecisionAction,
  EvidencePoint,
  EvidenceStats,
  TimelineEntry,
  CardComment,
} from './lib/workflow-types';

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

// ── Action Queue (6-tab workflow) ──

const URGENCY_RANK: Record<string, number> = { URGENT: 0, NORMAL: 1, REFERENCE: 2 };

export async function fetchActionQueue(tab: WorkflowTabKey): Promise<ActionQueueRow[]> {
  const { data, error } = await supabase
    .from('v_action_queue')
    .select('*')
    .eq('tab', tab)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  // urgency_group sort done client-side (URGENT first)
  return ((data ?? []) as ActionQueueRow[]).sort(
    (a, b) => (URGENCY_RANK[a.urgency_group] ?? 9) - (URGENCY_RANK[b.urgency_group] ?? 9),
  );
}

export async function fetchQueueCounts(): Promise<QueueCounts[]> {
  const { data, error } = await supabase.from('v_action_queue_counts').select('*');
  if (error) throw error;
  return (data ?? []) as QueueCounts[];
}

export async function decideOnCard(action: DecisionAction): Promise<{ ok: true }> {
  switch (action.kind) {
    case 'create_cip': {
      const { data: sr, error: srErr } = await supabase
        .from('screening_results')
        .select('*')
        .eq('id', action.screeningId)
        .single();
      if (srErr || !sr) throw srErr ?? new Error('screening not found');

      const { error: insertErr } = await supabase.from('cip_items').insert({
        stage: 'registered',
        journey_type: 'A',
        screening_result_id: sr.id,
        model_code: sr.model_code,
        customer_line_code: sr.customer_line_code,
        target_part_group: sr.part_group_code,
        title: `${sr.model_code} / ${sr.part_group_code} anomaly`,
        symptom: action.reason ?? sr.watch_reason ?? null,
        action_priority: sr.status === 'alert' ? 'HIGH' : 'MEDIUM',
        anomaly_score: sr.cusum_value,
        anomaly_detail: { source: 'screening', screening_id: sr.id },
        registered_at: new Date().toISOString(),
      });
      if (insertErr) throw insertErr;
      return { ok: true };
    }

    case 'keep_watch': {
      const { error } = await supabase
        .from('screening_results')
        .update({ watch_reason: action.reason })
        .eq('id', action.screeningId);
      if (error) throw error;
      return { ok: true };
    }

    case 'dismiss_screening': {
      const { error } = await supabase
        .from('screening_results')
        .update({ status: 'resolved', watch_reason: `[dismissed] ${action.reason}` })
        .eq('id', action.screeningId);
      if (error) throw error;
      return { ok: true };
    }

    case 'advance_to_solve': {
      const item = await fetchCipItem(action.cipId);
      const { error: e1 } = await supabase
        .from('cip_items')
        .update({
          stage: 'searching_solution',
          investigation_completed_at: new Date().toISOString(),
        })
        .eq('id', action.cipId);
      if (e1) throw e1;
      await supabase.from('cip_stage_history').insert({
        cip_id: action.cipId,
        from_stage: item.stage,
        to_stage: 'searching_solution',
        reason: 'Advanced from Investigate tab',
      });
      return { ok: true };
    }

    case 'request_more_investigation': {
      const { error } = await supabase.from('cip_comments').insert({
        cip_id: action.cipId,
        comment_type: 'system',
        content: `[More investigation requested] ${action.reason}`,
      });
      if (error) throw error;
      return { ok: true };
    }

    case 'reject_investigation': {
      const item = await fetchCipItem(action.cipId);
      const { error: e1 } = await supabase
        .from('cip_items')
        .update({ stage: 'cancelled', resolved_at: new Date().toISOString() })
        .eq('id', action.cipId);
      if (e1) throw e1;
      await supabase.from('cip_stage_history').insert({
        cip_id: action.cipId,
        from_stage: item.stage,
        to_stage: 'cancelled',
        reason: `[Rejected at investigate] ${action.reason}`,
      });
      return { ok: true };
    }

    case 'advance_to_deploy': {
      const item = await fetchCipItem(action.cipId);
      const { error: e1 } = await supabase
        .from('cip_items')
        .update({ stage: 'rolling_out' })
        .eq('id', action.cipId);
      if (e1) throw e1;
      await supabase.from('cip_stage_history').insert({
        cip_id: action.cipId,
        from_stage: item.stage,
        to_stage: 'rolling_out',
        reason: 'Advanced from Validate tab',
      });
      return { ok: true };
    }

    case 'collect_more_data': {
      const { error } = await supabase.from('cip_comments').insert({
        cip_id: action.cipId,
        comment_type: 'system',
        content: `[More data collection requested] ${action.reason}`,
      });
      if (error) throw error;
      return { ok: true };
    }

    case 'partial_deploy': {
      const item = await fetchCipItem(action.cipId);
      const { error: e1 } = await supabase
        .from('cip_items')
        .update({ stage: 'rolling_out', journey_type: 'A' })
        .eq('id', action.cipId);
      if (e1) throw e1;
      await supabase.from('cip_stage_history').insert({
        cip_id: action.cipId,
        from_stage: item.stage,
        to_stage: 'rolling_out',
        reason: `[Partial deploy] ${action.reason}`,
      });
      return { ok: true };
    }
  }
}

// ── PRD v3.2 additions ──

export async function fetchEvidence12Month(
  modelCode: string,
  customerLineCode: string,
  partGroupCode: string,
): Promise<EvidencePoint[]> {
  const { data, error } = await supabase.rpc('get_evidence_12month', {
    p_model_code: modelCode,
    p_customer_line_code: customerLineCode,
    p_part_group_code: partGroupCode,
  });
  if (error) throw error;
  return ((data ?? []) as EvidencePoint[]).map((p) => ({
    ...p,
    call_count: Number(p.call_count),
    rework_count: Number(p.rework_count),
    cumulative_work_min: Number(p.cumulative_work_min),
  }));
}

export function deriveEvidenceStats(
  points: EvidencePoint[],
  meta: Record<string, unknown>,
): EvidenceStats {
  const callsArr = points.map((p) => p.call_count);
  const callsAvg = callsArr.length > 0
    ? callsArr.reduce((s, v) => s + v, 0) / callsArr.length
    : 0;
  const current = points.find((p) => p.is_current);
  const callsThisMonth = current?.call_count ?? 0;
  const callsChangePct = callsAvg > 0
    ? ((callsThisMonth - callsAvg) / callsAvg) * 100
    : 0;
  const cusumValue = (meta.cusum_value as number | null) ?? null;
  const cusumUcl = (meta.cusum_ucl as number | null) ?? null;
  const cusumMultiplier = cusumValue !== null && cusumUcl !== null && cusumUcl > 0
    ? cusumValue / cusumUcl
    : null;
  const affected = (meta.affected_equip_count as number | null) ?? null;
  const total = (meta.total_equip_count as number | null) ?? null;
  const affectedRatio = affected !== null && total !== null && total > 0
    ? (affected / total) * 100
    : null;
  const trendSlope = (meta.trend_slope as number | null) ?? null;
  const trendPValue = (meta.trend_p_value as number | null) ?? null;
  return {
    callsThisMonth,
    callsAvg,
    callsChangePct,
    cusumValue,
    cusumUcl,
    cusumMultiplier,
    affectedRatio,
    modelAvgAffectedRatio: null,
    trendSlope,
    trendPValue,
    trendIsSignificant: trendPValue !== null && trendPValue < 0.1,
  };
}

export async function fetchCipTimeline(cipId: string): Promise<TimelineEntry[]> {
  const { data, error } = await supabase.rpc('get_cip_timeline', { p_cip_id: cipId });
  if (error) throw error;
  return (data ?? []) as TimelineEntry[];
}

export async function fetchCipComments(cipId: string): Promise<CardComment[]> {
  const { data, error } = await supabase
    .from('cip_comments')
    .select('*')
    .eq('cip_id', cipId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CardComment[];
}

export async function addCipComment(
  cipId: string,
  content: string,
  commentType: string = 'note',
  createdBy: string | null = null,
): Promise<CardComment> {
  const { data, error } = await supabase
    .from('cip_comments')
    .insert({ cip_id: cipId, content, comment_type: commentType, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;
  return data as CardComment;
}
