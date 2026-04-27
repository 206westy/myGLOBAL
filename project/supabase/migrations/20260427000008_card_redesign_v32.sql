-- 20260427000008_card_redesign_v32.sql
-- PRD v3.2 P0: lookup names in v_action_queue + service_orders-based 12-month evidence + timeline RPC

-- 1) v_action_queue with lookup JOINs
create or replace view v_action_queue as
select
  'screening:' || sr.id::text as card_id,
  'detect'::text as tab,
  case when sr.status = 'alert' then 'STEP_01' else 'STEP_02' end as step,
  case when sr.status = 'alert' then 'HIGH'
       when coalesce(sr.cusum_value, 0) > coalesce(sr.cusum_ucl, 0) then 'HIGH'
       else 'MEDIUM' end as priority,
  case when sr.status = 'alert' then 'URGENT'
       when sr.status = 'watch' and coalesce(sr.trend_p_value, 1) < 0.1 then 'NORMAL'
       else 'REFERENCE' end as urgency_group,
  null::text as cip_no,
  sr.id as source_id,
  format('%s · %s · %s',
    coalesce(lu_m.name, sr.model_code),
    coalesce(b.customer_line_name, sr.customer_line_code),
    coalesce(lu_pg.name, sr.part_group_code)) as title,
  format('%s calls · %s/%s equipment affected',
    sr.call_count::text,
    coalesce(sr.affected_equip_count, 0)::text,
    coalesce(sr.total_equip_count, 0)::text) as context_line,
  sr.ai_recommendation,
  sr.created_at,
  null::timestamptz as sla_deadline,
  jsonb_build_object(
    'year_month', sr.year_month,
    'model_code', sr.model_code, 'model_name', lu_m.name,
    'customer_line_code', sr.customer_line_code, 'customer_line_name', b.customer_line_name,
    'part_group_code', sr.part_group_code, 'part_group_name', lu_pg.name,
    'screening_status', sr.status,
    'call_count', sr.call_count,
    'cusum_value', sr.cusum_value, 'cusum_ucl', sr.cusum_ucl,
    'trend_slope', sr.trend_slope, 'trend_p_value', sr.trend_p_value,
    'affected_equip_count', sr.affected_equip_count,
    'total_equip_count', sr.total_equip_count) as meta
from screening_results sr
left join lu_models lu_m on sr.model_code = lu_m.code
left join branches b on sr.customer_line_code = b.customer_line_code
left join lu_part_groups lu_pg on sr.part_group_code = lu_pg.code
where sr.status in ('alert', 'watch')
  and not exists (select 1 from cip_items ci where ci.screening_result_id = sr.id)

union all

select
  'cip:' || ci.id::text as card_id,
  case
    when ci.stage in ('registered', 'investigating') then 'investigate'
    when ci.stage in ('searching_solution', 'developing_solution') then 'solve'
    when ci.stage in ('lab_transferred', 'lab_responded') then 'develop'
    when ci.stage in ('testing', 'verifying') then 'validate'
    when ci.stage in ('rolling_out', 'completed') then 'deploy'
    else 'detect'
  end as tab,
  ('STEP_' || lpad(case ci.stage
    when 'registered' then '02' when 'investigating' then '03'
    when 'searching_solution' then '04' when 'developing_solution' then '05'
    when 'lab_transferred' then '06' when 'lab_responded' then '07'
    when 'testing' then '08' when 'verifying' then '09'
    when 'rolling_out' then '10' when 'completed' then '10'
    else '00' end, 2, '0')) as step,
  coalesce(ci.action_priority, 'MEDIUM') as priority,
  case
    when ci.sla_deadline is not null and ci.sla_deadline < now() then 'URGENT'
    when ci.sla_deadline is not null and ci.sla_deadline < now() + interval '3 days' then 'URGENT'
    when ci.action_priority = 'HIGH' then 'URGENT'
    when ci.stage in ('completed', 'cancelled') then 'REFERENCE'
    else 'NORMAL'
  end as urgency_group,
  ci.cip_no,
  ci.id as source_id,
  coalesce(
    nullif(ci.title, ''),
    format('%s · %s · %s',
      coalesce(lu_m.name, ci.model_code, '?'),
      coalesce(b.customer_line_name, ci.customer_line_code, '?'),
      coalesce(lu_pg.name, ci.target_part_group, '?'))) as title,
  format('%s · %s',
    coalesce(lu_m.name, ci.model_code, '?'),
    coalesce(b.customer_line_name, ci.customer_line_code, '?')) as context_line,
  ci.ai_recommendation,
  ci.created_at,
  ci.sla_deadline,
  jsonb_build_object(
    'stage', ci.stage,
    'journey_type', ci.journey_type,
    'assigned_engineer', ci.assigned_engineer,
    'assigned_manager', ci.assigned_manager,
    'equip_no', ci.equip_no,
    'model_code', ci.model_code, 'model_name', lu_m.name,
    'customer_line_code', ci.customer_line_code, 'customer_line_name', b.customer_line_name,
    'part_group_code', ci.target_part_group, 'part_group_name', lu_pg.name,
    'symptom', ci.symptom) as meta
