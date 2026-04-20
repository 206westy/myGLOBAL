---
name: db
description: Use when working with Supabase database - querying tables, viewing data, creating migrations, applying schema changes, managing RLS policies, or adding RPC functions. Covers both local and remote (team shared) Supabase instances.
---

# DB (Supabase Database Operations)

로컬 또는 원격 Supabase DB 작업을 수행한다. Supabase MCP 도구는 절대 사용하지 않는다.

## DB 접속 정보 결정

1. `.env.local`에서 `NEXT_PUBLIC_SUPABASE_URL`을 읽는다.
2. URL에서 호스트를 추출한다:
   - `127.0.0.1` → 로컬 (본인 PC)
   - 그 외 IP → 원격 (팀장 PC)
3. DB 접속 정보:
   - host: 추출한 IP
   - port: `54322`
   - user: `postgres`
   - password: `postgres`
   - database: `postgres`

## 작업별 명령어

### 테이블 목록 조회

```bash
psql -h <IP> -p 54322 -U postgres -d postgres -c "\dt public.*"
```

### 테이블 스키마 확인

```bash
psql -h <IP> -p 54322 -U postgres -d postgres -c "\d+ 테이블명"
```

### 데이터 조회

```bash
psql -h <IP> -p 54322 -U postgres -d postgres -c "SELECT * FROM 테이블명 LIMIT 20"
```

### 마이그레이션 생성 + 적용

1. **마이그레이션 파일 생성**
   ```bash
   cd project
   npx supabase migration new 마이그레이션이름
   ```

2. **생성된 .sql 파일에 SQL 작성** (`supabase/migrations/` 아래)

3. **마이그레이션 적용**
   ```bash
   psql -h <IP> -p 54322 -U postgres -d postgres -f supabase/migrations/<생성된파일>.sql
   ```

4. **적용 확인**
   ```bash
   psql -h <IP> -p 54322 -U postgres -d postgres -c "\dt public.*"
   ```

### RLS 정책 추가

마이그레이션 파일에 작성:

```sql
ALTER TABLE 테이블명 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "정책이름" ON 테이블명
  FOR SELECT USING (true);
```

### RPC 함수 추가

마이그레이션 파일에 작성:

```sql
CREATE OR REPLACE FUNCTION 함수명(파라미터 타입)
RETURNS 반환타입 AS $$
BEGIN
  -- 로직
END;
$$ LANGUAGE plpgsql;
```

### DB 백업

```bash
cd project
bash supabase/backup.sh                    # 로컬 DB 백업
bash supabase/backup.sh 10.1.0.71 54322    # 원격 DB 백업
```

백업 파일: `supabase/backups/backup_YYYYMMDD_HHMMSS.sql` (7일간 보관, 자동 정리)

### DB 복구

```bash
cd project
bash supabase/restore.sh supabase/backups/backup_20260417_120000.sql              # 로컬
bash supabase/restore.sh supabase/backups/backup_20260417_120000.sql 10.1.0.71    # 원격
```

### 전체 DB 리셋 (로컬 전용)

```bash
cd project
npx supabase db reset
```

> 원격 DB에서는 `db reset` 사용 금지. 마이그레이션 파일로만 변경할 것.
> 스키마 변경 전 반드시 백업을 실행할 것.

## 주의사항

- Supabase MCP 도구(`mcp__claude_ai_Supabase__*`) 절대 사용 금지
- 마이그레이션 파일은 반드시 `supabase/migrations/`에 저장
- 원격 DB 작업 시 항상 psql로 접속
- 스키마 변경은 반드시 마이그레이션 파일로 (직접 DDL 실행 금지)
- 한글 컬럼명/테이블명 사용 금지
