-- ============================================================
-- Migration 008: Indexes (통합)
-- Best practice: 모든 FK 컬럼에 인덱스, 복합 인덱스는 equality 먼저
-- ============================================================

-- ── equipment ──
create index idx_equipment_equip_no on equipment(equip_no);
create index idx_equipment_model on equipment(model_code);
create index idx_equipment_country on equipment(country_code);
create index idx_equipment_customer on equipment(customer_code);
create index idx_equipment_customer_line on equipment(customer_line_code);
create index idx_equipment_business_type on equipment(business_type_code);
create index idx_equipment_platform on equipment(platform_code);
create index idx_equipment_segment on equipment(segment_code);
create index idx_equipment_work_center on equipment(work_center_code);
create index idx_equipment_sales_mode on equipment(sales_mode_code);

-- ── service_orders ──
create index idx_so_equip_no on service_orders(equip_no);
create index idx_so_order_no on service_orders(order_no);
create index idx_so_work_start on service_orders(work_start_date);
create index idx_so_defect_code on service_orders(defect_code);
create index idx_so_cause_code on service_orders(cause_code);
create index idx_so_model on service_orders(model_code);
create index idx_so_country on service_orders(country_code);
create index idx_so_customer_line on service_orders(customer_line_code);
create index idx_so_business_type on service_orders(business_type_code);
create index idx_so_customer on service_orders(customer_code);
create index idx_so_module on service_orders(module);
create index idx_so_chamber on service_orders(chamber);
create index idx_so_rework on service_orders(rework);
create index idx_so_work_type on service_orders(work_type);
create index idx_so_act_type on service_orders(act_type_code);
create index idx_so_cost_type on service_orders(cost_type_code);
create index idx_so_warranty on service_orders(warranty_code);
create index idx_so_priority on service_orders(priority_code);
create index idx_so_work_center on service_orders(work_center_code);
create index idx_so_order_type on service_orders(order_type_code);
-- 복합 인덱스: equality 먼저, range 나중 (best practice)
create index idx_so_analysis on service_orders(model_code, country_code, customer_line_code, work_start_date);
create index idx_so_part_analysis on service_orders(module, chamber, position, defect_code, cause_code);

-- ── service_tasks ──
create index idx_st_order_no on service_tasks(order_no);
create index idx_st_equip_no on service_tasks(equip_no);
create index idx_st_worker on service_tasks(worker_id);
create index idx_st_task_code on service_tasks(task_code);
create index idx_st_work_date on service_tasks(work_start_date);
create index idx_st_act_type on service_tasks(act_type_code);
create index idx_st_cost_type on service_tasks(cost_type_code);
create index idx_st_warranty on service_tasks(warranty_code);
create index idx_st_priority on service_tasks(priority_code);
create index idx_st_work_center on service_tasks(work_center_code);

-- ── part_usage ──
create index idx_pu_order_no on part_usage(order_no);
create index idx_pu_equip_no on part_usage(equip_no);
create index idx_pu_part_no on part_usage(part_no);
create index idx_pu_material_group on part_usage(material_group_new);
create index idx_pu_damage_code on part_usage(damage_code);
create index idx_pu_usage_date on part_usage(usage_date);
create index idx_pu_location on part_usage(location_code, location_desc);

-- ── equipment_monthly_metrics ──
create index idx_emm_equip on equipment_monthly_metrics(sap_equip_no);
create index idx_emm_ym on equipment_monthly_metrics(year_month);
create index idx_emm_division on equipment_monthly_metrics(division);
create index idx_emm_model on equipment_monthly_metrics(model_code);
create index idx_emm_country on equipment_monthly_metrics(country_code);

-- ── cip_items ──
create index idx_cip_no on cip_items(cip_no);
create index idx_cip_stage on cip_items(stage);
create index idx_cip_priority on cip_items(action_priority);
create index idx_cip_equip on cip_items(equip_no);
create index idx_cip_model on cip_items(model_code);
create index idx_cip_country on cip_items(country_code);
create index idx_cip_journey on cip_items(journey_type);
create index idx_cip_created on cip_items(created_at);
create index idx_cip_assigned_eng on cip_items(assigned_engineer);

-- ── cip related ──
create index idx_csh_cip on cip_stage_history(cip_id);
create index idx_ca_cip on cip_attachments(cip_id);
create index idx_cc_cip on cip_comments(cip_id);
create index idx_clo_cip on cip_linked_orders(cip_id);
create index idx_clo_order on cip_linked_orders(order_no);

-- ── ccb_documents ──
create index idx_ccb_embedding on ccb_documents using ivfflat (embedding vector_cosine_ops) with (lists = 50);
create index idx_ccb_model on ccb_documents using gin (target_model);
create index idx_ccb_module on ccb_documents using gin (target_module);
create index idx_ccb_verified on ccb_documents(verified);

-- ── test plans, rollouts ──
create index idx_tp_cip on cip_test_plans(cip_id);
create index idx_ro_cip on cip_rollouts(cip_id);
create index idx_rt_rollout on cip_rollout_targets(rollout_id);
create index idx_rt_equip on cip_rollout_targets(equip_no);
create index idx_rt_status on cip_rollout_targets(status);

-- ── notifications ──
create index idx_notif_user on notifications(user_id, is_read);
create index idx_notif_created on notifications(created_at);

-- ── lookup FK indexes (best practice: lu_models) ──
create index idx_lu_models_segment on lu_models(segment_code);
create index idx_lu_models_platform on lu_models(platform_code);
create index idx_lu_customers_country on lu_customers(country_code);
create index idx_lu_customer_lines_customer on lu_customer_lines(customer_code);
