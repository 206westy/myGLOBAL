# Contributing Guide

## Branch Strategy: GitHub Flow

`main` 브랜치는 항상 배포 가능한 상태를 유지합니다. 모든 작업은 feature 브랜치에서 진행하고, PR을 통해 main에 머지합니다.

```
main ──────────────────────────────────
  \                          /
   feature/my-work ─── PR ──┘
```

## Workflow

1. **main에서 브랜치 생성**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/my-feature
   ```

2. **작업 후 커밋 & 푸시**
   ```bash
   git add .
   git commit -m "feat: 기능 설명"
   git push origin feature/my-feature
   ```

3. **PR 생성 → 코드 리뷰 → 머지**

4. **머지 후 로컬 정리**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/my-feature
   ```

## Branch Naming

| Prefix | 용도 | 예시 |
|--------|------|------|
| `feature/` | 새 기능 | `feature/dashboard-chart` |
| `fix/` | 버그 수정 | `fix/login-error` |
| `hotfix/` | 긴급 수정 | `hotfix/api-crash` |
| `refactor/` | 리팩토링 | `refactor/auth-module` |
| `docs/` | 문서 작업 | `docs/api-guide` |

## Commit Message

```
<type>: <설명>

예시:
feat: 대시보드 차트 컴포넌트 추가
fix: 로그인 시 토큰 만료 에러 수정
refactor: API 클라이언트 구조 개선
docs: README 업데이트
style: 버튼 컴포넌트 스타일 수정
chore: 패키지 업데이트
```

## PR Rules

- PR 제목은 커밋 메시지 컨벤션을 따릅니다
- `npm run build` 성공 확인 후 PR을 올려주세요
- 최소 1명의 리뷰어 승인 후 머지합니다
- Squash merge를 사용합니다

## Development

```bash
cd project
npm install
npm run dev      # 개발 서버
npm run build    # 빌드 확인
npm run lint     # 린트 확인
```
