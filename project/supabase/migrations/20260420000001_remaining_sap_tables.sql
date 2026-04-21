-- ============================================================
-- Migration: Remaining SAP Tables
-- employees, branches, sales_forecast_intl, sales_forecast_domestic
-- ============================================================

-- ============================================================
-- 1. employees (ZCSR0210 인원 마스터)
-- ============================================================
create table employees (
  id               uuid default gen_random_uuid() primary key,
  worker_id        text not null unique,
  name             text not null,
  name_eng         text,
  name_alias       text,
  company_code     text,
  company_name     text,
  level            text,
  start_date       date,
  end_date         date,
  subsidiary       text,
  branch           text,
  is_engineer      text,
  gfp_model        text,
  country_code     text,
  remark           text,
  mpi              text,
  job              text,
  is_active        boolean default true,
  imported_at      timestamptz default now(),
  updated_at       timestamptz default now()
);

create index idx_emp_worker_id on employees(worker_id);
create index idx_emp_country on employees(country_code);
create index idx_emp_subsidiary on employees(subsidiary);
create index idx_emp_branch on employees(branch);
create index idx_emp_active on employees(is_active);

create trigger trg_employees_updated
  before update on employees
  for each row execute function update_updated_at();


-- ============================================================
-- 2. branches (브랜치/고객라인 참조)
-- ============================================================
create table branches (
  id                 uuid default gen_random_uuid() primary key,
  customer_line_code text not null unique,
  customer_line_name text not null,
  office             text,
  country_code       text,
  imported_at        timestamptz default now(),
  updated_at         timestamptz default now()
);

create index idx_branch_country on branches(country_code);

create trigger trg_branches_updated
  before update on branches
  for each row execute function update_updated_at();


-- ============================================================
-- 3. sales_forecast_intl (ZSDR0030D 해외 수주 계획)
-- ============================================================
create table sales_forecast_intl (
  id                    uuid default gen_random_uuid() primary key,
  sales_org_code        text,
  sales_org_name        text,
  distribution_channel  text,
  plant_code            text,
  plant_name            text,
  end_customer_code     text,
  end_customer_name     text,
  customer_code         text,
  customer_name         text,
  customer_line_code    text,
  customer_line_name    text,
  device_code           text,
  device_name           text,
  business_type_code    text,
  business_type_name    text,
  model_code            text,
  model_name            text,
  sales_type_code       text,
  sales_type_name       text,
  wo_planned            text not null default '',
  wo_actual             text,
  planned_qty           int,
  planned_price         numeric,
  currency              text,
  shipping_plan_ym      text not null default '',
  shipping_actual_ym    text,
  revenue_plan_ym       text,
  revenue_actual_ym     text,
  pm_count              int,
  imported_at           timestamptz default now()
);

create unique index idx_sfi_upsert_key
  on sales_forecast_intl(customer_line_code, model_code, wo_planned, shipping_plan_ym);

create index idx_sfi_model on sales_forecast_intl(model_code);
create index idx_sfi_customer on sales_forecast_intl(customer_code);
create index idx_sfi_customer_line on sales_forecast_intl(customer_line_code);
create index idx_sfi_shipping on sales_forecast_intl(shipping_plan_ym);


-- ============================================================
-- 4. sales_forecast_domestic (ZSDR0040D 국내 수주 계획)
-- ============================================================
create table sales_forecast_domestic (
  id                      uuid default gen_random_uuid() primary key,
  sales_org_code          text,
  sales_org_name          text,
  distribution_channel    text,
  plant_code              text,
  plant_name              text,
  production_lot          text not null default '',
  end_customer_code       text,
  end_customer_name       text,
  customer_code           text,
  customer_name           text,
  customer_line_code      text,
  customer_line_name      text,
  model_code              text,
  model_name              text,
  wo                      text not null default '',
  wo_name                 text,
  plan_version            text not null default '',
  country_code            text,
  business_type_code      text,
  business_type_name      text,
  production_end_date     date,
  planned_qty             int,
  unit                    text,
  part_delivery_date      date,
  imported_at             timestamptz default now()
);

create unique index idx_sfd_upsert_key
  on sales_forecast_domestic(wo, production_lot, plan_version);

