-- ============================================================
-- Fix: refresh_all_materialized_views() silently failing
--
-- Problem:
--   - mv_monthly_part_stats and mv_cip_dashboard have unique
--     indexes built on coalesce(...) expressions.
--   - REFRESH MATERIALIZED VIEW CONCURRENTLY requires a unique
--     index on plain columns (no expressions, no WHERE clause).
--   - The rpc therefore raised an error every time, but callers
--     (e.g. /api/import) didn't check the rpc result, so the MV
--     stayed empty after every import.
--
-- Fix:
--   Drop CONCURRENTLY. Refresh takes an AccessExclusiveLock, but
--   refreshes here are infrequent (after CSV import or screening
--   run) and brief, so blocking reads during refresh is fine.
-- ============================================================

create or replace function refresh_all_materialized_views()
returns void as $$
begin
  refresh materialized view mv_monthly_part_stats;
  refresh materialized view mv_equipment_monthly_summary;
  refresh materialized view mv_cip_dashboard;
end;
$$ language plpgsql;
