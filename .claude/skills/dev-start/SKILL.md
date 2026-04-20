---
name: dev-start
description: Use when starting any new development task or feature work. Checks out develop, pulls latest, creates a feature branch before any code changes.
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

4. **확인 메시지 출력**
   - 현재 브랜치명
   - "작업을 시작하세요. 끝나면 /dev-finish 를 실행하세요."
