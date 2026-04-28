-- ============================================================
-- Migration: branches를 customer_line의 정식 매핑 테이블로 사용
--   - lu_customer_lines에는 있지만 branches에 누락된 코드 백필
--   - office 필터 인덱스 추가
--
-- 의도:
--   * SAP 임포트 흐름은 그대로 (트랜잭션 테이블에 FK 추가하지 않음)
--   * branches는 admin CRUD 대상. office가 NULL이면 "미매핑" 상태 → 추후 채움
--   * 대시보드 Branch 필터: transactions LEFT JOIN branches로 즉시 분류
--
-- 설계 결정 (FK 미추가):
--   branches.customer_line_code → lu_customer_lines(code) FK는 의도적으로 안 검.
--   branches에는 SAP에 현재 등장하지 않는 레거시 매핑 ~100건이 있고,
--   이들은 historical 분류 가치가 있어 보존 필요. lu_customer_lines는
--   SAP 임포트 기준으로 동적이므로, branches가 그 슈퍼셋이 되는 것이 자연.
-- ============================================================

-- ────────────────────────────────────────
-- 1. 누락 백필: lu_customer_lines에 있고 branches에 없는 코드를
--    office=NULL로 INSERT (admin이 추후 채움)
--    LEFT JOIN 형태라 멱등 — 재실행해도 안전
-- ────────────────────────────────────────
insert into branches (customer_line_code, customer_line_name)
select lu.code, lu.name
from lu_customer_lines lu
left join branches b on b.customer_line_code = lu.code
where b.customer_line_code is null;


-- ────────────────────────────────────────
-- 2. 필터 성능용 인덱스
--    branches.office는 대시보드 Branch 필터 / 그룹 키로 사용됨
-- ────────────────────────────────────────
create index if not exists idx_branch_office on branches(office);
