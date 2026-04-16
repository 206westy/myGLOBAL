# myATHENA3

반도체 CS 엔지니어링 CIP 관리 플랫폼

## Tech Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Supabase

---

## Git Flow 가이드

### 브랜치 구조

```
main        완성품. 항상 정상 동작하는 코드만 있음. 직접 push 금지
develop     작업장. 기능을 모아서 테스트하는 곳. 문제 없으면 main으로 올림
feature/*   각자의 작업 공간. 끝나면 develop에 합치고 삭제
hotfix/*    긴급 수정. main에서 따서 main + develop 둘 다 합침
```

```
main    ─────────────────────────────────────── (배포)
             ↑                         ↑
develop ──────────┬──────────┬─────────── (테스트)
                  ↑          ↑
feature/login ────┘  feature/chat ───┘
```

### 1. 작업 시작

```bash
git checkout develop          # 작업장으로 이동
git pull origin develop       # 최신 상태로 업데이트
git checkout -b feature/기능명  # 내 작업 공간 생성
```

기능명은 영어로 짧게: `feature/login-page`, `feature/chat-ui`

### 2. 작업 중 커밋 & 푸시

```bash
git add .
git commit -m "feat: 로그인 페이지 UI 완성"
git push origin feature/기능명
```

하루에 몇 번이든 OK. 자주 할수록 좋음 (노트북 고장나도 깃허브에 올려둔 데까지는 살아있음)

### 3. 매일 아침 습관

```bash
git pull origin develop
```

내 feature 브랜치에서 이 한 줄이면 됨. 다른 사람이 develop에 합친 코드를 내 브랜치에 반영. 매일 하면 충돌이 생겨도 한두 군데, 일주일 안 하면 한꺼번에 터짐.

### 4. 작업 끝 → PR 생성

1. GitHub에서 **Compare & pull request** 클릭
2. **base: `develop`** ← **compare: `feature/기능명`** 확인
3. 제목, 설명 작성 + 리뷰어 지정
4. **Create pull request** 클릭

### 5. 리뷰 → 머지

1. 리뷰어가 코드 확인 후 **Approve**
2. **Merge pull request** 클릭
3. **Delete branch** 클릭 (다 쓴 feature 브랜치 삭제)

### 6. 배포 (develop → main)

develop에서 충분히 테스트했으면:
- PR 생성: **base: `main`** ← **compare: `develop`**
- 리뷰 + Approve 후 머지

### 7. 긴급 수정 (hotfix)

```bash
git checkout main
git pull origin main
git checkout -b hotfix/버그이름
```

수정 후 PR을 **두 개** 만듦:
- `hotfix/버그이름` → `main`
- `hotfix/버그이름` → `develop`

둘 다 합쳐야 함. main에만 합치면 develop에서 같은 버그 다시 나옴.

---

## 커밋 메시지

```
feat:     새 기능
fix:      버그 수정
style:    디자인만 변경
refactor: 코드 구조 변경 (동작 동일)
docs:     문서 수정
chore:    설정 파일, 잡일
```

예시:
```bash
git commit -m "feat: 대시보드 차트 컴포넌트 추가"
git commit -m "fix: 로그인 토큰 만료 에러 수정"
```

---

## 절대 하지 말 것

- `main`이나 `develop`에 직접 push 금지 → 항상 feature 브랜치에서 PR로
- 브랜치 보호 규칙이 걸려 있어서 직접 push하면 거부됨

---

## 개발 환경 세팅

```bash
cd project
npm install
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 빌드 확인
npm run lint     # 린트 확인
```

### Supabase (로컬)

Supabase는 한 사람의 로컬 Docker에서 실행. `.env.local` 파일에 URL과 키를 넣고, 팀원에게는 `.env.local` 내용을 별도 공유.

```env
# .env.local 예시
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
