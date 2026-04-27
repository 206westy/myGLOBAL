/**
 * 7-Q dynamic intake LLM helpers (Solve tab). Each turn:
 *  1) generateNextIntakeQuestion(context, conversation) → next question
 *  2) When done (≤ ~7 turns or LLM signals confidence), generateFinalRecommendation(...)
 *
 * Mock fallback gives a believable script when OPENAI_API_KEY is missing,
 * so the Solve tab can be demoed end-to-end without infra.
 */

import { callLlm, type LlmMessage } from '@/lib/llm/client';

export interface IntakeContext {
  cipNo: string;
  symptom: string | null;
  rootCause: string | null;
  modelCode: string | null;
  customerLineCode: string | null;
  partGroup: string | null;
  recentSoCount?: number;
}

export interface IntakeTurn {
  q: string;
  q_type: 'choice' | 'text';
  choices?: string[];
  answer?: string;
  ccb_candidates_after?: { id: string; ccb_no: string; title: string; score: number }[];
}

export interface IntakeQuestion {
  q: string;
  q_type: 'choice' | 'text';
  choices?: string[];
  /** When true, the model believes enough info is gathered. UI may finalize. */
  ready_to_finalize?: boolean;
  /** 0~1; how confident the model is in current top CCB candidate. */
  confidence?: number;
}

export interface IntakeFinalRecommendation {
  top_ccbs: Array<{ id?: string; ccb_no?: string; title: string; score: number; reason: string }>;
  new_solution_draft?: string;
  triz_analysis?: { contradiction: string; principles: string[] } | null;
  decision_hint: 'apply_existing' | 'develop_new' | 'partial';
  explanation: string;
}

const SYS_QUESTION = `You are a senior semiconductor CS engineer running an intake for a CIP solution discovery workflow.
You ask ONE concise diagnostic question at a time, like Ada Health does for medical triage.
Mix multiple-choice (preferred) with free text only when needed.
Stop after 5–7 turns when you have enough signal to recommend a CCB or draft a new solution.
Output strict JSON: {"q": string, "q_type": "choice"|"text", "choices"?: string[], "ready_to_finalize"?: boolean, "confidence"?: number}.`;

const SYS_FINAL = `You are a senior CS engineer summarizing a CIP intake session.
Output strict JSON matching this shape:
{"top_ccbs": [{"ccb_no"?: string, "title": string, "score": number, "reason": string}],
 "new_solution_draft"?: string,
 "triz_analysis"?: {"contradiction": string, "principles": string[]} | null,
 "decision_hint": "apply_existing"|"develop_new"|"partial",
 "explanation": string}`;

function contextBlock(ctx: IntakeContext, history: IntakeTurn[]): string {
  return [
    `CIP: ${ctx.cipNo}`,
    `Model: ${ctx.modelCode ?? 'unknown'} / Line: ${ctx.customerLineCode ?? 'unknown'} / Part group: ${ctx.partGroup ?? 'unknown'}`,
    `Symptom: ${ctx.symptom ?? '(not provided)'}`,
    `Initial root-cause hypothesis: ${ctx.rootCause ?? '(none yet)'}`,
    history.length > 0
      ? `\nConversation so far:\n${history
          .map((t, i) => `Q${i + 1}: ${t.q}\nA${i + 1}: ${t.answer ?? '(no answer)'}`)
          .join('\n\n')}`
      : '',
  ].join('\n');
}

const MOCK_QUESTIONS: IntakeQuestion[] = [
  {
    q: 'Where is the symptom most concentrated?',
    q_type: 'choice',
    choices: [
      'A specific chamber',
      'Entire line, intermittent',
      'Only when running a specific recipe',
      'No clear pattern yet',
    ],
    confidence: 0.2,
  },
  {
    q: 'When did the issue first appear, relative to the last PM or recipe change?',
    q_type: 'choice',
    choices: [
      'Right after PM',
      'Right after a recipe change',
      'Gradual increase over weeks',
      'Sudden, no recent change',
    ],
    confidence: 0.4,
  },
  {
    q: 'Which subsystem currently shows the strongest correlation in the data?',
    q_type: 'choice',
    choices: ['Source/RF', 'EFEM/Robotics', 'Vacuum/Foreline', 'Thermal/Heater', 'Software/SECS'],
    confidence: 0.6,
  },
  {
    q: 'Have you observed similar wear or failure modes on adjacent chambers?',
    q_type: 'choice',
    choices: ['Yes, multiple', 'Only on one adjacent', 'No', "Haven't checked"],
    confidence: 0.75,
  },
  {
    q: 'Briefly describe the most distinctive symptom in your own words.',
    q_type: 'text',
    confidence: 0.85,
    ready_to_finalize: true,
  },
];

function mockNextQuestion(turnIndex: number): IntakeQuestion {
  const q = MOCK_QUESTIONS[Math.min(turnIndex, MOCK_QUESTIONS.length - 1)];
  return q;
}

function mockFinal(ctx: IntakeContext): IntakeFinalRecommendation {
  return {
    top_ccbs: [
      {
        title: `[mock] Suggested CCB for ${ctx.partGroup ?? 'this part group'}`,
        score: 0.78,
        reason: 'Based on intake answers, this CCB matches the symptom pattern and target line.',
      },
      {
        title: '[mock] Alternative: torque-spec increase',
        score: 0.61,
        reason: 'Secondary option if the primary CCB does not apply.',
      },
    ],
    triz_analysis: {
      contradiction: 'Increase reliability without increasing service time',
      principles: ['Segmentation', 'Preliminary action', 'Cushioning in advance'],
    },
    decision_hint: 'apply_existing',
    explanation:
      '[mock] Replace with real OpenAI gpt-5.4-mini output once OPENAI_API_KEY is configured. The mock keeps Solve tab demoable end-to-end.',
  };
}

export async function generateNextIntakeQuestion(
  ctx: IntakeContext,
  history: IntakeTurn[],
): Promise<{ question: IntakeQuestion; generatedBy: 'mock' | 'openai_gpt54mini' }> {
  const messages: LlmMessage[] = [
    { role: 'system', content: SYS_QUESTION },
    { role: 'user', content: contextBlock(ctx, history) },
  ];

  const result = await callLlm<IntakeQuestion>(
    messages,
    { expectJson: true, temperature: 0.4, maxTokens: 400 },
    () => mockNextQuestion(history.length),
  );

  return { question: result.output, generatedBy: result.generatedBy };
}

export async function generateFinalRecommendation(
  ctx: IntakeContext,
  history: IntakeTurn[],
  candidateCcbs: Array<{ id: string; ccb_no: string; title: string; summary: string | null; similarity: number }>,
): Promise<{ recommendation: IntakeFinalRecommendation; generatedBy: 'mock' | 'openai_gpt54mini' }> {
  const messages: LlmMessage[] = [
    { role: 'system', content: SYS_FINAL },
    {
      role: 'user',
      content: [
        contextBlock(ctx, history),
        '\nTop CCB candidates from search (highest similarity first):',
        candidateCcbs.length > 0
          ? candidateCcbs
              .map(
                (c, i) =>
                  `${i + 1}. ${c.ccb_no} — ${c.title} (similarity ${c.similarity.toFixed(2)})\n   ${c.summary ?? ''}`,
              )
              .join('\n')
          : '(no CCB matches — recommend new solution development)',
      ].join('\n'),
    },
  ];

  const result = await callLlm<IntakeFinalRecommendation>(
    messages,
    { expectJson: true, temperature: 0.3, maxTokens: 1200 },
    () => mockFinal(ctx),
  );

  return { recommendation: result.output, generatedBy: result.generatedBy };
}
