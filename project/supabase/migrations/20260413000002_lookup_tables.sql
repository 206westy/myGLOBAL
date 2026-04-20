-- ============================================================
-- Migration 002: Lookup / Code Tables (SAP 코드 체계)
-- ============================================================

-- 국가
create table lu_countries (
  code        text primary key,
  name_ko     text not null,
  name_en     text
);

-- 비즈니스 타입
create table lu_business_types (
  code        text primary key,
  name        text not null
);

-- 플랫폼
create table lu_platforms (
  code        text primary key,
  name        text not null
);

-- 세그먼트
create table lu_segments (
  code        text primary key,
  name        text not null
);

-- 모델
create table lu_models (
  code        text primary key,
  name        text not null,
  segment_code text references lu_segments(code),
  platform_code text references lu_platforms(code)
);

-- 고객사
create table lu_customers (
  code        text primary key,
  name        text not null,
  country_code text references lu_countries(code)
);

-- 고객사 라인
create table lu_customer_lines (
  code        text primary key,
  name        text not null,
  customer_code text references lu_customers(code) not null
);

-- 워크센터
create table lu_work_centers (
  code        text primary key,
  name        text not null,
  plant       text
);

-- Defect 코드
create table lu_defect_codes (
  code        text primary key,
  name        text not null
);

-- Cause 코드
create table lu_cause_codes (
  code        text primary key,
  name        text not null
);

-- 작업 유형 (Act Type)
create table lu_act_types (
  code        text primary key,
  name        text not null
);

-- 비용 유형 (Cost Type)
create table lu_cost_types (
  code        text primary key,
  name        text not null
);

-- 워런티
create table lu_warranty_codes (
  code        text primary key,
  name        text not null
);

-- 우선순위
create table lu_priorities (
  code        text primary key,
  name        text not null
);

-- Damage 코드 (파트 사용 이력)
create table lu_damage_codes (
  group_code  text,
  code        text primary key,
  name        text not null
);

-- Activity 코드 (파트 사용 이력)
create table lu_activity_codes (
  group_code  text,
  code        text primary key,
  name        text not null
);

-- Material Group (파트 그룹)
create table lu_material_groups (
  code        text primary key,
  name        text not null
);

-- 태스크 표준 텍스트 (Standard Text Key)
create table lu_task_codes (
  code        text primary key,
  name        text not null
);

-- W/O 구분
create table lu_wo_types (
  code        text primary key,
  name        text not null
);

-- 오더 타입
create table lu_order_types (
  code        text primary key,
  name        text not null
);

-- 세일즈 모드
create table lu_sales_modes (
  code        text primary key,
  name        text not null
);
