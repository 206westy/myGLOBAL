/**
 * Solve tab 7-Q intake API.
 *
 * POST { action: 'next', cipId, sessionId? } → returns next question and session id
 * POST { action: 'answer', sessionId, answer } → records answer, returns next question or finalize signal
 * POST { action: 'finalize', sessionId } → produces final recommendation
 * POST { action: 'decide', sessionId, decision, reason } → records manager decision
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  generateNextIntakeQuestion,
  generateFinalRecommendation,
  type IntakeContext,
  type IntakeTurn,
} from '@/features/strategy/lib/intake-llm';

const MAX_TURNS = 7;

interface SessionRow {
  id: string;
  cip_item_id: string;
  conversation: IntakeTurn[];
  current_question_index: number;
  total_questions: number | null;
  final_recommendation: unknown;
  generated_by: string;
}

async function loadContext(
  supabase: ReturnType<typeof createServiceClient>,
  cipId: string,
): Promise<IntakeContext> {
  const { data: cip, error } = await supabase
    .from('cip_items')
    .select('cip_no, symptom, root_cause, model_code, customer_line_code, target_part_group')
    .eq('id', cipId)
    .single();
  if (error || !cip) throw error ?? new Error('cip not found');
  return {
    cipNo: cip.cip_no,
    symptom: cip.symptom,
    rootCause: cip.root_cause,
    modelCode: cip.model_code,
    customerLineCode: cip.customer_line_code,
    partGroup: cip.target_part_group,
  };
}

async function ensureSession(
  supabase: ReturnType<typeof createServiceClient>,
  cipId: string,
  sessionId?: string,
): Promise<SessionRow> {
  if (sessionId) {
    const { data } = await supabase
      .from('cip_solution_intake_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (data) return data as SessionRow;
  }

  const { data: existing } = await supabase
    .from('cip_solution_intake_sessions')
    .select('*')
    .eq('cip_item_id', cipId)
    .is('completed_at', null)
    .is('abandoned_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing as SessionRow;

  const { data: created, error } = await supabase
    .from('cip_solution_intake_sessions')
    .insert({ cip_item_id: cipId, conversation: [] })
    .select('*')
    .single();
  if (error || !created) throw error ?? new Error('failed to create session');
  return created as SessionRow;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? '');
    const supabase = createServiceClient();

    if (action === 'next' || action === 'answer') {
      const cipId = String(body.cipId ?? '');
      if (!cipId) return NextResponse.json({ error: 'cipId required' }, { status: 400 });

      const session = await ensureSession(
        supabase,
        cipId,
        body.sessionId ? String(body.sessionId) : undefined,
      );
      const ctx = await loadContext(supabase, cipId);
      let history = (session.conversation ?? []) as IntakeTurn[];

      if (action === 'answer') {
        const answer = String(body.answer ?? '');
        if (!answer) return NextResponse.json({ error: 'answer required' }, { status: 400 });
        if (history.length === 0) {
          return NextResponse.json(
            { error: 'no question to answer (call action=next first)' },
            { status: 400 },
          );
        }
        history = history.map((t, i) => (i === history.length - 1 ? { ...t, answer } : t));
      }

      // Stop generating new questions once we hit MAX_TURNS
      const reachedMax = history.filter((t) => t.answer).length >= MAX_TURNS;
      let nextQuestion: IntakeTurn | null = null;
      let generatedBy = session.generated_by;
      let readyToFinalize = reachedMax;

      if (!reachedMax) {
        const result = await generateNextIntakeQuestion(ctx, history);
        const q = result.question;
        nextQuestion = {
          q: q.q,
          q_type: q.q_type,
          choices: q.choices,
        };
        generatedBy = result.generatedBy;
        readyToFinalize = !!q.ready_to_finalize;
        history = [...history, nextQuestion];
      }

      const { data: updated, error: updErr } = await supabase
        .from('cip_solution_intake_sessions')
        .update({
          conversation: history,
          current_question_index: history.length,
          total_questions: MAX_TURNS,
          generated_by: generatedBy,
        })
        .eq('id', session.id)
        .select('*')
        .single();
      if (updErr) throw updErr;

      return NextResponse.json({
        sessionId: session.id,
        conversation: (updated?.conversation ?? history) as IntakeTurn[],
        nextQuestion,
        readyToFinalize,
        turnsRemaining: Math.max(0, MAX_TURNS - history.filter((t) => t.answer).length),
        generatedBy,
      });
    }

    if (action === 'finalize') {
      const sessionId = String(body.sessionId ?? '');
      if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

      const { data: session, error } = await supabase
        .from('cip_solution_intake_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error || !session) throw error ?? new Error('session not found');

      const ctx = await loadContext(supabase, session.cip_item_id);
      const history = (session.conversation ?? []) as IntakeTurn[];

      // Hybrid CCB candidate search: combine recent answers as a query
      const queryText = history
        .map((t) => `${t.q} ${t.answer ?? ''}`)
        .filter(Boolean)
        .join(' ');

      const { data: ccbCandidates } = await supabase.rpc('search_ccb_by_text', {
        p_query: queryText.slice(0, 500),
        p_target_model: ctx.modelCode,
        p_target_module: null,
        p_country_code: null,
        p_top_k: 10,
      });

      const candidatesShaped = ((ccbCandidates ?? []) as Array<{
        id: string;
        ccb_no: string;
        title: string;
        summary: string | null;
        similarity: number;
      }>).map((c) => ({
        id: c.id,
        ccb_no: c.ccb_no,
        title: c.title,
        summary: c.summary,
        similarity: Number(c.similarity ?? 0),
      }));

      const { recommendation, generatedBy } = await generateFinalRecommendation(
        ctx,
        history,
        candidatesShaped,
      );

      const { data: updated, error: updErr } = await supabase
        .from('cip_solution_intake_sessions')
        .update({
          final_recommendation: recommendation,
          completed_at: new Date().toISOString(),
          generated_by: generatedBy,
        })
        .eq('id', sessionId)
        .select('*')
        .single();
      if (updErr) throw updErr;

      return NextResponse.json({
        sessionId,
        finalRecommendation: updated?.final_recommendation,
        candidates: candidatesShaped,
        generatedBy,
      });
    }

    if (action === 'decide') {
      const sessionId = String(body.sessionId ?? '');
      const decision = String(body.decision ?? '');
      const reason = body.reason ? String(body.reason) : null;
      if (!sessionId || !decision) {
        return NextResponse.json({ error: 'sessionId and decision required' }, { status: 400 });
      }
      if (!['apply_existing', 'develop_new', 'partial', 'dismiss'].includes(decision)) {
        return NextResponse.json({ error: 'invalid decision' }, { status: 400 });
      }

      const { data: session, error } = await supabase
        .from('cip_solution_intake_sessions')
        .update({
          manager_decision: decision,
          manager_decision_reason: reason,
          decided_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select('cip_item_id')
        .single();
      if (error || !session) throw error ?? new Error('session not found');

      // Advance the CIP stage based on decision
      const stageMap: Record<string, string> = {
        apply_existing: 'rolling_out',
        develop_new: 'developing_solution',
        partial: 'rolling_out',
        dismiss: 'cancelled',
      };
      const newStage = stageMap[decision];
      if (newStage) {
        const { data: cipBefore } = await supabase
          .from('cip_items')
          .select('stage')
          .eq('id', session.cip_item_id)
          .single();
        await supabase
          .from('cip_items')
          .update({
            stage: newStage,
            ...(decision === 'apply_existing' ? { journey_type: 'B' } : {}),
          })
          .eq('id', session.cip_item_id);
        await supabase.from('cip_stage_history').insert({
          cip_id: session.cip_item_id,
          from_stage: cipBefore?.stage,
          to_stage: newStage,
          reason: `Solve intake decision: ${decision}${reason ? ` — ${reason}` : ''}`,
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[intake]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
