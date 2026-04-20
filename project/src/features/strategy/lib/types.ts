'use client';

export type StrategyStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Effort = 'S' | 'M' | 'L' | 'XL';
export type StrategyView = 'discover' | 'kanban' | 'gantt';

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Owner {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  text: string;
}

export interface StrategyItem {
  id: string;
  title: string;
  description: string;
  status: StrategyStatus;
  priority: Priority;
  effort: Effort;
  owner: Owner;
  tags: string[];
  expectedImpact: string;
  impactScore: number;
  source: 'chat' | 'manual';
  createdAt: string;
  startedAt?: string;
  dueDate?: string;
  completedAt?: string;
  progress: number;
  subTasks: SubTask[];
  activity: ActivityEntry[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  expectedImpact: string;
  effort: Effort;
  impactScore: number;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Recommendation[];
  timestamp: string;
}

// ── CIP Platform Types ──

export type CipStage = 'detected' | 'registered' | 'investigating' | 'searching_solution' | 'developing_solution' | 'lab_transferred' | 'lab_responded' | 'testing' | 'verifying' | 'rolling_out' | 'completed' | 'cancelled';

export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type ScreeningStatus = 'watch' | 'alert' | 'resolved' | 'normal';

export type HintType = 'recurring_failure' | 'rework_pattern' | 'cascade_failure' | 'sop_missing' | 'design_defect' | 'long_work_time';

export type HintSeverity = 'high' | 'medium' | 'low';

export type InvestigationStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export type InvestigationConclusion = 'confirmed' | 'dismissed' | 'needs_more';

export type FieldConfirmed = 'confirmed' | 'not_confirmed' | 'intermittent';

export interface ScreeningResult {
  id: string;
  year_month: string;
  model_code: string;
  customer_line_code: string;
  part_group_code: string;
  status: ScreeningStatus;
  prev_status: ScreeningStatus | null;
  call_count: number;
  call_count_avg: number;
  call_count_std: number;
  cusum_value: number;
  cusum_ucl: number;
  trend_slope: number;
  trend_p_value: number;
  rework_rate: number;
  rework_rate_prev: number;
  avg_work_time: number;
  pareto_rank: number;
  is_new_pareto: boolean;
  watch_since: string | null;
  watch_reason: string | null;
  affected_equip_count: number;
  total_equip_count: number;
  created_at: string;
  hints?: ScreeningHint[];
}

export interface ScreeningHint {
  id: string;
  screening_result_id: string;
  hint_text: string;
  hint_count: number;
  source_order_nos: string[];
  created_at: string;
}

export interface DescriptionHint {
  id: string;
  order_no: string;
  hint_type: HintType;
  description: string;
  severity: HintSeverity;
  extracted_at: string;
}

export interface CipItem {
  id: string;
  cip_no: string;
  stage: CipStage;
  journey_type: 'A' | 'B';
  severity: number | null;
  occurrence: number | null;
  detection: number | null;
  action_priority: ActionPriority | null;
  anomaly_type: string | null;
  anomaly_score: number | null;
  anomaly_detail: Record<string, unknown> | null;
  equip_no: string | null;
  model_code: string | null;
  country_code: string | null;
  customer_line_code: string | null;
  target_module: string | null;
  target_chamber: string | null;
  target_part_group: string | null;
  target_part_no: string | null;
  title: string;
  description: string | null;
  symptom: string | null;
  root_cause: string | null;
  root_cause_method: string | null;
  solution_summary: string | null;
  assigned_engineer: string | null;
  assigned_manager: string | null;
  created_by: string | null;
  screening_result_id: string | null;
  investigation_status: InvestigationStatus | null;
  investigation_conclusion: InvestigationConclusion | null;
  five_why: Record<string, string>[] | null;
  fishbone: Record<string, unknown> | null;
  field_observation: string | null;
  field_confirmed: FieldConfirmed | null;
  report_content: Record<string, unknown> | null;
  investigation_completed_at: string | null;
  created_at: string;
  updated_at: string;
  detected_at: string | null;
  registered_at: string | null;
  resolved_at: string | null;
}

export interface MonthlyPartStat {
  model_code: string;
  customer_line_code: string;
  part_group_code: string;
  month: string;
  call_count: number;
  rework_count: number;
  rework_rate: number;
  avg_work_time_min: number;
  affected_equip_count: number;
}

export type CipStrategyView = 'screening' | 'kanban' | 'gantt';
