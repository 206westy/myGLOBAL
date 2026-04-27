-- 20260427000005_solution_intake_sessions.sql
-- P1-B foundation: 7-Q dynamic intake conversation log for Solve tab.

create table if not exists cip_solution_intake_sessions (
  id uuid primary key default gen_random_uuid(),
  cip_item_id uuid not null references cip_items(id) on delete cascade,

  -- Lifecycle
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz,

  -- Conversation state
  current_question_index int not null default 0,
  total_questions int,                                -- estimated upper bound (5~10)
  conversation jsonb not null default '[]'::jsonb,    -- [{q, q_type:'choice|text', choices?, answer, ccb_candidates_after?}]

  -- Final output (populated when completed)
  final_recommendation jsonb,                         -- {top_ccbs:[...], new_solution_draft:..., triz_analysis:...}

  -- Manager decision (after viewing final_recommendation)
  manager_decision text check (manager_decision in ('apply_existing','develop_new','partial','dismiss')),
  manager_decision_reason text,
  decided_at timestamptz,
  decided_by text references users(id),

  -- Metadata
  created_by text references users(id),
  generated_by text not null default 'mock',           -- 'mock' | 'openai_gpt54mini' | ...
  total_input_tokens int,
  total_output_tokens int,

  updated_at timestamptz not null default now()
);

create index if not exists idx_intake_cip on cip_solution_intake_sessions(cip_item_id);
create index if not exists idx_intake_active on cip_solution_intake_sessions(cip_item_id)
  where completed_at is null and abandoned_at is null;

drop trigger if exists trg_intake_updated on cip_solution_intake_sessions;
create trigger trg_intake_updated
  before update on cip_solution_intake_sessions
  for each row execute function update_updated_at();

comment on table cip_solution_intake_sessions is
  '7-Q dynamic intake sessions for Solve tab. Ada/Buoy Health-style adaptive questionnaire that funnels CCB candidates and produces a final recommendation.';
comment on column cip_solution_intake_sessions.conversation is
  'Array of {q, q_type:choice|text, choices, answer, ccb_candidates_after}. Append-only.';
comment on column cip_solution_intake_sessions.final_recommendation is
  '{top_ccbs:[{id,score,reason}], new_solution_draft?:string, triz_analysis?:object}';
