---
name: dev-finish
description: Use when development work is complete and ready to commit, push, and create a PR. Runs build/lint checks, commits changes, pushes to remote, and creates a pull request to develop.
---

# Dev Finish

Git Flow 기반 개발 완료 자동화. 작업이 끝나면 이 스킬을 실행한다.

## Pre-checks

1. **현재 브랜치 확인**
   ```bash
   git branch --show-current
   ```
   - `feature/*` 브랜치가 아니면 중단하고 사용자에게 알림

2. **빌드 & 린트 확인**
   ```bash
   cd project
   npm run build
   npm run lint
   ```
   - 실패하면 중단하고 에러를 사용자에게 보여줌. 수정 후 다시 실행하도록 안내

## Commit & Push

3. **변경사항 확인 및 커밋**
   ```bash
   git status
   git diff --stat
   ```
   - 변경 내용을 분석하여 적절한 커밋 메시지 자동 생성
   - 커밋 타입: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`
   - 사용자에게 커밋 메시지 확인 후 커밋
   ```bash
   git add <관련 파일들>
   git commit -m "<type>: <설명>"
   ```

4. **리모트에 Push**
   ```bash
   git push -u origin <현재 브랜치명>
   ```

## PR 생성

5. **Pull Request 생성**
   - base: `develop`
   - head: 현재 feature 브랜치
   - reviewer: `206westy`
   - 변경 내용을 분석하여 PR 제목과 본문 자동 작성

   ```bash
   gh pr create \
     --base develop \
     --head <브랜치명> \
     --reviewer 206westy \
     --title "<type>: <설명>" \
     --body "<Summary, Changes, Checklist>"
   ```

6. **완료 메시지 출력**
   - PR 링크
   - "리뷰어(206westy)의 승인 후 머지하세요."
