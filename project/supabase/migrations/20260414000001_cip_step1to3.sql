-- ============================================================
-- Migration: CIP Step 1~3 관계형 스키마 확장
-- 이상감지(Screening) → 이슈기록(CIP) → 현장조사(Investigation)
-- ============================================================


-- ────────────────────────────────────────
-- 1. lu_part_groups: 파트 그룹 룩업 테이블
--    service_orders.title_sort 끝 2자리와 매핑
-- ────────────────────────────────────────
create table if not exists lu_part_groups (
  code    text primary key,
  name    text not null
);

insert into lu_part_groups (code, name) values
  ('00','CIP'),
  ('01','CONTROLLER'),
  ('02','LOADPORT'),
  ('03','ROBOT'),
  ('04','BM MODULE'),
  ('05','SOURCE'),
  ('06','SOFTWARE'),
  ('07','VALVE'),
  ('08','PROCESS KIT'),
  ('09','CHUCK'),
  ('10','BOARD'),
  ('11','MOTOR'),
  ('12','EPD'),
  ('13','IGS BLOCK'),
  ('14','HEATER'),
  ('15','RF'),
  ('16','O2 ANALYZER'),
  ('17','DISC'),
  ('18','VAPORIZER'),
  ('99','ETC')
on conflict (code) do nothing;


-- ────────────────────────────────────────
-- 2. service_orders: part_group_code 파생 컬럼
--    title_sort 끝 2자리에서 파트그룹 코드 자동 추출
--    (GENERATED 컬럼은 PG에서 FK 불가 → 앱 레벨 검증)
-- ────────────────────────────────────────
alter table service_orders
  add column if not exists part_group_code text
    generated always as (right(title_sort, 2)) stored;

create index if not exists idx_so_part_group
  on service_orders(part_group_code);


-- ────────────────────────────────────────
-- 3. screening_results: 월간 이상감지 스크리닝 결과
--
--    관계:
--    - part_group_code → lu_part_groups(code): 파트그룹 참조 무결성
--    - (model_code, customer_line_code): FK 없음 — SAP 데이터에
--      lu_models/lu_customer_lines 미등록 코드가 존재할 수 있음
--      (service_orders와 동일한 설계 철학)
-- ────────────────────────────────────────
create table if not exists screening_results (
  id                    uuid default gen_random_uuid() primary key,

  -- 집계 키 (모델 × 고객사라인 × 파트그룹 × 월)
  year_month            text not null,
  model_code            text not null,
  customer_line_code    text not null,
  part_group_code       text not null
    references lu_part_groups(code),

  -- 판정 상태
  status                text not null
    check (status in ('watch', 'alert', 'resolved', 'normal')),
  prev_status           text
    check (prev_status is null or prev_status in ('watch', 'alert', 'resolved', 'normal')),

  -- 정량 지표
  call_count            int,
  call_count_avg        numeric,
  call_count_std        numeric,
  cusum_value           numeric,
  cusum_ucl             numeric,
  trend_slope           numeric,
  trend_p_value         numeric,
  rework_rate           numeric,
  rework_rate_prev      numeric,
  avg_work_time         numeric,

  -- 파레토 분석
  pareto_rank           int,
  is_new_pareto         boolean default false,

  -- Watch 추적
  watch_since           text,
  watch_reason          text,
  affected_equip_count  int,
  total_equip_count     int,

  created_at            timestamptz default now(),

  -- 복합 유니크: 동일 조합/월에 중복 스크리닝 방지
  unique(year_month, model_code, customer_line_code, part_group_code)
);

create index if not exists idx_sr_year_month on screening_results(year_month);
create index if not exists idx_sr_status on screening_results(status);
create index if not exists idx_sr_model_part on screening_results(model_code, part_group_code);


-- ────────────────────────────────────────
-- 4. screening_hints: 스크리닝 ↔ 힌트 연결 (정규화)
--    기존 설계: screening_results.hints JSONB (비정규)
--    개선: 별도 테이블로 분리하여 쿼리·집계 가능하게
-- ────────────────────────────────────────
create table if not exists screening_hints (
  id                    uuid default gen_random_uuid() primary key,
  screening_result_id   uuid not null
    references screening_results(id) on delete cascade,
  hint_text             text not null,
  hint_count            int default 1,
  source_order_nos      text[],
  created_at            timestamptz default now()
);

create index if not exists idx_sh_screening on screening_hints(screening_result_id);


-- ────────────────────────────────────────
-- 5. so_descriptions: S/O 디스크립션 캐시
--    1:1 관계 (service_orders.order_no)
-- ────────────────────────────────────────
create table if not exists so_descriptions (
  order_no    text primary key
    references service_orders(order_no) on delete cascade,
  description text not null,
  fetched_at  timestamptz default now()
);


-- ────────────────────────────────────────
-- 6. so_description_hints: S/O 디스크립션 AI 힌트 추출
--    N:1 관계 (하나의 S/O에서 여러 힌트 추출 가능)
-- ────────────────────────────────────────
create table if not exists so_description_hints (
  id              uuid default gen_random_uuid() primary key,
  order_no        text not null
    references service_orders(order_no) on delete cascade,
  hint_type       text not null
    check (hint_type in (
      'recurring_failure', 'rework_pattern', 'cascade_failure',
      'sop_missing', 'design_defect', 'long_work_time'
    )),
  description     text not null,
  severity        text not null default 'medium'
    check (severity in ('high', 'medium', 'low')),
  extracted_at    timestamptz default now()
);

