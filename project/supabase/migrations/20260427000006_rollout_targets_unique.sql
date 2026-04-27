-- 20260427000006_rollout_targets_unique.sql
-- P1-C: enable idempotent upsert on cip_rollout_targets

alter table cip_rollout_targets
  add constraint cip_rollout_targets_rollout_equip_unique
  unique (rollout_id, equip_no);

-- Helper: get-or-create a rollout row for a given CIP item.
create or replace function get_or_create_rollout_for_cip(p_cip_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_rollout_id uuid;
begin
  select rollout_id into v_rollout_id from cip_items where id = p_cip_id;
  if v_rollout_id is not null then
    return v_rollout_id;
  end if;

  insert into cip_rollouts (cip_id)
  values (p_cip_id)
  returning id into v_rollout_id;

  update cip_items set rollout_id = v_rollout_id where id = p_cip_id;
  return v_rollout_id;
end;
$$;