create index idx_sfd_model on sales_forecast_domestic(model_code);
create index idx_sfd_customer on sales_forecast_domestic(customer_code);
create index idx_sfd_customer_line on sales_forecast_domestic(customer_line_code);
create index idx_sfd_wo on sales_forecast_domestic(wo);


-- ============================================================
-- 5. RPC Functions
-- ============================================================

-- employees bulk upsert
create or replace function upsert_employees_batch(p_rows jsonb)
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
      insert into employees (
        worker_id, name, name_eng, name_alias,
        company_code, company_name, level,
        start_date, end_date,
        subsidiary, branch, is_engineer,
        gfp_model, country_code,
        remark, mpi, job, is_active
      ) values (
        row_data->>'worker_id', row_data->>'name',
        nullif(row_data->>'name_eng',''), nullif(row_data->>'name_alias',''),
        row_data->>'company_code', row_data->>'company_name',
        nullif(row_data->>'level',''),
        nullif(row_data->>'start_date','')::date,
        nullif(row_data->>'end_date','')::date,
        nullif(row_data->>'subsidiary',''), nullif(row_data->>'branch',''),
        nullif(row_data->>'is_engineer',''),
        nullif(row_data->>'gfp_model',''), nullif(row_data->>'country_code',''),
        nullif(row_data->>'remark',''), nullif(row_data->>'mpi',''),
        nullif(row_data->>'job',''),
        case when nullif(row_data->>'end_date','')::date >= current_date then true else false end
      )
      on conflict (worker_id) do update set
        name = excluded.name,
        name_eng = excluded.name_eng,
        name_alias = excluded.name_alias,
        company_code = excluded.company_code,
        company_name = excluded.company_name,
        level = excluded.level,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        subsidiary = excluded.subsidiary,
        branch = excluded.branch,
        is_engineer = excluded.is_engineer,
        gfp_model = excluded.gfp_model,
        country_code = excluded.country_code,
        remark = excluded.remark,
        mpi = excluded.mpi,
        job = excluded.job,
        is_active = excluded.is_active;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'worker_id', row_data->>'worker_id', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- branches bulk upsert
create or replace function upsert_branches_batch(p_rows jsonb)
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
    if nullif(trim(row_data->>'customer_line_code'), '') is null then
      continue;
    end if;
    begin
      insert into branches (
        customer_line_code, customer_line_name, office, country_code
      ) values (
        row_data->>'customer_line_code', row_data->>'customer_line_name',
        nullif(row_data->>'office',''), nullif(row_data->>'country_code','')
      )
      on conflict (customer_line_code) do update set
        customer_line_name = excluded.customer_line_name,
        office = excluded.office,
        country_code = excluded.country_code;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'code', row_data->>'customer_line_code', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- sales_forecast_intl bulk upsert (ZSDR0030D)
create or replace function upsert_sales_forecast_intl_batch(p_rows jsonb)
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
      insert into sales_forecast_intl (
        sales_org_code, sales_org_name, distribution_channel,
        plant_code, plant_name,
        end_customer_code, end_customer_name,
        customer_code, customer_name,
        customer_line_code, customer_line_name,
        device_code, device_name,
        business_type_code, business_type_name,
        model_code, model_name,
        sales_type_code, sales_type_name,
        wo_planned, wo_actual,
        planned_qty, planned_price, currency,
        shipping_plan_ym, shipping_actual_ym,
        revenue_plan_ym, revenue_actual_ym,
        pm_count
      ) values (
        row_data->>'sales_org_code', row_data->>'sales_org_name',
        row_data->>'distribution_channel',
        row_data->>'plant_code', row_data->>'plant_name',
        row_data->>'end_customer_code', row_data->>'end_customer_name',
        row_data->>'customer_code', row_data->>'customer_name',
        row_data->>'customer_line_code', row_data->>'customer_line_name',
        row_data->>'device_code', row_data->>'device_name',
        row_data->>'business_type_code', row_data->>'business_type_name',
        row_data->>'model_code', row_data->>'model_name',
        row_data->>'sales_type_code', row_data->>'sales_type_name',
        coalesce(nullif(row_data->>'wo_planned',''), ''),
        nullif(row_data->>'wo_actual',''),
        nullif(row_data->>'planned_qty','')::int,
        nullif(row_data->>'planned_price','')::numeric,
        row_data->>'currency',
        coalesce(nullif(row_data->>'shipping_plan_ym',''), ''),
        nullif(row_data->>'shipping_actual_ym',''),
        nullif(row_data->>'revenue_plan_ym',''),
        nullif(row_data->>'revenue_actual_ym',''),
        nullif(row_data->>'pm_count','')::int
      )
      on conflict (customer_line_code, model_code, wo_planned, shipping_plan_ym) do update set
        sales_org_code = excluded.sales_org_code,
        sales_org_name = excluded.sales_org_name,
        end_customer_code = excluded.end_customer_code,
        end_customer_name = excluded.end_customer_name,
        customer_code = excluded.customer_code,
        customer_name = excluded.customer_name,
        customer_line_name = excluded.customer_line_name,
        device_code = excluded.device_code,
        device_name = excluded.device_name,
        business_type_code = excluded.business_type_code,
        business_type_name = excluded.business_type_name,
        model_name = excluded.model_name,
        sales_type_code = excluded.sales_type_code,
        sales_type_name = excluded.sales_type_name,
        wo_actual = excluded.wo_actual,
        planned_qty = excluded.planned_qty,
        planned_price = excluded.planned_price,
        currency = excluded.currency,
        shipping_actual_ym = excluded.shipping_actual_ym,
        revenue_plan_ym = excluded.revenue_plan_ym,
        revenue_actual_ym = excluded.revenue_actual_ym,
        pm_count = excluded.pm_count;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'wo', row_data->>'wo_planned', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;


