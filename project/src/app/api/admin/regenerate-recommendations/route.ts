import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { llmAvailable } from '@/lib/llm/client';
import { generateScreeningRecommendation } from '@/features/strategy/lib/screening-llm';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      yearMonth?: string;
      status?: 'alert' | 'watch';
      limit?: number;
    };
    const supabase = createServiceClient();

    let q = supabase
      .from('screening_results')
      .select('id, status, model_code, customer_line_code, part_group_code, call_count, call_count_avg, cusum_value, cusum_ucl, trend_slope, trend_p_value, rework_rate, affected_equip_count, total_equip_count');

    if (body.yearMonth) q = q.eq('year_month', body.yearMonth);
    if (body.status) q = q.eq('status', body.status);
    q = q.limit(body.limit ?? 100);

    const { data: rows, error } = await q;
    if (error) throw error;

    let processed = 0;
    let llmCalls = 0;
    let mockCalls = 0;

    for (const row of rows ?? []) {
      const { count: hintCount } = await supabase
        .from('screening_hints')
        .select('*', { count: 'exact', head: true })
        .eq('screening_result_id', row.id);

      const recommendation = await generateScreeningRecommendation({
        ...row,
        hint_count: hintCount ?? 0,
      });

      if (recommendation.generated_by === 'openai_gpt54mini') llmCalls++;
      else mockCalls++;

      await supabase
        .from('screening_results')
        .update({ ai_recommendation: recommendation })
        .eq('id', row.id);
      processed++;
    }

    return NextResponse.json({
      ok: true,
      processed,
      llmCalls,
      ruleCalls: mockCalls,
      llmAvailable: llmAvailable(),
      hint: llmAvailable()
        ? 'OpenAI was used for actual rewrites.'
        : 'OPENAI_API_KEY not set — fell back to rule_v1 for all rows. Set the env var and re-run for true LLM output.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[regenerate-recommendations]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