from cip_items ci
left join lu_models lu_m on ci.model_code = lu_m.code
left join branches b on ci.customer_line_code = b.customer_line_code
left join lu_part_groups lu_pg on ci.target_part_group = lu_pg.code
where ci.stage not in ('cancelled');

comment on view v_action_queue is
  'Unified action queue. PRD v3.2: title shows lookup names; context_line shows metrics only.';

-- 2) 12-month evidence RPC (service_orders based)
create or replace function get_evidence_12month(
  p_model_code text,
  p_customer_line_code text,
  p_part_group_code text
) returns table (
  year_month text,
  call_count bigint,
  rework_count bigint,
  cumulative_work_min bigint,
  is_current boolean
)
language sql stable as $$
  with months as (
    select to_char(date_trunc('month', now()) - (n || ' month')::interval, 'YYYYMM') as ym,
           n = 0 as is_current
    from generate_series(0, 11) as n
  ),
  agg as (
    select
      to_char(so.work_start_date, 'YYYYMM') as ym,
      count(*) as call_count,
      count(*) filter (where so.rework = true) as rework_count,
      coalesce(sum(so.total_working_time_min), 0) as cumulative_work_min
    from service_orders so
    where so.model_code = p_model_code
      and so.customer_line_code = p_customer_line_code
      and so.part_group_code = p_part_group_code
      and so.work_start_date >= date_trunc('month', now()) - interval '11 months'
    group by to_char(so.work_start_date, 'YYYYMM')
  )
  select
    m.ym, coalesce(a.call_count, 0), coalesce(a.rework_count, 0),
    coalesce(a.cumulative_work_min, 0), m.is_current
  from months m
  left join agg a on a.ym = m.ym
  order by m.ym;
$$;

comment on function get_evidence_12month(text, text, text) is
  '12-month call/rework/work-time series for (model, line, part_group). Always 12 rows (zeros for empty months).';

-- 3) Activity timeline RPC: stage_history + comments union
create or replace function get_cip_timeline(p_cip_id uuid)
returns table (
  ts timestamptz, kind text, actor text, payload jsonb
)
language sql stable as $$
  select
    h.changed_at as ts, 'stage'::text as kind,
    coalesce(h.changed_by, 'system') as actor,
    jsonb_build_object('from_stage', h.from_stage, 'to_stage', h.to_stage, 'reason', h.reason) as payload
  from cip_stage_history h where h.cip_id = p_cip_id
  union all
  select
    c.created_at as ts,
    case when c.comment_type = 'system' then 'system' else 'comment' end as kind,
    coalesce(c.created_by, 'system') as actor,
    jsonb_build_object('content', c.content, 'comment_type', c.comment_type) as payload
  from cip_comments c where c.cip_id = p_cip_id
  order by ts desc;
$$;

comment on function get_cip_timeline(uuid) is
  'Unified Activity timeline (PRD v3.2 §8): stage_history + comments, newest first.';

-- 4) Indexes for fast timeline + comment queries
create index if not exists idx_cip_comments_cip on cip_comments(cip_id, created_at desc);
create index if not exists idx_cip_stage_history_cip on cip_stage_history(cip_id, changed_at desc);
