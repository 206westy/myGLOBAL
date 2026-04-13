-- ============================================================
-- myATHENA CIP Platform — Supabase (PostgreSQL) Schema
-- ============================================================
-- 데이터 소스: mySERVICE SAP (5개 Tcode)
-- ZCSR0010  → equipment (장비 마스터)
-- ZCSR0070D → service_orders (서비스 오더)
-- ZCSR0070D → service_tasks (태스크 상세/작업자 로그)
-- ZCSR0100  → part_usage (파트 사용 이력)
-- ZCSR0150  → equipment_monthly_metrics (설비 월별 가동이력)
-- + CIP 플랫폼 전용 테이블
-- + Materialized Views (집계/이상감지용)
-- ============================================================

-- 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- 텍스트 유사 검색용
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector (CCB 벡터검색용)

-- ============================================================
-- PART 1: 룩업 / 코드 테이블 (SAP 코드 체계)
-- ============================================================

-- 국가
CREATE TABLE lu_countries (
  code        TEXT PRIMARY KEY,              -- 'KR', 'CN', 'US'
  name_ko     TEXT NOT NULL,                 -- '대한민국'
  name_en     TEXT
);

-- 비즈니스 타입
CREATE TABLE lu_business_types (
  code        TEXT PRIMARY KEY,              -- 'DS', 'HD', 'RE'
  name        TEXT NOT NULL                  -- 'Dry Strip', 'HDW', 'Reflow'
);

-- 플랫폼
CREATE TABLE lu_platforms (
  code        TEXT PRIMARY KEY,              -- 'B', 'C', 'D'
  name        TEXT NOT NULL                  -- '300mm Dry Stripper', 'Reflow'
);

-- 세그먼트
CREATE TABLE lu_segments (
  code        TEXT PRIMARY KEY,              -- 'J', 'G', 'H'
  name        TEXT NOT NULL                  -- 'SUPRA N', 'SUPRA V', 'HDW'
);

-- 모델
CREATE TABLE lu_models (
  code        TEXT PRIMARY KEY,              -- '050', '019', '103'
  name        TEXT NOT NULL,                 -- 'SUPRA N', 'SUPRA V', 'GENEVA STP300'
  segment_code TEXT REFERENCES lu_segments(code),
  platform_code TEXT REFERENCES lu_platforms(code)
);

-- 고객사
CREATE TABLE lu_customers (
  code        TEXT PRIMARY KEY,              -- 'P-210006', 'H-220017'
  name        TEXT NOT NULL,                 -- 'SEC (KR)', 'GLOBALFOUNDRIES (US)'
  country_code TEXT REFERENCES lu_countries(code)
);

-- 고객사 라인
CREATE TABLE lu_customer_lines (
  code        TEXT PRIMARY KEY,              -- 'P-210006-240399'
  name        TEXT NOT NULL,                 -- 'SEC-P4(D)(KR)'
  customer_code TEXT REFERENCES lu_customers(code) NOT NULL
);

-- 워크센터
CREATE TABLE lu_work_centers (
  code        TEXT PRIMARY KEY,              -- 'DFS001', 'OFS001'
  name        TEXT NOT NULL,                 -- 'PSK Field Service (Domestic)'
  plant       TEXT                           -- '1200', '3200'
);

-- Defect 코드
CREATE TABLE lu_defect_codes (
  code        TEXT PRIMARY KEY,              -- '850', '835'
  name        TEXT NOT NULL                  -- 'ETC', 'Preventive Maintenance'
);

-- Cause 코드
CREATE TABLE lu_cause_codes (
  code        TEXT PRIMARY KEY,              -- '760', '740'
  name        TEXT NOT NULL                  -- 'Tool Checking', 'Customer Problem'
);

-- 작업 유형 (Act Type)
CREATE TABLE lu_act_types (
  code        TEXT PRIMARY KEY,              -- '101', '102'
  name        TEXT NOT NULL                  -- 'BM', 'PM'
);

-- 비용 유형 (Cost Type)
CREATE TABLE lu_cost_types (
  code        TEXT PRIMARY KEY,              -- 'T', 'S'
  name        TEXT NOT NULL                  -- 'Contract', 'SALES'
);

-- 워런티
CREATE TABLE lu_warranty_codes (
  code        TEXT PRIMARY KEY,              -- 'WI', 'WO', 'CS'
  name        TEXT NOT NULL                  -- 'Warranty In', 'Warranty Out'
);

-- 우선순위
CREATE TABLE lu_priorities (
  code        TEXT PRIMARY KEY,              -- '5', '3', '1'
  name        TEXT NOT NULL                  -- 'Normal Work', 'Urgent', 'Emergency'
);

-- Damage 코드 (파트 사용 이력)
CREATE TABLE lu_damage_codes (
  group_code  TEXT,
  code        TEXT PRIMARY KEY,              -- '60'
  name        TEXT NOT NULL                  -- 'Process Issue (PC, ER)'
);

-- Activity 코드 (파트 사용 이력)
CREATE TABLE lu_activity_codes (
  group_code  TEXT,
  code        TEXT PRIMARY KEY,              -- '110'
  name        TEXT NOT NULL                  -- 'Cleaning'
);

-- Material Group (파트 그룹)
CREATE TABLE lu_material_groups (
  code        TEXT PRIMARY KEY,              -- 'R0005', 'R0031'
  name        TEXT NOT NULL                  -- 'BAFFLE', 'Quartz'
);

