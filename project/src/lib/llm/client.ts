/**
 * LLM client wrapper. Centralizes OpenAI gpt-5.4-mini calls and falls back
 * to deterministic mock responses when OPENAI_API_KEY is not configured —
 * so the rest of the app can build & run without keys, and feature work can
 * proceed even before infra is ready.
 */

import OpenAI from 'openai';

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
const REASONING_EFFORT = (process.env.OPENAI_REASONING_EFFORT ?? 'medium') as
  | 'low'
  | 'medium'
  | 'high';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCallOptions {
  /** When true, return JSON parsed from the model output. */
  expectJson?: boolean;
  /** Override default temperature. */
  temperature?: number;
  /** Cap output tokens. */
  maxTokens?: number;
}

export interface LlmCallResult<T = string> {
  output: T;
  generatedBy: 'openai_gpt54mini' | 'mock';
  inputTokens?: number;
  outputTokens?: number;
}

export function llmAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

let _client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!llmAvailable()) return null;
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function callLlm<T = string>(
  messages: LlmMessage[],
  options: LlmCallOptions = {},
  mockFallback?: () => T,
): Promise<LlmCallResult<T>> {
  const client = getClient();

  if (!client) {
    if (!mockFallback) {
      throw new Error(
        'OPENAI_API_KEY not configured and no mockFallback provided. ' +
          'Either set the env var or pass a mockFallback to callLlm().',
      );
    }
    return { output: mockFallback(), generatedBy: 'mock' };
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 800,
    ...(options.expectJson ? { response_format: { type: 'json_object' } } : {}),
    // Reasoning models accept this field; non-reasoning models ignore unknown fields silently
    // via the SDK's loose typing on extras.
    ...({ reasoning_effort: REASONING_EFFORT } as Record<string, unknown>),
  });

  const raw = response.choices[0]?.message?.content ?? '';
  const output = options.expectJson ? (JSON.parse(raw) as T) : (raw as unknown as T);

  return {
    output,
    generatedBy: 'openai_gpt54mini',
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
  };
}