create index if not exists idx_sdh_order_no on so_description_hints(order_no);
create index if not exists idx_sdh_hint_type on so_description_hints(hint_type);


-- ────────────────────────────────────────
-- 7. cip_items 관계 보강
--    기존 테이블에 누락된 FK 추가 + 스크리닝 연결
-- ────────────────────────────────────────

-- 7a. 스크리닝 → CIP 연결: 어떤 스크리닝에서 이 CIP가 생성되었는지
alter table cip_items
  add column if not exists screening_result_id uuid
    references screening_results(id) on delete set null;

create index if not exists idx_cip_screening on cip_items(screening_result_id);

-- 7b. target_part_group → lu_part_groups FK 추가
-- (cip_items 0건이므로 안전)
alter table cip_items
  add constraint cip_items_target_part_group_fkey
    foreign key (target_part_group) references lu_part_groups(code);

-- 7c. assigned_engineer → users FK 추가
alter table cip_items
  add constraint cip_items_assigned_engineer_fkey
    foreign key (assigned_engineer) references users(id);

-- 7d. assigned_manager → users FK 추가
alter table cip_items
  add constraint cip_items_assigned_manager_fkey
    foreign key (assigned_manager) references users(id);

-- 7e. created_by → users FK 추가
alter table cip_items
  add constraint cip_items_created_by_fkey
    foreign key (created_by) references users(id);

-- 7f. 현장조사 관련 컬럼 추가
alter table cip_items
  add column if not exists investigation_status text
    check (investigation_status in ('pending', 'in_progress', 'completed', 'rejected')),
  add column if not exists investigation_conclusion text
    check (investigation_conclusion is null or investigation_conclusion in ('confirmed', 'dismissed', 'needs_more')),
  add column if not exists five_why jsonb,
  add column if not exists fishbone jsonb,
  add column if not exists field_observation text,
  add column if not exists field_confirmed text
    check (field_confirmed is null or field_confirmed in ('confirmed', 'not_confirmed', 'intermittent')),
  add column if not exists report_content jsonb;

-- 7g. investigation_completed_at 타임스탬프
alter table cip_items
  add column if not exists investigation_completed_at timestamptz;


-- ────────────────────────────────────────
-- 8. cip_investigation_photos: 현장조사 사진
--    cip_attachments와 별도 — 조사 단계 전용
--    Supabase Storage 파일 참조
-- ────────────────────────────────────────
create table if not exists cip_investigation_photos (
  id              uuid default gen_random_uuid() primary key,
  cip_id          uuid not null
    references cip_items(id) on delete cascade,
  file_name       text not null,
  file_url        text not null,
  file_size       bigint,
  caption         text,
  taken_at        timestamptz,
  uploaded_by     text references users(id),
  uploaded_at     timestamptz default now()
);

create index if not exists idx_cip_photos_cip on cip_investigation_photos(cip_id);


-- ────────────────────────────────────────
-- 9. mv_monthly_part_stats 재생성
--    기존: part_usage JOIN으로 material_group_new 참조
--    변경: service_orders.part_group_code 직접 사용 (JOIN 제거)
-- ────────────────────────────────────────
drop materialized view if exists mv_monthly_part_stats;

create materialized view mv_monthly_part_stats as
select
  so.model_code,
  so.customer_line_code,
  so.part_group_code,
  date_trunc('month', so.work_start_date)::date as month,

  count(*)                                          as call_count,
  count(*) filter (where so.rework = true)          as rework_count,
  round(
    count(*) filter (where so.rework = true)::numeric
    / nullif(count(*), 0) * 100, 2
  )                                                 as rework_rate,
  round(avg(so.total_working_time_min), 1)          as avg_work_time_min,
  count(distinct so.equip_no)                       as affected_equip_count

from service_orders so
where so.work_start_date is not null
  and so.part_group_code is not null
group by 1, 2, 3, 4;

create unique index idx_mv_mps
  on mv_monthly_part_stats(
    coalesce(model_code, ''),
    coalesce(customer_line_code, ''),
    coalesce(part_group_code, ''),
    coalesce(month, '1970-01-01'::date)
  );


-- ────────────────────────────────────────
-- 10. updated_at 트리거 등록 (신규 테이블)
-- ────────────────────────────────────────
-- update_updated_at() 함수는 migration 007에서 이미 생성됨
-- screening_results는 immutable (월별 스냅샷) → 트리거 불필요
-- cip_investigation_photos도 immutable → 트리거 불필요


-- ============================================================
-- ER 관계 요약 (이 마이그레이션에서 생성/보강된 관계)
-- ============================================================
--
-- lu_part_groups ←── screening_results.part_group_code (FK)
--                ←── cip_items.target_part_group (FK, 신규)
--
-- screening_results ←── screening_hints (1:N, cascade delete)
--                   ←── cip_items.screening_result_id (N:1, 어떤 스크리닝에서 CIP 생성)
--
-- service_orders ←── so_descriptions (1:1, cascade delete)
--                ←── so_description_hints (1:N, cascade delete)
--                ←── cip_linked_orders (N:N via junction, 기존)
--
-- users ←── cip_items.assigned_engineer (FK, 신규)
--       ←── cip_items.assigned_manager (FK, 신규)
--       ←── cip_items.created_by (FK, 신규)
--       ←── cip_investigation_photos.uploaded_by (FK)
--
-- cip_items ←── cip_investigation_photos (1:N, cascade delete)
--           ←── cip_attachments (1:N, 기존)
--           ←── cip_comments (1:N, 기존)
--           ←── cip_stage_history (1:N, 기존)
-- ============================================================