-- sales_forecast_domestic bulk upsert (ZSDR0040D)
create or replace function upsert_sales_forecast_domestic_batch(p_rows jsonb)
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
      insert into sales_forecast_domestic (
        sales_org_code, sales_org_name, distribution_channel,
        plant_code, plant_name, production_lot,
        end_customer_code, end_customer_name,
        customer_code, customer_name,
        customer_line_code, customer_line_name,
        model_code, model_name,
        wo, wo_name, plan_version,
        country_code, business_type_code, business_type_name,
        production_end_date, planned_qty, unit, part_delivery_date
      ) values (
        row_data->>'sales_org_code', row_data->>'sales_org_name',
        row_data->>'distribution_channel',
        row_data->>'plant_code', row_data->>'plant_name',
        coalesce(nullif(row_data->>'production_lot',''), ''),
        row_data->>'end_customer_code', row_data->>'end_customer_name',
        row_data->>'customer_code', row_data->>'customer_name',
        row_data->>'customer_line_code', row_data->>'customer_line_name',
        row_data->>'model_code', row_data->>'model_name',
        coalesce(nullif(row_data->>'wo',''), ''),
        row_data->>'wo_name',
        coalesce(nullif(row_data->>'plan_version',''), ''),
        nullif(row_data->>'country_code',''),
        row_data->>'business_type_code', row_data->>'business_type_name',
        nullif(row_data->>'production_end_date','')::date,
        nullif(row_data->>'planned_qty','')::int,
        row_data->>'unit',
        nullif(row_data->>'part_delivery_date','')::date
      )
      on conflict (wo, production_lot, plan_version) do update set
        sales_org_code = excluded.sales_org_code,
        sales_org_name = excluded.sales_org_name,
        plant_code = excluded.plant_code,
        plant_name = excluded.plant_name,
        end_customer_code = excluded.end_customer_code,
        end_customer_name = excluded.end_customer_name,
        customer_code = excluded.customer_code,
        customer_name = excluded.customer_name,
        customer_line_code = excluded.customer_line_code,
        customer_line_name = excluded.customer_line_name,
        model_code = excluded.model_code,
        model_name = excluded.model_name,
        wo_name = excluded.wo_name,
        country_code = excluded.country_code,
        business_type_code = excluded.business_type_code,
        business_type_name = excluded.business_type_name,
        production_end_date = excluded.production_end_date,
        planned_qty = excluded.planned_qty,
        unit = excluded.unit,
        part_delivery_date = excluded.part_delivery_date;
      success_count := success_count + 1;
    exception when others then
      error_count := error_count + 1;
      errors := errors || jsonb_build_object('row', row_idx, 'wo', row_data->>'wo', 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('success_count', success_count, 'error_count', error_count, 'errors', errors);
end;
$$ language plpgsql;