-- 태스크 표준 텍스트 (Standard Text Key)
CREATE TABLE lu_task_codes (
  code        TEXT PRIMARY KEY,              -- 'CS00002', 'CS00008', 'CS00012'
  name        TEXT NOT NULL                  -- 'Analysis', 'Cleaning', 'Monitoring'
);

-- W/O 구분
CREATE TABLE lu_wo_types (
  code        TEXT PRIMARY KEY,              -- 'WG1'
  name        TEXT NOT NULL                  -- '생산'
);

-- 오더 타입
CREATE TABLE lu_order_types (
  code        TEXT PRIMARY KEY,              -- 'ZCS1'
  name        TEXT NOT NULL                  -- 'Maintenance'
);

-- 세일즈 모드
CREATE TABLE lu_sales_modes (
  code        TEXT PRIMARY KEY,              -- 'S'
  name        TEXT NOT NULL                  -- 'SALES'
);


-- ============================================================
-- PART 2: SAP 원본 데이터 테이블
-- ============================================================

-- ────────────────────────────────────────
-- ZCSR0010: 장비 마스터 (Equipment Master)
-- ────────────────────────────────────────
CREATE TABLE equipment (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  equip_no          TEXT NOT NULL UNIQUE,        -- 'PJK35796' (PSK 장비번호, 실질 PK)
  sap_equip_no      TEXT,                        -- SAP Equipment No.
  upper_equip_no    TEXT,                        -- 상위 장비번호
  fsc               TEXT,                        -- FSC 코드
  as_bom            BOOLEAN DEFAULT FALSE,       -- A/S BOM 유무
  manu_serial       TEXT,                        -- 제조 시리얼
  wo                TEXT,                        -- W/O (Work Order)
  equip_id          TEXT,                        -- 'EPA3524' (설비 ID)

  -- 조직
  plant             TEXT,                        -- '1200', '3200'
  work_center_code  TEXT REFERENCES lu_work_centers(code),
  country_code      TEXT REFERENCES lu_countries(code),
  customer_code     TEXT REFERENCES lu_customers(code),
  customer_line_code TEXT REFERENCES lu_customer_lines(code),
  business_type_code TEXT REFERENCES lu_business_types(code),
  platform_code     TEXT REFERENCES lu_platforms(code),
  segment_code      TEXT REFERENCES lu_segments(code),
  model_code        TEXT REFERENCES lu_models(code),

  -- 날짜
  shipping_date     DATE,
  fab_in_date       DATE,
  sign_off_date     DATE,
  warranty_start    DATE,
  warranty_end      DATE,
  created_on        DATE,

  -- 타입
  wo_type_code      TEXT,                        -- 'M03'
  wo_type_name      TEXT,                        -- 'PO'
  sales_mode_code   TEXT REFERENCES lu_sales_modes(code),
  wo_category_code  TEXT,                        -- 'WG1'
  wo_category_name  TEXT,                        -- '생산'

  -- 설비 구성
  lp_load_port      TEXT,                        -- LP(Load Port)
  efem_robot        TEXT,
  tm_robot          TEXT,
  ctc_sw_code       TEXT,                        -- CTC S/W Code
  ctc_sw            TEXT,                        -- CTC S/W Version
  efem_sw_code      TEXT,                        -- EFEM S/W Code
  efem_sw           TEXT,                        -- EFEM S/W Version

  -- 기타
  remark1           TEXT,
  remark2           TEXT,
  remark3           TEXT,
  maint_yn          BOOLEAN DEFAULT TRUE,        -- Maint Y/N
  current_customer  TEXT,                        -- 현재고객 코드
  current_customer_name TEXT,                    -- 현재고객 이름
  stand_alone       TEXT,

  -- 상태
  status            TEXT,                        -- '@09@' → 운영상태

  -- 메타
  imported_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_equip_no ON equipment(equip_no);
CREATE INDEX idx_equipment_model ON equipment(model_code);
CREATE INDEX idx_equipment_country ON equipment(country_code);
CREATE INDEX idx_equipment_customer ON equipment(customer_code);
CREATE INDEX idx_equipment_customer_line ON equipment(customer_line_code);
CREATE INDEX idx_equipment_business_type ON equipment(business_type_code);


-- ────────────────────────────────────────
-- ZCSR0070D: 서비스 오더 (Service Order)
-- ────────────────────────────────────────
CREATE TABLE service_orders (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_no          TEXT NOT NULL UNIQUE,         -- '40156177' (서비스 오더 번호)
  order_status_code TEXT,                         -- 'E0008'
  order_status_name TEXT,                         -- '5.Completed'
  order_type_code   TEXT REFERENCES lu_order_types(code),
  order_title       TEXT,                         -- 'C00005 MON FCIP FLANGE-OIL LEAK'

  -- 장비 연결
  equip_no          TEXT NOT NULL REFERENCES equipment(equip_no),
  sap_equip_no      TEXT,
  wo                TEXT,
  equip_id          TEXT,

  -- 조직
  country_code      TEXT REFERENCES lu_countries(code),
  business_type_code TEXT REFERENCES lu_business_types(code),
  customer_code     TEXT REFERENCES lu_customers(code),
  customer_line_code TEXT REFERENCES lu_customer_lines(code),
  model_code        TEXT REFERENCES lu_models(code),

  -- 작업 요약
  total_task        INT,
  complete_task     INT,
  status_pct        NUMERIC(5,2),                -- 100.00
  total_working_time_min INT,                    -- 총 작업시간 (분)

  -- 분류
  act_type_code     TEXT REFERENCES lu_act_types(code),
  cost_type_code    TEXT REFERENCES lu_cost_types(code),
  warranty_code     TEXT REFERENCES lu_warranty_codes(code),

  -- 담당
  created_by        TEXT,                         -- 생성자 ID
  created_by_name   TEXT,
  confirmer         TEXT,                         -- 확인자 ID
  confirmer_name    TEXT,
  priority_code     TEXT REFERENCES lu_priorities(code),
  customer_contact  TEXT,
  work_center_code  TEXT REFERENCES lu_work_centers(code),

  -- 코드 분류 (CIP 이상감지 핵심)
  defect_code       TEXT,                         -- '850'
  defect_code_name  TEXT,                         -- 'ETC'
  defect_text       TEXT,
  cause_code        TEXT,                         -- '760'
  cause_code_name   TEXT,                         -- 'Tool Checking'
  cause_text        TEXT,
  alarm_code        TEXT,

  -- 날짜/시간
  plan_start_date   DATE,
  plan_end_date     DATE,
  created_at        DATE,
  reception_date    DATE,
  approval_date     DATE,
  work_start_date   DATE,
  work_end_date     DATE,

  -- 다운타임
  down_time_date    TEXT,                         -- 'YYYYMMDD'
  down_time_time    TEXT,                         -- 'HHMMSS' 또는 '오전 9:00:00'
  up_time_date      TEXT,
  up_time_time      TEXT,
  breakdown         TEXT,
  duration          NUMERIC,
  duration_unit     TEXT,                         -- 'H'

  -- 설비 위치 분류 (CIP 파트군 분석 핵심)
  module            TEXT,                         -- 'PM', 'TM', 'EFEM'
  chamber           TEXT,                         -- 'Common', 'PM1'
  position          TEXT,                         -- 'Common', 'Controller'
  part_name         TEXT,                         -- 'Source', 'Controller'
  work_type         TEXT,                         -- 'MON', 'ADJ', 'CLN'

  -- 리워크
  rework            BOOLEAN DEFAULT FALSE,        -- '1' → true
  rework_check      TEXT,                         -- 'Normal', 'Rework'

  -- 정렬용
  title_sort        TEXT,                         -- 'C00005'
  title_true_false  BOOLEAN,                     -- TRUE/FALSE

  -- 연월
  year              INT,
  month             TEXT,                         -- 'Apr'
  billing           TEXT,
  plant             TEXT,

  -- 메타
  status            TEXT,                         -- '@08@'
  imported_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_so_equip_no ON service_orders(equip_no);
CREATE INDEX idx_so_order_no ON service_orders(order_no);
CREATE INDEX idx_so_work_start ON service_orders(work_start_date);
CREATE INDEX idx_so_defect_code ON service_orders(defect_code);
CREATE INDEX idx_so_cause_code ON service_orders(cause_code);
CREATE INDEX idx_so_model ON service_orders(model_code);
CREATE INDEX idx_so_country ON service_orders(country_code);
CREATE INDEX idx_so_customer_line ON service_orders(customer_line_code);
CREATE INDEX idx_so_module ON service_orders(module);
CREATE INDEX idx_so_chamber ON service_orders(chamber);
CREATE INDEX idx_so_rework ON service_orders(rework);
CREATE INDEX idx_so_work_type ON service_orders(work_type);
-- 복합 인덱스: 이상감지 쿼리 최적화
CREATE INDEX idx_so_analysis ON service_orders(model_code, country_code, customer_line_code, work_start_date);
CREATE INDEX idx_so_part_analysis ON service_orders(module, chamber, position, defect_code, cause_code);


-- ────────────────────────────────────────
-- ZCSR0070D (하단): 태스크 상세 / 작업자 로그
-- ────────────────────────────────────────
CREATE TABLE service_tasks (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_no          TEXT NOT NULL REFERENCES service_orders(order_no),
  task_no           TEXT,                         -- '10', '20'
  task_code         TEXT REFERENCES lu_task_codes(code),
  task_name         TEXT,                         -- 'Analysis', 'Monitoring'
  task_status       TEXT,                         -- 'CNF'

  -- 작업자
  id_category       TEXT,                         -- 'VTC010'
  id_category_name  TEXT,                         -- '해외지사'
  partner_company   TEXT,                         -- '220027'
  partner_company_name TEXT,                      -- 'PSK-CN'
  worker_id         TEXT,                         -- '600114'
  worker_name       TEXT,                         -- 'George Han'
  is_main           BOOLEAN DEFAULT FALSE,        -- TRUE/FALSE
  engineer_level    TEXT,                         -- '2'

  -- 시간 (CIP 작업시간 분석 핵심)
  record_date       DATE,
  work_start_date   DATE,
  work_start_time   TEXT,                         -- '오전 3:00:00'
  work_end_date     DATE,
  work_end_time     TEXT,                         -- '오전 4:00:00'
  work_time_min     INT,                          -- 60 (순 작업시간)
  non_work_time_min INT,                          -- 10 (비작업시간)
  total_min         INT,                          -- 50 (실질 합계)
  moving_time_min   INT,                          -- 60 (이동시간)
  time_unit         TEXT DEFAULT 'MIN',
  total_hour        NUMERIC(6,2),                 -- 0.8

  -- 분류
  act_type_code     TEXT REFERENCES lu_act_types(code),
  cost_type_code    TEXT REFERENCES lu_cost_types(code),
  warranty_code     TEXT REFERENCES lu_warranty_codes(code),
  priority_code     TEXT REFERENCES lu_priorities(code),
  work_center_code  TEXT REFERENCES lu_work_centers(code),

  -- 장비 (비정규화, 조인 최소화)
  equip_no          TEXT NOT NULL,
  equip_id          TEXT,
  model_code        TEXT,
  country_code      TEXT,
  customer_line_code TEXT,

  -- 메타
  remark            TEXT,
  plant             TEXT,
  year              INT,
  month             INT,
  working_hour      NUMERIC(6,2),                -- 2.2
  worker_key        TEXT,                         -- 'GeorgeHan'
  company           TEXT,                         -- 'PSK-CN'

  imported_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_st_order_no ON service_tasks(order_no);
CREATE INDEX idx_st_equip_no ON service_tasks(equip_no);
CREATE INDEX idx_st_worker ON service_tasks(worker_id);
CREATE INDEX idx_st_task_code ON service_tasks(task_code);
CREATE INDEX idx_st_work_date ON service_tasks(work_start_date);


-- ────────────────────────────────────────
-- ZCSR0100: 파트 사용 이력 (Part Usage)
-- ────────────────────────────────────────
CREATE TABLE part_usage (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_no          TEXT NOT NULL REFERENCES service_orders(order_no),

  -- 파트 정보
  part_no           TEXT,                         -- 'C5201012'
  part_name         TEXT,                         -- 'MF,BAFFLE_SLOT_PIN DOWN_45MM_9H_ST,ST_02'
  part_spec         TEXT,                         -- 'ST_02'
  part_model        TEXT,                         -- 'MF', 'QUARTZ'
  is_key_part       BOOLEAN DEFAULT FALSE,        -- KEY: 'N'/'Y'
  is_return         BOOLEAN DEFAULT FALSE,        -- RTN: 'N'/'Y'
  used_qty          INT DEFAULT 1,
  unit              TEXT DEFAULT 'EA',
  serial_number     TEXT,
  rf_time_new       NUMERIC,                     -- 0 (RF Time New)

  -- 파트 위치 (설비 내 위치 추적)
  location_group    TEXT,                         -- 'E000'
  location_code     TEXT,                         -- 'C1'
  location_desc     TEXT,                         -- 'PM1-1 (Channel 1)'

  -- 손상/활동 분류 (CIP 원인 분석용)
  damage_group      TEXT,
  damage_code       TEXT,
  damage_desc       TEXT,                         -- 'Process Issue (PC, ER)'
  activity_group    TEXT,
  activity_code     TEXT,
  activity_desc     TEXT,                         -- 'Cleaning'

  -- Material Group (파트군)
  material_group_new TEXT REFERENCES lu_material_groups(code),
  material_group_new_name TEXT,                   -- 'BAFFLE'
  material_group_old TEXT,
  material_group_old_name TEXT,

  -- 교체 파트 정보 (Changed Part)
  changed_part_no   TEXT,
  changed_part_name TEXT,
  changed_part_spec TEXT,
  changed_key       BOOLEAN,
  changed_return    BOOLEAN,
  changed_part_model TEXT,
  changed_qty       INT,
  changed_unit      TEXT,
  changed_serial    TEXT,
  rf_time_old       NUMERIC,

  -- Part Path (설비 내 계층 경로)
  part_path         TEXT,                         -- 'C1/C5201012000000'

  -- 사용 유형
  usage_type        TEXT,                         -- '3RDPART'
  supply_type       TEXT,                         -- 'H'
  supply_desc       TEXT,                         -- 'History'
  as_bom_check      TEXT,                         -- '@1G@'

  -- 장비/오더 비정규화
  equip_no          TEXT NOT NULL,
  equip_id          TEXT,
  model_code        TEXT,
  country_code      TEXT,
  customer_line_code TEXT,
  business_type_code TEXT,
  platform_code     TEXT,
  segment_code      TEXT,
  wo                TEXT,

  -- 날짜
  usage_date        DATE,                         -- 사용일자
  approved_date     DATE,
  warranty_code     TEXT,
  warranty_start    DATE,
  warranty_end      DATE,
  sales_mode_code   TEXT,
  created_by        TEXT,
  created_by_name   TEXT,
  order_status_code TEXT,
  order_title       TEXT,
  task_no           TEXT,                         -- '10'
  task_code         TEXT,                         -- 'CS00008'
  task_name         TEXT,                         -- 'Cleaning'

  plant             TEXT,
  remark            TEXT,
  imported_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pu_order_no ON part_usage(order_no);
CREATE INDEX idx_pu_equip_no ON part_usage(equip_no);
CREATE INDEX idx_pu_part_no ON part_usage(part_no);
CREATE INDEX idx_pu_material_group ON part_usage(material_group_new);
CREATE INDEX idx_pu_damage_code ON part_usage(damage_code);
CREATE INDEX idx_pu_usage_date ON part_usage(usage_date);
CREATE INDEX idx_pu_location ON part_usage(location_code, location_desc);


-- ────────────────────────────────────────
-- ZCSR0150: 설비 월별 가동 이력 (피벗 해제)
-- ────────────────────────────────────────
-- 원본이 피벗 형태 (컬럼=월)이므로 행 형태로 언피벗하여 저장
CREATE TABLE equipment_monthly_metrics (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  equip_no          TEXT NOT NULL,                -- SAP Equip No. → equipment 테이블 연결
  sap_equip_no      TEXT,
  wo                TEXT,
  equip_id          TEXT,

  -- 조직 (비정규화)
  country_code      TEXT,
  customer_code     TEXT,
  customer_line_code TEXT,
  model_code        TEXT,
  platform_code     TEXT,
  segment_code      TEXT,
  business_type_code TEXT,
  sales_mode_code   TEXT,

  -- 핵심: 언피벗된 데이터
  year_month        TEXT NOT NULL,                -- '202501' (YYYYMM)
  division          TEXT NOT NULL,                -- 'Operation Time', 'Breakdown Time', 'PM Time' 등
  value             NUMERIC DEFAULT 0,            -- 시간 (분 또는 시간, 원본 단위)

  -- 상태
  equip_status_code TEXT,                         -- 'E0002'
  equip_status_name TEXT,                         -- 'Maintain On'

  plant             TEXT,
  work_center_code  TEXT,
  imported_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sap_equip_no, year_month, division)
);

CREATE INDEX idx_emm_equip ON equipment_monthly_metrics(sap_equip_no);
CREATE INDEX idx_emm_ym ON equipment_monthly_metrics(year_month);
CREATE INDEX idx_emm_division ON equipment_monthly_metrics(division);
CREATE INDEX idx_emm_model ON equipment_monthly_metrics(model_code);
CREATE INDEX idx_emm_country ON equipment_monthly_metrics(country_code);


-- ============================================================
-- PART 3: CIP 플랫폼 테이블
-- ============================================================

-- ────────────────────────────────────────
-- CIP 아이템 (핵심 테이블)
-- ────────────────────────────────────────
CREATE TABLE cip_items (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cip_no            TEXT NOT NULL UNIQUE,          -- 'CIP-2026-0001' (자동생성)
  
  -- 현재 단계 (워크플로우 상태)
  stage             TEXT NOT NULL DEFAULT 'detected'
    CHECK (stage IN (
      'detected',           -- Step 1: 이상 감지됨
      'registered',         -- Step 2: 이슈 기록됨
      'investigating',      -- Step 3: 현장 조사중
      'searching_solution', -- Step 4: CCB 매칭 / 솔루션 탐색
      'developing_solution',-- Step 5: AI 심층 추론 / 솔루션 개발
      'lab_transferred',    -- Step 6: 연구소 전달됨
      'lab_responded',      -- Step 7: 연구소 답변 수령
      'testing',            -- Step 8: 적용 & 테스트
      'verifying',          -- Step 9: 효과성 확인
      'rolling_out',        -- Step 10: 확산 관리중
      'completed',          -- 완료
      'cancelled'           -- 취소
    )),

  -- 여정 유형
  journey_type      TEXT NOT NULL DEFAULT 'A'
    CHECK (journey_type IN ('A', 'B')),           -- A: 신규 발굴, B: 기존 CCB 적용

  -- 우선순위 (AIAG/VDA AP 기반)
  severity          INT CHECK (severity BETWEEN 1 AND 10),  -- 심각도
  occurrence        INT CHECK (occurrence BETWEEN 1 AND 10), -- 발생도
  detection         INT CHECK (detection BETWEEN 1 AND 10),  -- 검출도
  action_priority   TEXT CHECK (action_priority IN ('HIGH','MEDIUM','LOW')),
  
  -- 이상 감지 정보
  anomaly_type      TEXT,                          -- 'call_frequency', 'rework_rate', 'work_time', 'composite'
  anomaly_score     NUMERIC,                       -- Isolation Forest 점수 등
  anomaly_detail    JSONB,                         -- 감지 상세 (CUSUM/EWMA 값, 위반 지표 등)

  -- 대상 장비/파트
  equip_no          TEXT REFERENCES equipment(equip_no),
  model_code        TEXT,
  country_code      TEXT,
  customer_line_code TEXT,
  target_module     TEXT,                          -- 'PM', 'TM', 'EFEM'
  target_chamber    TEXT,
  target_part_group TEXT,                          -- Material Group
  target_part_no    TEXT,

  -- 이슈 설명
  title             TEXT NOT NULL,
  description       TEXT,
  symptom           TEXT,                          -- 증상 설명
  root_cause        TEXT,                          -- 근본 원인 (Step 3에서 입력)
  root_cause_method TEXT,                          -- '5Why', 'Fishbone', 'FMEA'

  -- CCB 연결 (Journey B 또는 Step 4 매칭)
  matched_ccb_id    UUID,                          -- ccb_documents.id
  ccb_match_score   NUMERIC,                       -- 유사도 점수

  -- 솔루션
  solution_summary  TEXT,
  solution_doc_url  TEXT,                          -- 기술 제안서 URL

  -- 연구소 연결 (Step 6-7)
  lab_transfer_date DATE,
  lab_response_date DATE,
  lab_status        TEXT CHECK (lab_status IN ('pending','in_progress','completed','rejected')),
  lab_milestone     JSONB,                         -- [{name, target_date, actual_date, status}]
  lab_sla_deadline  DATE,
  lab_notes         TEXT,

  -- 테스트 (Step 8)
  test_plan_id      UUID,                          -- cip_test_plans.id
  test_status       TEXT CHECK (test_status IN ('not_started','iq','oq','pq','marathon','completed','failed')),

  -- 효과성 (Step 9)
  effectiveness     JSONB,                         -- {before: {}, after: {}, p_value, improvement_pct}
  
  -- 재무
  cip_revenue       NUMERIC,                       -- CIP 매출
  customer_savings  NUMERIC,                       -- 고객 절감 비용
  health_score_delta NUMERIC,                      -- 헬스스코어 변화

  -- 확산 (Step 10)
  rollout_id        UUID,                          -- cip_rollouts.id
  
  -- 담당
  assigned_engineer TEXT,                          -- users.id
  assigned_manager  TEXT,                          -- users.id
  created_by        TEXT,

  -- 타임스탬프
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  detected_at       TIMESTAMPTZ,
  registered_at     TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX idx_cip_no ON cip_items(cip_no);
CREATE INDEX idx_cip_stage ON cip_items(stage);
CREATE INDEX idx_cip_priority ON cip_items(action_priority);
CREATE INDEX idx_cip_equip ON cip_items(equip_no);
CREATE INDEX idx_cip_model ON cip_items(model_code);
CREATE INDEX idx_cip_country ON cip_items(country_code);
CREATE INDEX idx_cip_journey ON cip_items(journey_type);
CREATE INDEX idx_cip_created ON cip_items(created_at);
CREATE INDEX idx_cip_assigned_eng ON cip_items(assigned_engineer);


-- CIP 번호 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_cip_no()
RETURNS TRIGGER AS $$
DECLARE
  yr TEXT;
  seq INT;
BEGIN
  yr := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(cip_no, '-', 3) AS INT)
  ), 0) + 1 INTO seq
  FROM cip_items
  WHERE cip_no LIKE 'CIP-' || yr || '-%';
  
  NEW.cip_no := 'CIP-' || yr || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cip_no
  BEFORE INSERT ON cip_items
  FOR EACH ROW
  WHEN (NEW.cip_no IS NULL)
  EXECUTE FUNCTION generate_cip_no();


-- ────────────────────────────────────────
-- CIP 상태 전이 이력 (Audit Trail)
-- ────────────────────────────────────────
CREATE TABLE cip_stage_history (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cip_id            UUID NOT NULL REFERENCES cip_items(id) ON DELETE CASCADE,
  from_stage        TEXT,
  to_stage          TEXT NOT NULL,
  changed_by        TEXT,                          -- user id
  changed_at        TIMESTAMPTZ DEFAULT NOW(),
  reason            TEXT,
  metadata          JSONB                          -- 전이 시 첨부 데이터
);

CREATE INDEX idx_csh_cip ON cip_stage_history(cip_id);


-- ────────────────────────────────────────
-- CIP 첨부파일
-- ────────────────────────────────────────
CREATE TABLE cip_attachments (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cip_id            UUID NOT NULL REFERENCES cip_items(id) ON DELETE CASCADE,
  file_name         TEXT NOT NULL,
  file_url          TEXT NOT NULL,                 -- Supabase Storage URL
  file_type         TEXT,                          -- 'image', 'pdf', 'log', 'csv'
  file_size         BIGINT,
  stage_at_upload   TEXT,                          -- 어느 단계에서 올렸는지
  uploaded_by       TEXT,
  uploaded_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ca_cip ON cip_attachments(cip_id);


-- ────────────────────────────────────────
-- CIP 코멘트 / 작업 노트
-- ────────────────────────────────────────
CREATE TABLE cip_comments (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cip_id            UUID NOT NULL REFERENCES cip_items(id) ON DELETE CASCADE,
  comment_type      TEXT DEFAULT 'note'
    CHECK (comment_type IN ('note', 'system', 'lab', 'escalation')),
  content           TEXT NOT NULL,
  created_by        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cc_cip ON cip_comments(cip_id);


-- ────────────────────────────────────────
-- CIP 관련 서비스 오더 링크
-- ────────────────────────────────────────
CREATE TABLE cip_linked_orders (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cip_id            UUID NOT NULL REFERENCES cip_items(id) ON DELETE CASCADE,
  order_no          TEXT NOT NULL REFERENCES service_orders(order_no),
  link_type         TEXT DEFAULT 'evidence'
    CHECK (link_type IN ('evidence', 'related', 'rework', 'test_result')),
  linked_at         TIMESTAMPTZ DEFAULT NOW(),
  linked_by         TEXT
);

CREATE INDEX idx_clo_cip ON cip_linked_orders(cip_id);
CREATE INDEX idx_clo_order ON cip_linked_orders(order_no);


-- ────────────────────────────────────────
-- CCB 문서 (벡터 검색용)
-- ────────────────────────────────────────
CREATE TABLE ccb_documents (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ccb_no            TEXT UNIQUE,                   -- CCB 문서 번호
  title             TEXT NOT NULL,
  content           TEXT,
  summary           TEXT,
  
  -- 분류
  target_model      TEXT[],                        -- 적용 모델 배열
  target_module     TEXT[],                        -- 적용 모듈 배열
  target_part_group TEXT[],                        -- 적용 파트군 배열
  country_codes     TEXT[],                        -- 적용 국가 배열
  
  -- 솔루션 상세
  solution_type     TEXT,                          -- 'part_upgrade', 'sop_change', 'sw_update', 'design_change'
  action_plan       TEXT,
  verified          BOOLEAN DEFAULT FALSE,         -- 검증 완료 여부
  verified_at       DATE,
  
  -- 벡터 임베딩
  embedding         vector(1024),                  -- BGE-M3 차원
  
  -- 파트 정보 (CIP 매출 계산용)
  old_part_no       TEXT,
  old_part_price    NUMERIC,
  new_part_no       TEXT,
  new_part_price    NUMERIC,

  -- 메타
  source            TEXT,                          -- 'lab', 'field', 'external'
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ccb_embedding ON ccb_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX idx_ccb_model ON ccb_documents USING gin (target_model);
CREATE INDEX idx_ccb_module ON ccb_documents USING gin (target_module);
CREATE INDEX idx_ccb_verified ON ccb_documents(verified);


-- ────────────────────────────────────────
-- CIP 테스트 플랜
-- ────────────────────────────────────────
CREATE TABLE cip_test_plans (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cip_id            UUID NOT NULL REFERENCES cip_items(id) ON DELETE CASCADE,
  plan_type         TEXT DEFAULT 'iq_oq_pq'
    CHECK (plan_type IN ('iq_oq_pq', 'ab_test', 'marathon', 'custom')),
  
  -- 체크리스트 (JSONB 배열)
  checklist         JSONB,                         -- [{step, desc, required, status, result, checked_by, checked_at}]
  
  -- 대상 장비
  target_equip_no   TEXT,
  control_equip_no  TEXT,                          -- A/B 테스트 시 Control 장비
  
  -- 일정
  planned_start     DATE,
  planned_end       DATE,
  actual_start      DATE,
  actual_end        DATE,
  
  -- 결과
  overall_result    TEXT CHECK (overall_result IN ('pass', 'fail', 'conditional', 'in_progress')),
  result_data       JSONB,                         -- 측정값 데이터
  result_notes      TEXT,

  assigned_to       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tp_cip ON cip_test_plans(cip_id);


-- ────────────────────────────────────────
-- CIP 확산 관리 (Rollout)
-- ────────────────────────────────────────
CREATE TABLE cip_rollouts (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cip_id            UUID NOT NULL REFERENCES cip_items(id),
  ccb_id            UUID REFERENCES ccb_documents(id),
  
  -- 확산 범위
  total_target      INT DEFAULT 0,                 -- 적용 가능 전체 설비 수
  completed         INT DEFAULT 0,                 -- 적용 완료 수
  
  -- 우선순위 티어
  tier              TEXT CHECK (tier IN ('1_safety','2_yield','3_reliability','4_cost')),
  
  -- BKM 등록
  bkm_registered    BOOLEAN DEFAULT FALSE,
  bkm_no            TEXT,
  ecn_no            TEXT,                          -- ECN 번호
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ro_cip ON cip_rollouts(cip_id);


-- 개별 설비 확산 상태
CREATE TABLE cip_rollout_targets (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rollout_id        UUID NOT NULL REFERENCES cip_rollouts(id) ON DELETE CASCADE,
  equip_no          TEXT NOT NULL REFERENCES equipment(equip_no),
  
  status            TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','scheduled','in_progress','completed','skipped','not_applicable')),
  priority_score    NUMERIC,                       -- 시급도 점수
  
  assigned_to       TEXT,                          -- 담당 엔지니어
  scheduled_date    DATE,
  completed_date    DATE,
  notes             TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rt_rollout ON cip_rollout_targets(rollout_id);
CREATE INDEX idx_rt_equip ON cip_rollout_targets(equip_no);
CREATE INDEX idx_rt_status ON cip_rollout_targets(status);


-- ────────────────────────────────────────
-- SLA 정의
-- ────────────────────────────────────────
CREATE TABLE sla_definitions (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name              TEXT NOT NULL,                 -- 'Lab Response SLA'
  stage             TEXT NOT NULL,                 -- 적용 단계
  priority_code     TEXT,                          -- 우선순위별 다른 목표
  target_hours      INT NOT NULL,                  -- 목표 시간 (시)
  warning_pct       INT DEFAULT 75,                -- 경고 임계값 (%)
  critical_pct      INT DEFAULT 90,                -- 위험 임계값 (%)
  is_active         BOOLEAN DEFAULT TRUE
);


-- ────────────────────────────────────────
-- 알림 / 노티피케이션
-- ────────────────────────────────────────
CREATE TABLE notifications (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           TEXT NOT NULL,
  type              TEXT NOT NULL
    CHECK (type IN (
      'anomaly_detected',     -- 이상 감지
      'cip_assigned',         -- CIP 배정
      'stage_changed',        -- 단계 변경
      'sla_warning',          -- SLA 임박
      'sla_breach',           -- SLA 위반
      'lab_response',         -- 연구소 답변
      'test_result',          -- 테스트 결과
      'rollout_assigned',     -- 확산 배정
      'comment_added',        -- 코멘트 추가
      'escalation'            -- 에스컬레이션
    )),
  title             TEXT NOT NULL,
  body              TEXT,
  cip_id            UUID REFERENCES cip_items(id),
  link_url          TEXT,
  is_read           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created ON notifications(created_at);


-- ────────────────────────────────────────
-- 사용자
-- ────────────────────────────────────────
CREATE TABLE users (
  id                TEXT PRIMARY KEY,              -- SAP 사번 또는 Supabase Auth UID
  name              TEXT NOT NULL,
  email             TEXT,
  role              TEXT NOT NULL
    CHECK (role IN ('engineer', 'manager', 'admin')),
  country_code      TEXT,
  work_center_code  TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────
-- CSV 임포트 이력
-- ────────────────────────────────────────
CREATE TABLE import_logs (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tcode             TEXT NOT NULL,                 -- 'ZCSR0010', 'ZCSR0070D', etc.
  file_name         TEXT,
  row_count         INT,
  success_count     INT,
  error_count       INT,
  errors            JSONB,                         -- [{row, column, message}]
  status            TEXT DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  imported_by       TEXT,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);


-- ============================================================
-- PART 4: Materialized Views (이상감지 / 대시보드 집계)
-- ============================================================

-- ────────────────────────────────────────
-- MV1: 파트군별 월별 통계 (Phase A-1 핵심)
-- ────────────────────────────────────────
CREATE MATERIALIZED VIEW mv_monthly_part_stats AS
SELECT
  so.model_code,
  so.country_code,
  so.customer_line_code,
  so.module,
  so.chamber,
  so.defect_code,
  so.cause_code,
  pu.material_group_new AS part_group,
  DATE_TRUNC('month', so.work_start_date)::DATE AS month,
  
  -- Tier 1 지표
  COUNT(*)                                          AS call_count,
  COUNT(*) FILTER (WHERE so.rework = TRUE)          AS rework_count,
  ROUND(
    COUNT(*) FILTER (WHERE so.rework = TRUE)::NUMERIC 
    / NULLIF(COUNT(*), 0) * 100, 2
  )                                                 AS rework_rate,
  ROUND(AVG(so.total_working_time_min), 1)          AS avg_work_time_min,
  ROUND(STDDEV(so.total_working_time_min), 1)       AS stddev_work_time,
  COUNT(DISTINCT so.equip_no)                       AS affected_equip_count,
  COUNT(DISTINCT so.order_no)                       AS order_count
  
FROM service_orders so
LEFT JOIN part_usage pu ON so.order_no = pu.order_no
WHERE so.work_start_date IS NOT NULL
GROUP BY 1,2,3,4,5,6,7,8,9;

CREATE UNIQUE INDEX idx_mv_mps ON mv_monthly_part_stats(
  model_code, country_code, customer_line_code, 
  module, chamber, defect_code, cause_code, part_group, month
);


-- ────────────────────────────────────────
-- MV2: 장비별 월별 요약 (헬스스코어 기반)
-- ────────────────────────────────────────
CREATE MATERIALIZED VIEW mv_equipment_monthly_summary AS
SELECT
  so.equip_no,
  e.model_code,
  e.country_code,
  e.customer_line_code,
  DATE_TRUNC('month', so.work_start_date)::DATE AS month,
  
  COUNT(*)                                          AS total_calls,
  COUNT(*) FILTER (WHERE so.rework = TRUE)          AS rework_calls,
  ROUND(AVG(so.total_working_time_min), 1)          AS avg_work_time,
  COUNT(DISTINCT so.defect_code)                    AS unique_defect_codes,
  COUNT(DISTINCT so.cause_code)                     AS unique_cause_codes,
  STRING_AGG(DISTINCT so.module, ',' ORDER BY so.module) AS affected_modules

FROM service_orders so
JOIN equipment e ON so.equip_no = e.equip_no
WHERE so.work_start_date IS NOT NULL
GROUP BY 1,2,3,4,5;

CREATE UNIQUE INDEX idx_mv_ems ON mv_equipment_monthly_summary(equip_no, month);


-- ────────────────────────────────────────
-- MV3: CIP 대시보드 요약
-- ────────────────────────────────────────
CREATE MATERIALIZED VIEW mv_cip_dashboard AS
SELECT
  stage,
  journey_type,
  action_priority,
  model_code,
  country_code,
  COUNT(*)                                          AS item_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::INT AS avg_age_days,
  COUNT(*) FILTER (WHERE action_priority = 'HIGH')  AS high_priority_count

FROM cip_items
WHERE stage NOT IN ('completed', 'cancelled')
GROUP BY 1,2,3,4,5;


-- ────────────────────────────────────────
-- Refresh 함수 (CSV 임포트 후 호출)
-- ────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_part_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_equipment_monthly_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cip_dashboard;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- PART 5: Row Level Security (RLS)
-- ============================================================

ALTER TABLE cip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 예시: 모든 인증 사용자가 CIP 읽기 가능
CREATE POLICY "cip_read_all" ON cip_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- 예시: 본인 알림만 조회
CREATE POLICY "notif_own" ON notifications
  FOR SELECT USING (user_id = auth.uid()::TEXT);


-- ============================================================
-- PART 6: updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equipment_updated
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cip_updated
  BEFORE UPDATE ON cip_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ccb_updated
  BEFORE UPDATE ON ccb_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rollout_updated
  BEFORE UPDATE ON cip_rollouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();