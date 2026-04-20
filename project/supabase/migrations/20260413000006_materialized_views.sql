-- ============================================================
-- Migration 006: Materialized Views
-- ============================================================

-- MV1: 파트군별 월별 통계
create materialized view mv_monthly_part_stats as
select
  so.model_code,
  so.country_code,
  so.customer_line_code,
  so.module,
  so.chamber,
  so.defect_code,
  so.cause_code,
  pu.material_group_new as part_group,
  date_trunc('month', so.work_start_date)::date as month,

  count(*)                                          as call_count,
  count(*) filter (where so.rework = true)          as rework_count,
  round(
    count(*) filter (where so.rework = true)::numeric
    / nullif(count(*), 0) * 100, 2
  )                                                 as rework_rate,
  round(avg(so.total_working_time_min), 1)          as avg_work_time_min,
  round(stddev(so.total_working_time_min), 1)       as stddev_work_time,
  count(distinct so.equip_no)                       as affected_equip_count,
  count(distinct so.order_no)                       as order_count

from service_orders so
left join part_usage pu on so.order_no = pu.order_no
where so.work_start_date is not null
group by 1,2,3,4,5,6,7,8,9;

create unique index idx_mv_mps on mv_monthly_part_stats(
  coalesce(model_code,''), coalesce(country_code,''),
  coalesce(customer_line_code,''), coalesce(module,''),
  coalesce(chamber,''), coalesce(defect_code,''),
  coalesce(cause_code,''), coalesce(part_group,''),
  coalesce(month, '1970-01-01'::date)
);


-- MV2: 장비별 월별 요약
create materialized view mv_equipment_monthly_summary as
select
  so.equip_no,
  e.model_code,
  e.country_code,
  e.customer_line_code,
  date_trunc('month', so.work_start_date)::date as month,

  count(*)                                          as total_calls,
  count(*) filter (where so.rework = true)          as rework_calls,
  round(avg(so.total_working_time_min), 1)          as avg_work_time,
  count(distinct so.defect_code)                    as unique_defect_codes,
  count(distinct so.cause_code)                     as unique_cause_codes,
  string_agg(distinct so.module, ',' order by so.module) as affected_modules

from service_orders so
join equipment e on so.equip_no = e.equip_no
where so.work_start_date is not null
group by 1,2,3,4,5;

create unique index idx_mv_ems on mv_equipment_monthly_summary(equip_no, month);


-- MV3: CIP 대시보드 요약 (PRD 개선 1-5: UNIQUE 인덱스 추가)
create materialized view mv_cip_dashboard as
select
  stage,
  journey_type,
  action_priority,
  model_code,
  country_code,
  count(*)                                          as item_count,
  avg(extract(epoch from (now() - created_at)) / 86400)::int as avg_age_days,
  count(*) filter (where action_priority = 'HIGH')  as high_priority_count

from cip_items
where stage not in ('completed', 'cancelled')
group by 1,2,3,4,5;

create unique index idx_mv_cd on mv_cip_dashboard(
  coalesce(stage,''), coalesce(journey_type,''),
  coalesce(action_priority,''), coalesce(model_code,''),
  coalesce(country_code,'')
);
