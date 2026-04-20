# 동료 개발 환경 세팅 가이드

## 1. 레포 클론

```bash
git clone https://github.com/206westy/myGLOBAL.git
cd myGLOBAL
```

## 2. develop 브랜치로 이동

```bash
git checkout develop
```

## 3. 프로젝트 의존성 설치

```bash
cd project
npm install
```

## 4. 환경 변수 설정

`project/.env.local` 파일을 직접 만들어야 합니다 (git에 포함되지 않음).
팀장에게 파일 내용을 받아서 아래 경로에 저장하세요.

```bash
# project/.env.local
NEXT_PUBLIC_SUPABASE_URL=http://<팀장 PC IP>:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=(팀장에게 받은 키)
SUPABASE_SERVICE_ROLE_KEY=(팀장에게 받은 키)
```

## 5. 개발 서버 실행

```bash
cd project
npm run dev
```

http://localhost:3000 에서 확인

---

## 6. Supabase (공유 DB)

Supabase는 팀장 PC의 Docker에서 실행됩니다. 동료는 Docker/Supabase를 설치할 필요 없이 팀장 PC에 원격 접속합니다.

### 접속 정보

| 항목 | URL |
|------|-----|
| Supabase API | `http://<팀장IP>:54321` |
| Supabase Studio (웹 UI) | `http://<팀장IP>:54323` |
| DB 직접 접속 (psql) | `psql -h <팀장IP> -p 54322 -U postgres -d postgres` (비번: `postgres`) |

> 팀장 IP가 바뀌면 `.env.local`의 IP만 바꾸면 됩니다. 키는 동일.

### DB 작업 방법

**테이블 조회, 데이터 확인 등:**
- Studio(`http://<팀장IP>:54323`)에서 웹으로 확인
- 또는 psql로 직접 쿼리

**마이그레이션 (스키마 변경):**

```bash
# 1. 마이그레이션 파일 생성 (로컬에서)
npx supabase migration new 마이그레이션이름

# 2. supabase/migrations/ 에 생성된 .sql 파일에 SQL 작성

# 3. 원격 DB에 마이그레이션 적용
psql -h <팀장IP> -p 54322 -U postgres -d postgres -f supabase/migrations/파일명.sql
```

**주의:**
- Supabase MCP 도구 사용 금지
- 팀장 PC가 꺼지면 DB 접근 불가
- 같은 사내 네트워크(Wi-Fi/유선)에 있어야 접속 가능

---

## 7. AI 코딩 도구 세팅

### Claude Code (추천)

1. 설치: https://claude.ai/code
2. 터미널에서 프로젝트 루트(`myGLOBAL/`)로 이동
3. `claude` 명령어 실행
4. `CLAUDE.md`와 `AGENTS.md`를 자동으로 읽어서 프로젝트 규칙을 따름

### Cursor

1. 설치: https://cursor.com
2. `myGLOBAL/project` 폴더를 열기
3. `AGENTS.md` 파일이 자동으로 AI 규칙으로 적용됨

### 공통 규칙

어떤 AI 도구를 쓰든 아래 규칙은 반드시 지켜야 합니다:

- 모든 컴포넌트 파일 상단에 `"use client"` 추가
- 새 기능은 `src/features/기능명/` 폴더에 생성
- shadcn/ui 컴포넌트는 직접 작성하지 말고 `npx shadcn@latest add 컴포넌트명`으로 설치
- Supabase MCP 도구 사용 금지, psql과 CLI만 사용
- 커밋 전 `npm run build` + `npm run lint` 통과 확인

---

## 8. Git Flow 작업 방법

### 새 기능 시작

```bash
git checkout develop
git pull origin develop
git checkout -b feature/기능명
```

### 작업 중 저장

```bash
git add .
git commit -m "feat: 작업 내용"
git push origin feature/기능명
```

### 매일 아침 (충돌 방지)

```bash
git pull origin develop
```

### 작업 끝

1. GitHub에서 **Compare & pull request** 클릭
2. base: `develop` ← compare: `feature/기능명` 확인
3. 제목, 설명 작성 + 리뷰어 지정
4. **Create pull request** 클릭
5. 리뷰어 Approve 후 **Merge** → **Delete branch**

자세한 내용은 [README.md](README.md) 참고

---

## 커밋 메시지 규칙

| 타입 | 용도 | 예시 |
|------|------|------|
| `feat:` | 새 기능 | `feat: 로그인 페이지 추가` |
| `fix:` | 버그 수정 | `fix: 토큰 만료 에러 수정` |
| `style:` | 디자인 변경 | `style: 버튼 색상 변경` |
| `refactor:` | 구조 개선 | `refactor: API 클라이언트 분리` |
| `docs:` | 문서 | `docs: README 업데이트` |
| `chore:` | 잡일 | `chore: 패키지 업데이트` |

---

## 절대 하지 말 것

- `main` 또는 `develop`에 직접 push (브랜치 보호 규칙으로 거부됨)
- `.env.local` 파일을 git에 올리기
- shadcn/ui 컴포넌트를 직접 수정하기
