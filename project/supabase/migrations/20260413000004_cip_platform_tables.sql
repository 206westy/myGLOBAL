-- ============================================================
-- Migration 004: CIP Platform Tables
-- ============================================================

-- CIP 아이템 (핵심 테이블)
create table cip_items (
  id                uuid default gen_random_uuid() primary key,
  cip_no            text not null unique,

  stage             text not null default 'detected'
    check (stage in (
      'detected','registered','investigating','searching_solution',
      'developing_solution','lab_transferred','lab_responded',
      'testing','verifying','rolling_out','completed','cancelled'
    )),

  journey_type      text not null default 'A'
    check (journey_type in ('A', 'B')),

  severity          int check (severity between 1 and 10),
  occurrence        int check (occurrence between 1 and 10),
  detection         int check (detection between 1 and 10),
  action_priority   text check (action_priority in ('HIGH','MEDIUM','LOW')),

  anomaly_type      text,
  anomaly_score     numeric,
  anomaly_detail    jsonb,

  equip_no          text references equipment(equip_no),
  model_code        text,
  country_code      text,
  customer_line_code text,
  target_module     text,
  target_chamber    text,
  target_part_group text,
  target_part_no    text,

  title             text not null,
  description       text,
  symptom           text,
  root_cause        text,
  root_cause_method text,

  matched_ccb_id    uuid,
  ccb_match_score   numeric,

  solution_summary  text,
  solution_doc_url  text,

  lab_transfer_date date,
  lab_response_date date,
  lab_status        text check (lab_status in ('pending','in_progress','completed','rejected')),
  lab_milestone     jsonb,
  lab_sla_deadline  date,
  lab_notes         text,

  test_plan_id      uuid,
  test_status       text check (test_status in ('not_started','iq','oq','pq','marathon','completed','failed')),

  effectiveness     jsonb,

  cip_revenue       numeric,
  customer_savings  numeric,
  health_score_delta numeric,

  rollout_id        uuid,

  assigned_engineer text,
  assigned_manager  text,
  created_by        text,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  detected_at       timestamptz,
  registered_at     timestamptz,
  resolved_at       timestamptz
);


-- CIP 상태 전이 이력
create table cip_stage_history (
  id                uuid default gen_random_uuid() primary key,
  cip_id            uuid not null references cip_items(id) on delete cascade,
  from_stage        text,
  to_stage          text not null,
  changed_by        text,
  changed_at        timestamptz default now(),
  reason            text,
  metadata          jsonb
);


-- CIP 첨부파일
create table cip_attachments (
  id                uuid default gen_random_uuid() primary key,
  cip_id            uuid not null references cip_items(id) on delete cascade,
  file_name         text not null,
  file_url          text not null,
  file_type         text,
  file_size         bigint,
  stage_at_upload   text,
  uploaded_by       text,
  uploaded_at       timestamptz default now()
);


-- CIP 코멘트
create table cip_comments (
  id                uuid default gen_random_uuid() primary key,
  cip_id            uuid not null references cip_items(id) on delete cascade,
  comment_type      text default 'note'
    check (comment_type in ('note', 'system', 'lab', 'escalation')),
  content           text not null,
  created_by        text,
  created_at        timestamptz default now()
);


-- CIP 관련 서비스 오더 링크
create table cip_linked_orders (
  id                uuid default gen_random_uuid() primary key,
  cip_id            uuid not null references cip_items(id) on delete cascade,
  order_no          text not null references service_orders(order_no),
  link_type         text default 'evidence'
    check (link_type in ('evidence', 'related', 'rework', 'test_result')),
  linked_at         timestamptz default now(),
  linked_by         text
);


-- CCB 문서 (벡터 검색용)
create table ccb_documents (
  id                uuid default gen_random_uuid() primary key,
  ccb_no            text unique,
  title             text not null,
  content           text,
  summary           text,

  target_model      text[],
  target_module     text[],
  target_part_group text[],
  country_codes     text[],

  solution_type     text,
  action_plan       text,
  verified          boolean default false,
  verified_at       date,

  embedding         vector(1024),

  old_part_no       text,
  old_part_price    numeric,
  new_part_no       text,
  new_part_price    numeric,

  source            text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);


-- CIP 테스트 플랜
create table cip_test_plans (
  id                uuid default gen_random_uuid() primary key,
  cip_id            uuid not null references cip_items(id) on delete cascade,
  plan_type         text default 'iq_oq_pq'
    check (plan_type in ('iq_oq_pq', 'ab_test', 'marathon', 'custom')),

  checklist         jsonb,

  target_equip_no   text,
  control_equip_no  text,

  planned_start     date,
  planned_end       date,
  actual_start      date,
  actual_end        date,

  overall_result    text check (overall_result in ('pass', 'fail', 'conditional', 'in_progress')),
  result_data       jsonb,
  result_notes      text,

  assigned_to       text,
  created_at        timestamptz default now()
);


-- CIP 확산 관리
create table cip_rollouts (
  id                uuid default gen_random_uuid() primary key,
  cip_id            uuid not null references cip_items(id),
  ccb_id            uuid references ccb_documents(id),

  total_target      int default 0,
  completed         int default 0,

  tier              text check (tier in ('1_safety','2_yield','3_reliability','4_cost')),

  bkm_registered    boolean default false,
  bkm_no            text,
  ecn_no            text,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);


-- 개별 설비 확산 상태
create table cip_rollout_targets (
  id                uuid default gen_random_uuid() primary key,
  rollout_id        uuid not null references cip_rollouts(id) on delete cascade,
  equip_no          text not null references equipment(equip_no),

  status            text default 'pending'
    check (status in ('pending','scheduled','in_progress','completed','skipped','not_applicable')),
  priority_score    numeric,

  assigned_to       text,
  scheduled_date    date,
  completed_date    date,
  notes             text,

  created_at        timestamptz default now()
);
