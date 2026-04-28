import { callLlm, type LlmMessage } from '@/lib/llm/client';
import type { AiRecommendation } from './workflow-types';

interface ScreeningInputForLlm {
  id: string;
  status: string;
  model_code: string | null;
  customer_line_code: string | null;
  part_group_code: string | null;
  call_count: number | null;
  call_count_avg: number | null;
  cusum_value: number | null;
  cusum_ucl: number | null;
  trend_slope: number | null;
  trend_p_value: number | null;
  rework_rate: number | null;
  affected_equip_count: number | null;
  total_equip_count: number | null;
  hint_count: number;
}

const SYS_PROMPT = `You are a senior semiconductor CS analyst.
Given screening metrics for a (model × line × part_group) combo, decide one of:
- "create_cip": warrants opening a CIP item now
- "keep_watch": keep monitoring (significant signal but not yet CIP-worthy)
- "dismiss": no action needed (likely noise)

Return strict JSON: {"recommended_action": "create_cip"|"keep_watch"|"dismiss",
                     "reason": "single line, <120 chars, cite the strongest signal",
                     "confidence": 0.0-1.0}`;

function fallbackRule(input: ScreeningInputForLlm): AiRecommendation {
  const affectedRatio =
    input.total_equip_count && input.total_equip_count > 0
      ? Math.round((100 * (input.affected_equip_count ?? 0)) / input.total_equip_count)
      : 0;
  const reasons: string[] = [];
  let action: 'create_cip' | 'keep_watch' | 'dismiss' = 'dismiss';
  if (input.cusum_value != null && input.cusum_ucl != null && input.cusum_value > input.cusum_ucl) {
    reasons.push(`CUSUM exceeded UCL (${input.cusum_value.toFixed(1)} / limit ${input.cusum_ucl.toFixed(1)})`);
    action = 'create_cip';
  }
  if (affectedRatio >= 30) {
    reasons.push(`${affectedRatio}% equipment affected`);
    action = action === 'dismiss' ? 'create_cip' : action;
  }
  if (input.hint_count > 0) {
    reasons.push(`${input.hint_count} qualitative hint${input.hint_count > 1 ? 's' : ''}`);
  }
  if (reasons.length === 0) {
    if (input.status === 'watch') action = 'keep_watch';
  }
  return {
    recommended_action: action,
    reason: reasons.length > 0 ? reasons.join(', ') : 'Insufficient data',
    confidence: Math.min(1, 0.3 + reasons.length * 0.2),
    generated_by: 'rule_v1',
    generated_at: new Date().toISOString(),
  };
}

export async function generateScreeningRecommendation(
  input: ScreeningInputForLlm,
): Promise<AiRecommendation> {
  const messages: LlmMessage[] = [
    { role: 'system', content: SYS_PROMPT },
    {
      role: 'user',
      content: JSON.stringify(input),
    },
  ];

  const result = await callLlm<{
    recommended_action: string;
    reason: string;
    confidence: number;
  }>(messages, { expectJson: true, temperature: 0.2, maxTokens: 200 }, () => ({
    recommended_action: fallbackRule(input).recommended_action,
    reason: fallbackRule(input).reason,
    confidence: fallbackRule(input).confidence,
  }));

  return {
    recommended_action: result.output.recommended_action,
    reason: result.output.reason,
    confidence: result.output.confidence,
    generated_by: result.generatedBy,
    generated_at: new Date().toISOString(),
  };
}
