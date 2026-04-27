"use client";

export type WorkflowTabKey =
  | "detect"
  | "investigate"
  | "solve"
  | "develop"
  | "validate"
  | "deploy";

export type UrgencyGroup = "URGENT" | "NORMAL" | "REFERENCE";

export type CardPriority = "HIGH" | "MEDIUM" | "LOW";

export type StepKey =
  | "STEP_00" | "STEP_01" | "STEP_02" | "STEP_03" | "STEP_04" | "STEP_05"
  | "STEP_06" | "STEP_07" | "STEP_08" | "STEP_09" | "STEP_10";

export interface AiRecommendation {
  recommended_action: string;
  reason: string;
  confidence: number;
  generated_by: "rule_v1" | "openai_gpt54mini" | string;
  generated_at: string;
}

export interface ActionQueueRow {
  card_id: string;
  tab: WorkflowTabKey;
  step: StepKey;
  priority: CardPriority;
  urgency_group: UrgencyGroup;
  cip_no: string | null;
  source_id: string;
  title: string;
  context_line: string;
  ai_recommendation: AiRecommendation | null;
  created_at: string;
  sla_deadline: string | null;
  meta: Record<string, unknown>;
}

export interface QueueCounts {
  tab: WorkflowTabKey;
  urgent_count: number;
  normal_count: number;
  reference_count: number;
  total_count: number;
  has_urgent: boolean;
}

export type DecisionAction =
  // Detect
  | { kind: "create_cip"; screeningId: string; reason?: string }
  | { kind: "keep_watch"; screeningId: string; reason: string }
  | { kind: "dismiss_screening"; screeningId: string; reason: string }
  // Investigate
  | { kind: "advance_to_solve"; cipId: string }
  | { kind: "request_more_investigation"; cipId: string; reason: string }
  | { kind: "reject_investigation"; cipId: string; reason: string }
  // Validate
  | { kind: "advance_to_deploy"; cipId: string }
  | { kind: "collect_more_data"; cipId: string; reason: string }
  | { kind: "partial_deploy"; cipId: string; reason: string };

export interface DecisionOption {
  label: string;
  action: DecisionAction;
  isPrimary?: boolean;
  variant?: "default" | "outline" | "destructive";
}

export const WORKFLOW_TABS: Array<{
  key: WorkflowTabKey;
  label: string;
  steps: string;
}> = [
  { key: "detect",      label: "Detect",      steps: "01+02" },
  { key: "investigate", label: "Investigate", steps: "03"    },
  { key: "solve",       label: "Solve",       steps: "04+05" },
  { key: "develop",     label: "Develop",     steps: "06+07" },
  { key: "validate",    label: "Validate",    steps: "08+09" },
  { key: "deploy",      label: "Deploy",      steps: "10+JB" },
];

// ── PRD v3.2 additions ──

export interface EvidencePoint {
  year_month: string;
  call_count: number;
  rework_count: number;
  cumulative_work_min: number;
  is_current: boolean;
}

export interface EvidenceStats {
  callsThisMonth: number;
  callsAvg: number;
  callsChangePct: number;
  cusumValue: number | null;
  cusumUcl: number | null;
  cusumMultiplier: number | null;
  affectedRatio: number | null;
  modelAvgAffectedRatio: number | null;
  trendSlope: number | null;
  trendPValue: number | null;
  trendIsSignificant: boolean;
}

export interface TimelineEntry {
  ts: string;
  kind: 'stage' | 'comment' | 'system';
  actor: string;
  payload: Record<string, unknown>;
}

export interface CardComment {
  id: string;
  cip_id: string;
  comment_type: string;
  content: string;
  created_by: string | null;
  created_at: string;
}
