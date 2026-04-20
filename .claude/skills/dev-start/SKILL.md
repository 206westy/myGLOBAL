---
name: dev-start
description: Use when starting any new development task or feature work. Checks out develop, pulls latest, syncs DB migrations, creates a feature branch before any code changes.
---

# Dev Start

Git Flow 기반 개발 시작 자동화. 코드 작업 전에 반드시 이 스킬을 실행한다.

## Workflow

1. **현재 상태 확인**
   ```bash
   git status
   git branch --show-current
   ```
   - 커밋 안 된 변경사항이 있으면 사용자에게 알리고 stash 또는 커밋할지 확인

2. **feature 이름 결정**
   - 사용자가 이름을 지정하지 않았으면 작업 내용 기반으로 영어 kebab-case 이름 제안
   - 예: `feature/strategy-tab`, `feature/login-page`, `feature/chat-ui`

3. **브랜치 생성 + 최신 코드 동기화**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/<기능명>
   ```

4. **DB 자동 백업** (마이그레이션 동기화 전 안전장치)
   ```bash
   cd project && bash supabase/backup.sh <IP> 54322
   ```
   - 백업 실패해도 작업은 계속 진행 (경고만 출력)

5. **DB 마이그레이션 동기화 확인**
   - `project/.env.local`에서 `NEXT_PUBLIC_SUPABASE_URL`의 IP를 읽는다
   - `supabase/migrations/` 폴더의 마이그레이션 파일 목록을 확인한다
   - DB에 적용된 마이그레이션과 비교한다:
     ```bash
     psql -h <IP> -p 54322 -U postgres -d postgres -c "SELECT name FROM supabase_migrations.schema_migrations ORDER BY name"
     ```
   - 미적용 마이그레이션이 있으면 사용자에게 알리고 적용 여부를 확인한다:
     ```bash
     psql -h <IP> -p 54322 -U postgres -d postgres -f supabase/migrations/<미적용파일>.sql
     ```
   - DB 연결이 안 되면 사용자에게 경고 ("DB에 연결할 수 없습니다. Supabase가 실행 중인지 확인하세요.")

6. **확인 메시지 출력**
   - 현재 브랜치명
   - DB 동기화 상태 (최신 / N개 마이그레이션 적용됨 / 연결 실패)
   - "작업을 시작하세요. 끝나면 /dev-finish 를 실행하세요."
