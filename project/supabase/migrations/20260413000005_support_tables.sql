-- ============================================================
-- Migration 005: Support Tables
-- ============================================================

-- 사용자
create table users (
  id                text primary key,
  name              text not null,
  email             text,
  role              text not null
    check (role in ('engineer', 'manager', 'admin')),
  country_code      text,
  work_center_code  text,
  is_active         boolean default true,
  created_at        timestamptz default now()
);

-- CSV 임포트 이력
create table import_logs (
  id                uuid default gen_random_uuid() primary key,
  tcode             text not null,
  file_name         text,
  row_count         int,
  success_count     int,
  error_count       int,
  errors            jsonb,
  status            text default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  imported_by       text,
  started_at        timestamptz default now(),
  completed_at      timestamptz
);

-- 알림
create table notifications (
  id                uuid default gen_random_uuid() primary key,
  user_id           text not null,
  type              text not null
    check (type in (
      'anomaly_detected','cip_assigned','stage_changed',
      'sla_warning','sla_breach','lab_response',
      'test_result','rollout_assigned','comment_added','escalation'
    )),
  title             text not null,
  body              text,
  cip_id            uuid references cip_items(id),
  link_url          text,
  is_read           boolean default false,
  created_at        timestamptz default now()
);

-- SLA 정의
create table sla_definitions (
  id                uuid default gen_random_uuid() primary key,
  name              text not null,
  stage             text not null,
  priority_code     text,
  target_hours      int not null,
  warning_pct       int default 75,
  critical_pct      int default 90,
  is_active         boolean default true
);
