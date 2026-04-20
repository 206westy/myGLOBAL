-- ============================================================
-- Migration 003: Core SAP Data Tables
-- Best practices: gen_random_uuid(), timestamptz, text, FK indexes
-- ============================================================

-- ────────────────────────────────────────
-- ZCSR0010: 장비 마스터 (Equipment Master)
-- ────────────────────────────────────────
create table equipment (
  id                uuid default gen_random_uuid() primary key,
  equip_no          text not null unique,
  sap_equip_no      text,
  upper_equip_no    text,
  fsc               text,
  as_bom            boolean default false,
  manu_serial       text,
  wo                text,
  equip_id          text,

  -- 조직
  plant             text,
  work_center_code  text references lu_work_centers(code),
  country_code      text references lu_countries(code),
  customer_code     text references lu_customers(code),
  customer_line_code text references lu_customer_lines(code),
  business_type_code text references lu_business_types(code),
  platform_code     text references lu_platforms(code),
  segment_code      text references lu_segments(code),
  model_code        text references lu_models(code),

  -- 날짜
  shipping_date     date,
  fab_in_date       date,
  sign_off_date     date,
  warranty_start    date,
  warranty_end      date,
  created_on        date,

  -- 타입
  wo_type_code      text,
  wo_type_name      text,
  sales_mode_code   text references lu_sales_modes(code),
  wo_category_code  text,
  wo_category_name  text,

  -- 설비 구성
  lp_load_port      text,
  efem_robot        text,
  tm_robot          text,
  ctc_sw_code       text,
  ctc_sw            text,
  efem_sw_code      text,
  efem_sw           text,

  -- 기타
  remark1           text,
  remark2           text,
  remark3           text,
  maint_yn          boolean default true,
  current_customer  text,
  current_customer_name text,
  stand_alone       text,

  -- 상태
  status            text,

  -- 메타
  imported_at       timestamptz default now(),
  updated_at        timestamptz default now()
);


-- ────────────────────────────────────────
-- ZCSR0070D: 서비스 오더 (Service Order)
-- ────────────────────────────────────────
create table service_orders (
  id                uuid default gen_random_uuid() primary key,
  order_no          text not null unique,
  order_status_code text,
  order_status_name text,
  order_type_code   text references lu_order_types(code),
  order_type_name   text,
  order_title       text,

  -- 장비 연결 (FK 없음: SAP 데이터에 equipment 미등록 장비 존재)
  equip_no          text,
  sap_equip_no      text,
  wo                text,
  equip_id          text,

  -- 조직
  country_code      text references lu_countries(code),
  business_type_code text references lu_business_types(code),
  customer_code     text references lu_customers(code),
  customer_line_code text references lu_customer_lines(code),
  model_code        text references lu_models(code),

  -- 작업 요약
  total_task        int,
  complete_task     int,
  status_pct        numeric(5,2),
  total_working_time_min int,

  -- 분류
  act_type_code     text references lu_act_types(code),
  cost_type_code    text references lu_cost_types(code),
  warranty_code     text references lu_warranty_codes(code),

  -- 담당
  created_by        text,
  created_by_name   text,
  confirmer         text,
  confirmer_name    text,
  priority_code     text references lu_priorities(code),
  customer_contact  text,
  work_center_code  text references lu_work_centers(code),

  -- 코드 분류 (의도적으로 FK 없음: SAP 데이터에 미등록 코드 존재 가능)
  defect_code       text,
  defect_code_name  text,
  defect_text       text,
  cause_code        text,
  cause_code_name   text,
  cause_text        text,
  alarm_code        text,

  -- 날짜/시간
  plan_start_date   date,
  plan_end_date     date,
  created_at        date,
  reception_date    date,
  approval_date     date,
  work_start_date   date,
  work_end_date     date,

  -- 다운타임
  down_time_date    text,
  down_time_time    text,
  up_time_date      text,
  up_time_time      text,
  breakdown         text,
  duration          numeric,
  duration_unit     text,

  -- 설비 위치 분류
  module            text,
  chamber           text,
  position          text,
  part_name         text,
  work_type         text,

  -- 리워크
  rework            boolean default false,
  rework_check      text,

  -- 정렬용
  title_sort        text,
  title_true_false  boolean,

  -- 연월
  year              int,
  month             text,
  billing           text,
  plant             text,

  -- 상태
  status            text,

  -- 메타
  imported_at       timestamptz default now(),
  updated_at        timestamptz default now()
);


