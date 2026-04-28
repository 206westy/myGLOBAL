-- 20260427000003_strategy_v31_english_text.sql
-- Replace generated text in screening recommendation function and v_action_queue view
-- to English (per user request — global standard terminology).

-- 1) English version of recommendation generator
create or replace function generate_screening_recommendation(p_screening_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  v_row screening_results%rowtype;
  v_hint_count int;
  v_affected_ratio numeric;
  v_action text;
  v_reason_parts text[] := array[]::text[];
  v_confidence numeric;
begin
  select * into v_row from screening_results where id = p_screening_id;
  if not found then return null; end if;

  select count(*) into v_hint_count from screening_hints where screening_result_id = p_screening_id;

  v_affected_ratio := case
    when coalesce(v_row.total_equip_count, 0) > 0
      then round(100.0 * v_row.affected_equip_count::numeric / v_row.total_equip_count, 0)
    else 0 end;

  v_action := case
    when v_row.status = 'alert' and coalesce(v_row.cusum_value, 0) > coalesce(v_row.cusum_ucl, 0)
      then 'create_cip'
    when v_row.status = 'alert' then 'create_cip'
    when v_row.status = 'watch' and coalesce(v_row.trend_p_value, 1) < 0.05
      then 'create_cip'
    when v_row.status = 'watch' then 'keep_watch'
    else 'dismiss'
  end;

  if v_row.cusum_value is not null and v_row.cusum_ucl is not null
     and v_row.cusum_value > v_row.cusum_ucl then
    v_reason_parts := array_append(v_reason_parts,
      format('CUSUM exceeded UCL (%s / limit %s)',
        round(v_row.cusum_value, 1)::text,
        round(v_row.cusum_ucl, 1)::text));
  end if;

  if v_affected_ratio >= 30 then
    v_reason_parts := array_append(v_reason_parts,
      format('%s%% equipment affected (%s/%s)',
        v_affected_ratio::text,
        v_row.affected_equip_count::text,
        v_row.total_equip_count::text));
  end if;

  if v_hint_count > 0 then
    v_reason_parts := array_append(v_reason_parts,
      format('%s qualitative hint%s',
        v_hint_count::text,
        case when v_hint_count > 1 then 's' else '' end));
  end if;

  if v_row.trend_slope is not null and v_row.trend_slope > 0
     and coalesce(v_row.trend_p_value, 1) < 0.1 then
    v_reason_parts := array_append(v_reason_parts,
      format('Significant upward trend (slope=%s, p=%s)',
        round(v_row.trend_slope, 2)::text,
        round(v_row.trend_p_value, 3)::text));
  end if;

  v_confidence := least(1.0, 0.3
    + case when coalesce(v_row.cusum_value, 0) > coalesce(v_row.cusum_ucl, 0) then 0.3 else 0.0 end
    + case when v_affected_ratio >= 30 then 0.2 else 0.0 end
    + case when v_hint_count > 0 then 0.1 else 0.0 end
    + case when coalesce(v_row.trend_p_value, 1) < 0.05 then 0.1 else 0.0 end);

  return jsonb_build_object(
    'recommended_action', v_action,
    'reason', case when array_length(v_reason_parts, 1) is null
                   then 'Insufficient data'
                   else array_to_string(v_reason_parts, ', ') end,
    'confidence', v_confidence,
    'generated_by', 'rule_v1',
    'generated_at', now()
  );
end;
$$;

-- 2) Re-fill all rows so existing Korean reasons get replaced
update screening_results
set ai_recommendation = generate_screening_recommendation(id);

-- 3) Replace v_action_queue with English title/context_line
create or replace view v_action_queue as
select
  'screening:' || sr.id::text                       as card_id,
  'detect'::text                                    as tab,
  case when sr.status = 'alert' then 'STEP_01'
       else 'STEP_02' end                            as step,
  case when sr.status = 'alert' then 'HIGH'
       when coalesce(sr.cusum_value, 0) > coalesce(sr.cusum_ucl, 0) then 'HIGH'
       else 'MEDIUM' end                             as priority,
  case when sr.status = 'alert' then 'URGENT'
       when sr.status = 'watch' and coalesce(sr.trend_p_value, 1) < 0.1 then 'NORMAL'
       else 'REFERENCE' end                          as urgency_group,
  null::text                                         as cip_no,
  sr.id                                              as source_id,
  format('Model %s / Line %s — %s calls',
    sr.model_code, sr.customer_line_code, sr.call_count) as title,
  format('Part %s · %s/%s equipment affected',
    coalesce(sr.part_group_code, 'N/A'),
    coalesce(sr.affected_equip_count, 0)::text,
    coalesce(sr.total_equip_count, 0)::text)         as context_line,
  sr.ai_recommendation                               as ai_recommendation,
  sr.created_at                                      as created_at,
  null::timestamptz                                  as sla_deadline,
  jsonb_build_object('year_month', sr.year_month,
                     'model_code', sr.model_code,
                     'customer_line_code', sr.customer_line_code,
                     'part_group_code', sr.part_group_code,
                     'screening_status', sr.status,
                     'call_count', sr.call_count,
                     'cusum_value', sr.cusum_value,
                     'cusum_ucl', sr.cusum_ucl)      as meta
from screening_results sr
where sr.status in ('alert', 'watch')
  and not exists (
    select 1 from cip_items ci where ci.screening_result_id = sr.id
  )

union all

select
  'cip:' || ci.id::text                              as card_id,
  case
    when ci.stage in ('registered', 'investigating') then 'investigate'
    when ci.stage in ('searching_solution', 'developing_solution') then 'solve'
    when ci.stage in ('lab_transferred', 'lab_responded') then 'develop'
    when ci.stage in ('testing', 'verifying') then 'validate'
    when ci.stage in ('rolling_out', 'completed') then 'deploy'
    else 'detect'
  end                                                as tab,
  ('STEP_' || lpad(
    case ci.stage
      when 'registered' then '02' when 'investigating' then '03'
      when 'searching_solution' then '04' when 'developing_solution' then '05'
      when 'lab_transferred' then '06' when 'lab_responded' then '07'
      when 'testing' then '08' when 'verifying' then '09'
      when 'rolling_out' then '10' when 'completed' then '10'
      else '00' end, 2, '0'))                        as step,
  coalesce(ci.action_priority, 'MEDIUM')             as priority,
  case
    when ci.sla_deadline is not null and ci.sla_deadline < now() then 'URGENT'
    when ci.sla_deadline is not null and ci.sla_deadline < now() + interval '3 days' then 'URGENT'
    when ci.action_priority = 'HIGH' then 'URGENT'
    when ci.stage in ('completed', 'cancelled') then 'REFERENCE'
    else 'NORMAL'
  end                                                as urgency_group,
  ci.cip_no                                          as cip_no,
  ci.id                                              as source_id,
  coalesce(ci.title, ci.cip_no)                      as title,
  format('Model %s · Line %s',
    coalesce(ci.model_code, '?'),
    coalesce(ci.customer_line_code, '?'))            as context_line,
  ci.ai_recommendation                               as ai_recommendation,
  ci.created_at                                      as created_at,
  ci.sla_deadline                                    as sla_deadline,
  jsonb_build_object('stage', ci.stage,
                     'journey_type', ci.journey_type,
                     'assigned_engineer', ci.assigned_engineer,
                     'assigned_manager', ci.assigned_manager,
                     'equip_no', ci.equip_no,
                     'model_code', ci.model_code,
                     'customer_line_code', ci.customer_line_code,
                     'part_group_code', ci.target_part_group) as meta
from cip_items ci
where ci.stage not in ('cancelled');
