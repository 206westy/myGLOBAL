-- ============================================================
-- Migration 007: Functions & Triggers
-- ============================================================

-- updated_at 자동 갱신
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_equipment_updated
  before update on equipment
  for each row execute function update_updated_at();

create trigger trg_service_orders_updated
  before update on service_orders
  for each row execute function update_updated_at();

create trigger trg_service_tasks_updated
  before update on service_tasks
  for each row execute function update_updated_at();

create trigger trg_cip_updated
  before update on cip_items
  for each row execute function update_updated_at();

create trigger trg_ccb_updated
  before update on ccb_documents
  for each row execute function update_updated_at();

create trigger trg_rollout_updated
  before update on cip_rollouts
  for each row execute function update_updated_at();


-- CIP 번호 자동 생성
create or replace function generate_cip_no()
returns trigger as $$
declare
  yr text;
  seq int;
begin
  yr := to_char(now(), 'YYYY');
  select coalesce(max(
    cast(split_part(cip_no, '-', 3) as int)
  ), 0) + 1 into seq
  from cip_items
  where cip_no like 'CIP-' || yr || '-%';

  new.cip_no := 'CIP-' || yr || '-' || lpad(seq::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_cip_no
  before insert on cip_items
  for each row
  when (new.cip_no is null)
  execute function generate_cip_no();


-- MV 리프레시 함수
create or replace function refresh_all_materialized_views()
returns void as $$
begin
  refresh materialized view concurrently mv_monthly_part_stats;
  refresh materialized view concurrently mv_equipment_monthly_summary;
  refresh materialized view concurrently mv_cip_dashboard;
end;
$$ language plpgsql;


-- ============================================================
-- Bulk Upsert RPC Functions (unnest 기반, batch insert best practice)
-- ============================================================

-- 룩업 테이블 upsert (범용)
create or replace function upsert_lookup_batch(
  p_table text,
  p_rows jsonb
) returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    begin
      execute format(
        'insert into %I (code, name) values ($1, $2) on conflict (code) do update set name = excluded.name',
        p_table
      ) using row_data->>'code', row_data->>'name';
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('code', row_data->>'code', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- 룩업 테이블 upsert (3컬럼: group_code 포함)
create or replace function upsert_lookup_with_group_batch(
  p_table text,
  p_rows jsonb
) returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    begin
      execute format(
        'insert into %I (code, name, group_code) values ($1, $2, $3) on conflict (code) do update set name = excluded.name, group_code = excluded.group_code',
        p_table
      ) using row_data->>'code', row_data->>'name', row_data->>'group_code';
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('code', row_data->>'code', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- 룩업 테이블 upsert (lu_models: 4컬럼)
create or replace function upsert_lookup_models_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    begin
      insert into lu_models (code, name, segment_code, platform_code)
      values (
        row_data->>'code', row_data->>'name',
        nullif(row_data->>'segment_code',''),
        nullif(row_data->>'platform_code','')
      )
      on conflict (code) do update set
        name = excluded.name,
        segment_code = coalesce(excluded.segment_code, lu_models.segment_code),
        platform_code = coalesce(excluded.platform_code, lu_models.platform_code);
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('code', row_data->>'code', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- 룩업 테이블 upsert (lu_customers: country_code 포함)
create or replace function upsert_lookup_customers_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    begin
      insert into lu_customers (code, name, country_code)
      values (row_data->>'code', row_data->>'name', nullif(row_data->>'country_code',''))
      on conflict (code) do update set
        name = excluded.name,
        country_code = coalesce(excluded.country_code, lu_customers.country_code);
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('code', row_data->>'code', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- 룩업 테이블 upsert (lu_customer_lines: customer_code 포함)
create or replace function upsert_lookup_customer_lines_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    begin
      insert into lu_customer_lines (code, name, customer_code)
      values (row_data->>'code', row_data->>'name', row_data->>'customer_code')
      on conflict (code) do update set
        name = excluded.name,
        customer_code = coalesce(excluded.customer_code, lu_customer_lines.customer_code);
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('code', row_data->>'code', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- 룩업 테이블 upsert (lu_work_centers: plant 포함)
create or replace function upsert_lookup_work_centers_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    begin
      insert into lu_work_centers (code, name, plant)
      values (row_data->>'code', row_data->>'name', nullif(row_data->>'plant',''))
      on conflict (code) do update set
        name = excluded.name,
        plant = coalesce(excluded.plant, lu_work_centers.plant);
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('code', row_data->>'code', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- 룩업 테이블 upsert (lu_countries: name_ko, name_en)
create or replace function upsert_lookup_countries_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    begin
      insert into lu_countries (code, name_ko, name_en)
      values (row_data->>'code', row_data->>'name_ko', nullif(row_data->>'name_en',''))
      on conflict (code) do update set
        name_ko = excluded.name_ko,
        name_en = coalesce(excluded.name_en, lu_countries.name_en);
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('code', row_data->>'code', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- Equipment bulk upsert
create or replace function upsert_equipment_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
  row_idx int := 0;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    row_idx := row_idx + 1;
    begin
      insert into equipment (
        equip_no, sap_equip_no, upper_equip_no, fsc, as_bom, manu_serial, wo, equip_id,
        plant, work_center_code, country_code, customer_code, customer_line_code,
        business_type_code, platform_code, segment_code, model_code,
        shipping_date, fab_in_date, sign_off_date, warranty_start, warranty_end, created_on,
        wo_type_code, wo_type_name, sales_mode_code, wo_category_code, wo_category_name,
        lp_load_port, efem_robot, tm_robot, ctc_sw_code, ctc_sw, efem_sw_code, efem_sw,
        remark1, remark2, remark3, maint_yn, current_customer, current_customer_name,
        stand_alone, status
      ) values (
        row_data->>'equip_no', row_data->>'sap_equip_no', row_data->>'upper_equip_no',
        row_data->>'fsc', (row_data->>'as_bom')::boolean, row_data->>'manu_serial',
        row_data->>'wo', row_data->>'equip_id',
        row_data->>'plant', nullif(row_data->>'work_center_code',''),
        nullif(row_data->>'country_code',''), nullif(row_data->>'customer_code',''),
        nullif(row_data->>'customer_line_code',''), nullif(row_data->>'business_type_code',''),
        nullif(row_data->>'platform_code',''), nullif(row_data->>'segment_code',''),
        nullif(row_data->>'model_code',''),
        nullif(row_data->>'shipping_date','')::date,
        nullif(row_data->>'fab_in_date','')::date,
        nullif(row_data->>'sign_off_date','')::date,
        nullif(row_data->>'warranty_start','')::date,
        nullif(row_data->>'warranty_end','')::date,
        nullif(row_data->>'created_on','')::date,
        row_data->>'wo_type_code', row_data->>'wo_type_name',
        nullif(row_data->>'sales_mode_code',''),
        row_data->>'wo_category_code', row_data->>'wo_category_name',
        row_data->>'lp_load_port', row_data->>'efem_robot', row_data->>'tm_robot',
        row_data->>'ctc_sw_code', row_data->>'ctc_sw', row_data->>'efem_sw_code', row_data->>'efem_sw',
        row_data->>'remark1', row_data->>'remark2', row_data->>'remark3',
        (row_data->>'maint_yn')::boolean, row_data->>'current_customer',
        row_data->>'current_customer_name', row_data->>'stand_alone',
        row_data->>'status'
      )
      on conflict (equip_no) do update set
        sap_equip_no = excluded.sap_equip_no,
        upper_equip_no = excluded.upper_equip_no,
        fsc = excluded.fsc,
        as_bom = excluded.as_bom,
        manu_serial = excluded.manu_serial,
        wo = excluded.wo,
        equip_id = excluded.equip_id,
        plant = excluded.plant,
        work_center_code = excluded.work_center_code,
        country_code = excluded.country_code,
        customer_code = excluded.customer_code,
        customer_line_code = excluded.customer_line_code,
        business_type_code = excluded.business_type_code,
        platform_code = excluded.platform_code,
        segment_code = excluded.segment_code,
        model_code = excluded.model_code,
        shipping_date = excluded.shipping_date,
        fab_in_date = excluded.fab_in_date,
        sign_off_date = excluded.sign_off_date,
        warranty_start = excluded.warranty_start,
        warranty_end = excluded.warranty_end,
        created_on = excluded.created_on,
        wo_type_code = excluded.wo_type_code,
        wo_type_name = excluded.wo_type_name,
        sales_mode_code = excluded.sales_mode_code,
        wo_category_code = excluded.wo_category_code,
        wo_category_name = excluded.wo_category_name,
        lp_load_port = excluded.lp_load_port,
        efem_robot = excluded.efem_robot,
        tm_robot = excluded.tm_robot,
        ctc_sw_code = excluded.ctc_sw_code,
        ctc_sw = excluded.ctc_sw,
        efem_sw_code = excluded.efem_sw_code,
        efem_sw = excluded.efem_sw,
        remark1 = excluded.remark1,
        remark2 = excluded.remark2,
        remark3 = excluded.remark3,
        maint_yn = excluded.maint_yn,
        current_customer = excluded.current_customer,
        current_customer_name = excluded.current_customer_name,
        stand_alone = excluded.stand_alone,
        status = excluded.status;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'equip_no', row_data->>'equip_no', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- Service Orders bulk upsert
create or replace function upsert_service_orders_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
  row_idx int := 0;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    row_idx := row_idx + 1;
    begin
      insert into service_orders (
        order_no, order_status_code, order_status_name, order_type_code, order_type_name, order_title,
        equip_no, sap_equip_no, wo, equip_id,
        country_code, business_type_code, customer_code, customer_line_code, model_code,
        total_task, complete_task, status_pct, total_working_time_min,
        act_type_code, cost_type_code, warranty_code,
        created_by, created_by_name, confirmer, confirmer_name,
        priority_code, customer_contact, work_center_code,
        defect_code, defect_code_name, defect_text,
        cause_code, cause_code_name, cause_text, alarm_code,
        plan_start_date, plan_end_date, created_at, reception_date, approval_date,
        work_start_date, work_end_date,
        down_time_date, down_time_time, up_time_date, up_time_time,
        breakdown, duration, duration_unit,
        module, chamber, position, part_name, work_type,
        rework, rework_check, title_sort, title_true_false,
        year, month, billing, plant, status
      ) values (
        row_data->>'order_no', row_data->>'order_status_code', row_data->>'order_status_name',
        nullif(row_data->>'order_type_code',''), row_data->>'order_type_name', row_data->>'order_title',
        row_data->>'equip_no', row_data->>'sap_equip_no', row_data->>'wo', row_data->>'equip_id',
        nullif(row_data->>'country_code',''), nullif(row_data->>'business_type_code',''),
        nullif(row_data->>'customer_code',''), nullif(row_data->>'customer_line_code',''),
        nullif(row_data->>'model_code',''),
        nullif(row_data->>'total_task','')::int, nullif(row_data->>'complete_task','')::int,
        nullif(row_data->>'status_pct','')::numeric, nullif(row_data->>'total_working_time_min','')::int,
        nullif(row_data->>'act_type_code',''), nullif(row_data->>'cost_type_code',''),
        nullif(row_data->>'warranty_code',''),
        row_data->>'created_by', row_data->>'created_by_name',
        row_data->>'confirmer', row_data->>'confirmer_name',
        nullif(row_data->>'priority_code',''), row_data->>'customer_contact',
        nullif(row_data->>'work_center_code',''),
        row_data->>'defect_code', row_data->>'defect_code_name', row_data->>'defect_text',
        row_data->>'cause_code', row_data->>'cause_code_name', row_data->>'cause_text',
        row_data->>'alarm_code',
        nullif(row_data->>'plan_start_date','')::date, nullif(row_data->>'plan_end_date','')::date,
        nullif(row_data->>'created_at','')::date, nullif(row_data->>'reception_date','')::date,
        nullif(row_data->>'approval_date','')::date,
        nullif(row_data->>'work_start_date','')::date, nullif(row_data->>'work_end_date','')::date,
        row_data->>'down_time_date', row_data->>'down_time_time',
        row_data->>'up_time_date', row_data->>'up_time_time',
        row_data->>'breakdown', nullif(row_data->>'duration','')::numeric, row_data->>'duration_unit',
        row_data->>'module', row_data->>'chamber', row_data->>'position',
        row_data->>'part_name', row_data->>'work_type',
        (row_data->>'rework')::boolean, row_data->>'rework_check',
        row_data->>'title_sort', (row_data->>'title_true_false')::boolean,
        nullif(row_data->>'year','')::int, row_data->>'month',
        row_data->>'billing', row_data->>'plant', row_data->>'status'
      )
      on conflict (order_no) do update set
        order_status_code = excluded.order_status_code,
        order_status_name = excluded.order_status_name,
        order_type_code = excluded.order_type_code,
        order_type_name = excluded.order_type_name,
        order_title = excluded.order_title,
        equip_no = excluded.equip_no,
        sap_equip_no = excluded.sap_equip_no,
        wo = excluded.wo,
        equip_id = excluded.equip_id,
        country_code = excluded.country_code,
        business_type_code = excluded.business_type_code,
        customer_code = excluded.customer_code,
        customer_line_code = excluded.customer_line_code,
        model_code = excluded.model_code,
        total_task = excluded.total_task,
        complete_task = excluded.complete_task,
        status_pct = excluded.status_pct,
        total_working_time_min = excluded.total_working_time_min,
        act_type_code = excluded.act_type_code,
        cost_type_code = excluded.cost_type_code,
        warranty_code = excluded.warranty_code,
        defect_code = excluded.defect_code,
        defect_code_name = excluded.defect_code_name,
        defect_text = excluded.defect_text,
        cause_code = excluded.cause_code,
        cause_code_name = excluded.cause_code_name,
        cause_text = excluded.cause_text,
        module = excluded.module,
        chamber = excluded.chamber,
        position = excluded.position,
        part_name = excluded.part_name,
        work_type = excluded.work_type,
        rework = excluded.rework,
        rework_check = excluded.rework_check,
        work_start_date = excluded.work_start_date,
        work_end_date = excluded.work_end_date,
        status = excluded.status;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'order_no', row_data->>'order_no', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- Service Tasks bulk upsert
create or replace function upsert_service_tasks_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
  row_idx int := 0;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    row_idx := row_idx + 1;
    begin
      insert into service_tasks (
        order_no, task_no, task_code, task_name, task_status,
        id_category, id_category_name, partner_company, partner_company_name,
        worker_id, worker_name, is_main, engineer_level,
        record_date, work_start_date, work_start_time, work_end_date, work_end_time,
        work_time_min, non_work_time_min, total_min, moving_time_min, time_unit, total_hour,
        act_type_code, cost_type_code, warranty_code, priority_code, work_center_code,
        equip_no, equip_id, model_code, country_code, customer_line_code,
        sap_equip_no, material_no, material_desc, wo, business_type_code,
        customer_code, order_title, status,
        plant, year, month, working_hour, worker_key, company, remark
      ) values (
        row_data->>'order_no', row_data->>'task_no',
        nullif(row_data->>'task_code',''), row_data->>'task_name', row_data->>'task_status',
        row_data->>'id_category', row_data->>'id_category_name',
        row_data->>'partner_company', row_data->>'partner_company_name',
        row_data->>'worker_id', row_data->>'worker_name',
        (row_data->>'is_main')::boolean, row_data->>'engineer_level',
        nullif(row_data->>'record_date','')::date,
        nullif(row_data->>'work_start_date','')::date, row_data->>'work_start_time',
        nullif(row_data->>'work_end_date','')::date, row_data->>'work_end_time',
        nullif(row_data->>'work_time_min','')::int,
        nullif(row_data->>'non_work_time_min','')::int,
        nullif(row_data->>'total_min','')::int,
        nullif(row_data->>'moving_time_min','')::int,
        row_data->>'time_unit',
        nullif(row_data->>'total_hour','')::numeric,
        nullif(row_data->>'act_type_code',''), nullif(row_data->>'cost_type_code',''),
        nullif(row_data->>'warranty_code',''), nullif(row_data->>'priority_code',''),
        nullif(row_data->>'work_center_code',''),
        row_data->>'equip_no', row_data->>'equip_id',
        row_data->>'model_code', row_data->>'country_code', row_data->>'customer_line_code',
        row_data->>'sap_equip_no', row_data->>'material_no', row_data->>'material_desc',
        row_data->>'wo', row_data->>'business_type_code',
        row_data->>'customer_code', row_data->>'order_title', row_data->>'status',
        row_data->>'plant', nullif(row_data->>'year','')::int,
        nullif(row_data->>'month','')::int,
        nullif(row_data->>'working_hour','')::numeric,
        row_data->>'worker_key', row_data->>'company', row_data->>'remark'
      )
      on conflict (order_no, task_no, worker_id, record_date) do update set
        task_code = excluded.task_code,
        task_name = excluded.task_name,
        task_status = excluded.task_status,
        work_start_time = excluded.work_start_time,
        work_end_time = excluded.work_end_time,
        work_time_min = excluded.work_time_min,
        non_work_time_min = excluded.non_work_time_min,
        total_min = excluded.total_min,
        moving_time_min = excluded.moving_time_min,
        total_hour = excluded.total_hour,
        working_hour = excluded.working_hour,
        status = excluded.status;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'order_no', row_data->>'order_no', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- Part Usage bulk upsert
create or replace function upsert_part_usage_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
  row_idx int := 0;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    row_idx := row_idx + 1;
    begin
      insert into part_usage (
        order_no, part_no, part_name, part_spec, part_model,
        is_key_part, is_return, used_qty, unit, serial_number, rf_time_new,
        location_group, location_code, location_desc,
        damage_group, damage_code, damage_desc,
        activity_group, activity_code, activity_desc,
        material_group_new, material_group_new_name,
        material_group_old, material_group_old_name,
        changed_part_no, changed_part_name, changed_part_spec,
        changed_key, changed_return, changed_part_model,
        changed_qty, changed_unit, changed_serial, rf_time_old,
        part_path, usage_type, supply_type, supply_desc, as_bom_check,
        equip_no, equip_id, model_code, country_code, customer_line_code,
        business_type_code, platform_code, segment_code, wo,
        usage_date, approved_date, warranty_code, warranty_start, warranty_end,
        sales_mode_code, created_by, created_by_name,
        order_status_code, order_title, task_no, task_code, task_name,
        plant, remark
      ) values (
        row_data->>'order_no', row_data->>'part_no', row_data->>'part_name',
        row_data->>'part_spec', row_data->>'part_model',
        (row_data->>'is_key_part')::boolean, (row_data->>'is_return')::boolean,
        nullif(row_data->>'used_qty','')::int, row_data->>'unit',
        row_data->>'serial_number', nullif(row_data->>'rf_time_new','')::numeric,
        row_data->>'location_group', row_data->>'location_code', row_data->>'location_desc',
        row_data->>'damage_group', row_data->>'damage_code', row_data->>'damage_desc',
        row_data->>'activity_group', row_data->>'activity_code', row_data->>'activity_desc',
        nullif(row_data->>'material_group_new',''), row_data->>'material_group_new_name',
        row_data->>'material_group_old', row_data->>'material_group_old_name',
        row_data->>'changed_part_no', row_data->>'changed_part_name', row_data->>'changed_part_spec',
        (row_data->>'changed_key')::boolean, (row_data->>'changed_return')::boolean,
        row_data->>'changed_part_model',
        nullif(row_data->>'changed_qty','')::int, row_data->>'changed_unit',
        row_data->>'changed_serial', nullif(row_data->>'rf_time_old','')::numeric,
        row_data->>'part_path', row_data->>'usage_type',
        row_data->>'supply_type', row_data->>'supply_desc', row_data->>'as_bom_check',
        row_data->>'equip_no', row_data->>'equip_id',
        row_data->>'model_code', row_data->>'country_code', row_data->>'customer_line_code',
        row_data->>'business_type_code', row_data->>'platform_code',
        row_data->>'segment_code', row_data->>'wo',
        nullif(row_data->>'usage_date','')::date, nullif(row_data->>'approved_date','')::date,
        row_data->>'warranty_code',
        nullif(row_data->>'warranty_start','')::date, nullif(row_data->>'warranty_end','')::date,
        row_data->>'sales_mode_code', row_data->>'created_by', row_data->>'created_by_name',
        row_data->>'order_status_code', row_data->>'order_title',
        row_data->>'task_no', row_data->>'task_code', row_data->>'task_name',
        row_data->>'plant', row_data->>'remark'
      )
      on conflict (order_no, part_no, task_no, location_code, usage_date, part_path) do update set
        part_name = excluded.part_name,
        used_qty = excluded.used_qty,
        damage_code = excluded.damage_code,
        damage_desc = excluded.damage_desc,
        activity_code = excluded.activity_code,
        activity_desc = excluded.activity_desc,
        material_group_new = excluded.material_group_new,
        material_group_new_name = excluded.material_group_new_name;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'order_no', row_data->>'order_no', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- Equipment Monthly Metrics bulk upsert
create or replace function upsert_equipment_monthly_metrics_batch(p_rows jsonb)
returns jsonb as $$
declare
  row_data jsonb;
  success_count int := 0;
  error_count int := 0;
  errors jsonb := '[]'::jsonb;
  row_idx int := 0;
begin
  for row_data in select * from jsonb_array_elements(p_rows)
  loop
    row_idx := row_idx + 1;
    begin
      insert into equipment_monthly_metrics (
        equip_no, sap_equip_no, wo, equip_id,
        country_code, customer_code, customer_line_code,
        model_code, platform_code, segment_code, business_type_code, sales_mode_code,
        year_month, division, value,
        equip_status_code, equip_status_name, plant, work_center_code
      ) values (
        row_data->>'equip_no', row_data->>'sap_equip_no', row_data->>'wo', row_data->>'equip_id',
        row_data->>'country_code', row_data->>'customer_code', row_data->>'customer_line_code',
        row_data->>'model_code', row_data->>'platform_code', row_data->>'segment_code',
        row_data->>'business_type_code', row_data->>'sales_mode_code',
        row_data->>'year_month', row_data->>'division',
        nullif(row_data->>'value','')::numeric,
        row_data->>'equip_status_code', row_data->>'equip_status_name',
        row_data->>'plant', row_data->>'work_center_code'
      )
      on conflict (sap_equip_no, year_month, division) do update set
        value = excluded.value,
        equip_status_code = excluded.equip_status_code,
        equip_status_name = excluded.equip_status_name;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'sap_equip_no', row_data->>'sap_equip_no', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;