-- ────────────────────────────────────────
-- ZCSR0070D (하단) / ZCSR0140D: 태스크 상세
-- PRD 개선: UNIQUE 추가, 누락 컬럼 추가, updated_at 추가
-- ────────────────────────────────────────
create table service_tasks (
  id                uuid default gen_random_uuid() primary key,
  -- FK 제거: Installation/Setup 오더는 ZCSR0070D에 없으나 태스크는 존재
  order_no          text not null,
  task_no           text,
  task_code         text references lu_task_codes(code),
  task_name         text,
  task_status       text,

  -- 작업자
  id_category       text,
  id_category_name  text,
  partner_company   text,
  partner_company_name text,
  worker_id         text,
  worker_name       text,
  is_main           boolean default false,
  engineer_level    text,

  -- 시간
  record_date       date,
  work_start_date   date,
  work_start_time   text,
  work_end_date     date,
  work_end_time     text,
  work_time_min     int,
  non_work_time_min int,
  total_min         int,
  moving_time_min   int,
  time_unit         text default 'MIN',
  total_hour        numeric(6,2),

  -- 분류
  act_type_code     text references lu_act_types(code),
  cost_type_code    text references lu_cost_types(code),
  warranty_code     text references lu_warranty_codes(code),
  priority_code     text references lu_priorities(code),
  work_center_code  text references lu_work_centers(code),

  -- 장비 (비정규화)
  equip_no          text not null,
  equip_id          text,
  model_code        text,
  country_code      text,
  customer_line_code text,

  -- PRD 개선: ZCSR0140D CSV에 있으나 스키마에 누락된 컬럼
  sap_equip_no      text,
  material_no       text,
  material_desc     text,
  wo                text,
  business_type_code text,
  customer_code     text,
  order_title       text,
  status            text,

  -- 메타
  plant             text,
  year              int,
  month             int,
  working_hour      numeric(6,2),
  worker_key        text,
  company           text,
  remark            text,

  imported_at       timestamptz default now(),
  updated_at        timestamptz default now(),

  -- Upsert 키 (PRD 개선 1-1)
  unique(order_no, task_no, worker_id, record_date)
);


-- ────────────────────────────────────────
-- ZCSR0100: 파트 사용 이력 (Part Usage)
-- PRD 개선: UNIQUE 추가
-- ────────────────────────────────────────
create table part_usage (
  id                uuid default gen_random_uuid() primary key,
  order_no          text not null references service_orders(order_no),

  -- 파트 정보
  part_no           text,
  part_name         text,
  part_spec         text,
  part_model        text,
  is_key_part       boolean default false,
  is_return         boolean default false,
  used_qty          int default 1,
  unit              text default 'EA',
  serial_number     text,
  rf_time_new       numeric,

  -- 파트 위치
  location_group    text,
  location_code     text,
  location_desc     text,

  -- 손상/활동 분류
  damage_group      text,
  damage_code       text,
  damage_desc       text,
  activity_group    text,
  activity_code     text,
  activity_desc     text,

  -- Material Group
  material_group_new text references lu_material_groups(code),
  material_group_new_name text,
  material_group_old text,
  material_group_old_name text,

  -- 교체 파트 정보
  changed_part_no   text,
  changed_part_name text,
  changed_part_spec text,
  changed_key       boolean,
  changed_return    boolean,
  changed_part_model text,
  changed_qty       int,
  changed_unit      text,
  changed_serial    text,
  rf_time_old       numeric,

  -- Part Path
  part_path         text,

  -- 사용 유형
  usage_type        text,
  supply_type       text,
  supply_desc       text,
  as_bom_check      text,

  -- 장비/오더 비정규화
  equip_no          text not null,
  equip_id          text,
  model_code        text,
  country_code      text,
  customer_line_code text,
  business_type_code text,
  platform_code     text,
  segment_code      text,
  wo                text,

  -- 날짜
  usage_date        date,
  approved_date     date,
  warranty_code     text,
  warranty_start    date,
  warranty_end      date,
  sales_mode_code   text,
  created_by        text,
  created_by_name   text,
  order_status_code text,
  order_title       text,
  task_no           text,
  task_code         text,
  task_name         text,

  plant             text,
  remark            text,
  imported_at       timestamptz default now(),

  -- Upsert 키 (PRD 개선 1-3)
  unique(order_no, part_no, task_no, location_code, usage_date, part_path)
);


-- ────────────────────────────────────────
-- ZCSR0150: 설비 월별 가동 이력 (피벗 해제)
-- PRD 개선: equip_no nullable
-- ────────────────────────────────────────
create table equipment_monthly_metrics (
  id                uuid default gen_random_uuid() primary key,
  equip_no          text,
  sap_equip_no      text,
  wo                text,
  equip_id          text,

  -- 조직 (비정규화)
  country_code      text,
  customer_code     text,
  customer_line_code text,
  model_code        text,
  platform_code     text,
  segment_code      text,
  business_type_code text,
  sales_mode_code   text,

  -- 핵심: 언피벗된 데이터
  year_month        text not null,
  division          text not null,
  value             numeric default 0,

  -- 상태
  equip_status_code text,
  equip_status_name text,

  plant             text,
  work_center_code  text,
  imported_at       timestamptz default now(),

  unique(sap_equip_no, year_month, division)
);
