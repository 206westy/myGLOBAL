# 협업 세팅 시 주의사항

> SETUP.md를 따라 환경을 구성할 때 자주 발생하는 실수와 주의점을 정리한 문서입니다.

---

## 1. Git 관련

### 브랜치 보호 규칙

- `main`과 `develop`에는 **직접 push가 불가능**합니다 (GitHub 브랜치 보호 설정).
- 반드시 `feature/*` 브랜치를 만들어서 PR로 머지해야 합니다.
- 클론 직후 `git checkout develop`을 먼저 실행하세요. `main`에서 작업하면 push가 거부됩니다.

### 클론 시 주의

```bash
# 올바른 클론 방법
git clone https://github.com/206westy/myGLOBAL.git
cd myGLOBAL
git checkout develop
```

- `--recurse-submodules` 옵션은 불필요합니다 (서브모듈 제거됨).
- 클론 후 반드시 `develop` 브랜치로 전환하세요.

### 매일 아침 pull 습관

```bash
git pull origin develop
```

- 본인의 feature 브랜치에서 위 명령어를 **매일** 실행하세요.
- 며칠 안 하면 충돌이 한꺼번에 터집니다.

---

## 2. 환경 변수 (.env.local)

### 절대 git에 올리지 말 것

- `.env.local`은 `.gitignore`에 포함되어 있습니다.
- 실수로 `git add -A`로 올리지 않도록 주의하세요.
- 만약 올렸다면 즉시 `git rm --cached project/.env.local`로 제거하세요.

### 팀장에게 받아야 하는 정보

| 항목 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 팀장 PC IP + 포트 (예: `http://10.1.0.71:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

- **IP가 바뀌면** `.env.local`의 IP만 수정하면 됩니다. 키는 동일합니다.
- `.env.local` 파일은 `project/` 폴더 안에 생성해야 합니다 (루트 아님).

---

## 3. 패키지 설치

### npm만 사용

```bash
cd project
npm install
```

- **yarn, pnpm, bun 사용 금지.** 다른 lockfile이 생기면 충돌이 발생합니다.
- `package-lock.json`만 사용합니다.
- `node_modules/`가 이상하면 삭제 후 재설치:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### 작업 디렉토리 주의

- 모든 npm 명령어는 **`project/` 폴더 안에서** 실행해야 합니다.
- 루트(`myGLOBAL/`)에서 `npm install`을 실행하면 안 됩니다.

---

## 4. Supabase (공유 DB)

### 동료는 Docker/Supabase 설치 불필요

- Supabase는 **팀장 PC의 Docker**에서 실행됩니다.
- 동료는 네트워크를 통해 원격 접속만 하면 됩니다.

### 접속 전제 조건

- **같은 사내 네트워크**(Wi-Fi/유선)에 연결되어 있어야 합니다.
- 팀장 PC가 **켜져 있고 Docker가 실행 중**이어야 합니다.
- 팀장 PC가 꺼지면 DB 접근이 불가능합니다. 개발 서버는 돌아가지만 데이터 로딩이 실패합니다.

### Supabase MCP 도구 사용 금지

- AI 코딩 도구(Claude Code, Cursor 등)에서 Supabase MCP 도구(`mcp__claude_ai_Supabase__*`)를 **절대 사용하지 마세요**.
- 반드시 **Supabase CLI**(`npx supabase`)와 **psql**로만 작업해야 합니다.

### 마이그레이션 적용 순서

마이그레이션 파일은 번호 순서대로 적용해야 합니다:

```bash
# psql로 직접 적용
PGPASSWORD=postgres psql -h <팀장IP> -p 54322 -U postgres -d postgres \
  -f supabase/migrations/<파일명>.sql
```

- 순서를 건너뛰면 외래 키 제약조건 등으로 에러가 발생합니다.
- 이미 적용된 마이그레이션을 다시 적용하면 중복 에러가 발생할 수 있습니다.

---

## 5. AI 코딩 도구

### 공통 필수 규칙

| 규칙 | 이유 |
|------|------|
| 모든 컴포넌트에 `"use client"` 추가 | 프로젝트 전체가 클라이언트 컴포넌트 기반 |
| 새 기능은 `src/features/기능명/` 폴더에 생성 | feature 기반 디렉토리 구조 유지 |
| shadcn/ui 컴포넌트는 CLI로만 설치 | `npx shadcn@latest add 컴포넌트명` |
| `src/components/ui/` 직접 수정 금지 | shadcn CLI가 관리하는 파일 |
| 커밋 전 빌드/린트 확인 | `npm run build && npm run lint` |

### Claude Code 사용 시

- `myGLOBAL/` (루트)에서 `claude` 명령어를 실행하세요.
- `CLAUDE.md`와 `AGENTS.md`를 자동으로 읽어서 프로젝트 규칙을 따릅니다.
- `/dev-start`로 작업을 시작하고, `/dev-finish`로 PR을 생성할 수 있습니다.

### Cursor 사용 시

- `myGLOBAL/project` 폴더를 열어야 합니다 (루트 아님).
- `AGENTS.md`가 자동으로 AI 규칙으로 적용됩니다.

---

## 6. 자주 하는 실수 체크리스트

- [ ] `develop` 브랜치로 전환하지 않고 `main`에서 작업 시작
- [ ] `.env.local`을 `project/` 가 아닌 루트에 생성
- [ ] 루트에서 `npm install` 실행 (`project/`에서 해야 함)
- [ ] yarn/pnpm 등 다른 패키지 매니저 사용
- [ ] `main`이나 `develop`에 직접 push 시도
- [ ] 팀장 PC 꺼진 상태에서 DB 연결 에러 원인을 코드에서 찾음
- [ ] 마이그레이션 파일 순서를 건너뛰고 적용
- [ ] Supabase MCP 도구 사용
- [ ] shadcn/ui 컴포넌트 파일 직접 수정
