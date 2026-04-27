-- 20260427000002_strategy_v31_workflow.sql
-- Strategy v3.1: 6탭 강제 워크플로우 + 액션 큐 구조 지원
-- - cip_items / screening_results에 ai_recommendation, sla_deadline 컬럼 추가
-- - 룰 기반 권고 생성 함수 (Detect 탭 전용)
-- - v_action_queue / v_action_queue_counts view (6탭 통합 큐)

-- 1) cip_items: AI 권고와 SLA 마감 컬럼 추가
alter table cip_items
  add column if not exists ai_recommendation jsonb,
  add column if not exists sla_deadline timestamptz;

comment on column cip_items.ai_recommendation is
  'AI/룰 기반 결정 권고. 예: {"recommended_action":"create_cip","reason":"영향 설비 43% (18/42), CUSUM UCL 돌파","confidence":0.87,"generated_by":"rule_v1","generated_at":"..."}';
comment on column cip_items.sla_deadline is
  'SLA 임박 표시용 마감 시각. NULL이면 SLA 미적용.';

create index if not exists idx_cip_items_sla_deadline
  on cip_items(sla_deadline) where sla_deadline is not null;

-- 2) screening_results: AI 권고 컬럼 (Detect 탭 카드는 cip_items가 아닌 screening_results 기반)
alter table screening_results
  add column if not exists ai_recommendation jsonb;

comment on column screening_results.ai_recommendation is
  'Detect 탭 권고 1줄. screening_results는 cip로 승격 전 단계라 별도 컬럼 사용.';

-- 3) 룰 기반 권고 생성 함수 (Detect 전용)
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

  -- 힌트 개수
  select count(*) into v_hint_count from screening_hints where screening_result_id = p_screening_id;

  -- 영향 설비 비율
  v_affected_ratio := case
    when coalesce(v_row.total_equip_count, 0) > 0
      then round(100.0 * v_row.affected_equip_count::numeric / v_row.total_equip_count, 0)
    else 0 end;

  -- 액션 결정
  v_action := case
    when v_row.status = 'alert' and v_row.cusum_value > coalesce(v_row.cusum_ucl, 0)
      then 'create_cip'
    when v_row.status = 'alert' then 'create_cip'
    when v_row.status = 'watch' and coalesce(v_row.trend_p_value, 1) < 0.05
      then 'create_cip'
    when v_row.status = 'watch' then 'keep_watch'
    else 'dismiss'
  end;

  -- 사유 조립
  if v_row.cusum_value is not null and v_row.cusum_ucl is not null
     and v_row.cusum_value > v_row.cusum_ucl then
    v_reason_parts := array_append(v_reason_parts,
      format('CUSUM UCL 돌파(%s / 한계 %s)',
        round(v_row.cusum_value, 1)::text,
        round(v_row.cusum_ucl, 1)::text));
  end if;

  if v_affected_ratio >= 30 then
    v_reason_parts := array_append(v_reason_parts,
      format('영향 설비 %s%% (%s/%s)',
        v_affected_ratio::text,
        v_row.affected_equip_count::text,
        v_row.total_equip_count::text));
  end if;

  if v_hint_count > 0 then
    v_reason_parts := array_append(v_reason_parts,
      format('정성 힌트 %s건', v_hint_count::text));
  end if;

  if v_row.trend_slope is not null and v_row.trend_slope > 0
     and coalesce(v_row.trend_p_value, 1) < 0.1 then
    v_reason_parts := array_append(v_reason_parts,
      format('상향 트렌드 유의(slope=%s, p=%s)',
        round(v_row.trend_slope, 2)::text,
        round(v_row.trend_p_value, 3)::text));
  end if;

  -- 신뢰도 (단순 가중)
  v_confidence := least(1.0, 0.3
    + case when coalesce(v_row.cusum_value, 0) > coalesce(v_row.cusum_ucl, 0) then 0.3 else 0.0 end
    + case when v_affected_ratio >= 30 then 0.2 else 0.0 end
    + case when v_hint_count > 0 then 0.1 else 0.0 end
    + case when coalesce(v_row.trend_p_value, 1) < 0.05 then 0.1 else 0.0 end);

  return jsonb_build_object(
    'recommended_action', v_action,
    'reason', case when array_length(v_reason_parts, 1) is null
                   then '추가 데이터 필요'
                   else array_to_string(v_reason_parts, ', ') end,
    'confidence', v_confidence,
    'generated_by', 'rule_v1',
    'generated_at', now()
  );
end;
$$;

-- 4) 모든 screening_results에 권고 채우기 (idempotent)
update screening_results
set ai_recommendation = generate_screening_recommendation(id)
where ai_recommendation is null;

-- 5) 신규 row 자동 권고 트리거
create or replace function trg_screening_results_ai_recommendation()
returns trigger language plpgsql as $$
begin
  if new.ai_recommendation is null then
    new.ai_recommendation := generate_screening_recommendation(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists set_ai_recommendation on screening_results;
create trigger set_ai_recommendation
  before insert on screening_results
  for each row execute function trg_screening_results_ai_recommendation();

-- 6) Action Queue 통합 view: cip_items + screening_results 한 번에 조회
create or replace view v_action_queue as
-- Detect 탭: screening_results의 alert/watch 중 아직 cip로 승격되지 않은 것
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
  format('%s / %s 호출 %s건', sr.model_code, sr.customer_line_code, sr.call_count) as title,
  format('%s · 영향 설비 %s/%s',
    coalesce(sr.part_group_code, '미분류'),
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

-- Investigate~Deploy 탭: cip_items
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
  format('%s · %s',
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

comment on view v_action_queue is
  '6탭 통합 액션 큐. Detect는 screening_results, 나머지는 cip_items에서 도출.';

-- 7) 큐 카운트 집계 view (탭 헤더 배지용)
create or replace view v_action_queue_counts as
select
  tab,
  count(*) filter (where urgency_group = 'URGENT') as urgent_count,
  count(*) filter (where urgency_group = 'NORMAL') as normal_count,
  count(*) filter (where urgency_group = 'REFERENCE') as reference_count,
  count(*) as total_count,
  bool_or(urgency_group = 'URGENT') as has_urgent
from v_action_queue
group by tab;

comment on view v_action_queue_counts is
  '탭 헤더 배지(카드 수) + 빨간 점(has_urgent) 표시용.';
