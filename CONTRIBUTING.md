# Contributing Guide

이 프로젝트는 **Git Flow** 브랜치 전략을 사용합니다. 자세한 사용법은 [README.md](README.md)를 참고하세요.

## Quick Reference

### 브랜치

| 브랜치 | 역할 | 직접 push |
|--------|------|-----------|
| `main` | 배포 버전 | 금지 |
| `develop` | 통합 테스트 | 금지 |
| `feature/*` | 기능 개발 | 자유 |
| `hotfix/*` | 긴급 수정 | 자유 |

### 새 기능 작업

```bash
git checkout develop && git pull origin develop
git checkout -b feature/기능명
# 작업...
git add . && git commit -m "feat: 설명" && git push origin feature/기능명
# GitHub에서 PR 생성 (base: develop)
```

### 커밋 타입

`feat` · `fix` · `style` · `refactor` · `docs` · `chore`

### PR 체크리스트

- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과
- [ ] 새 컴포넌트에 `"use client"` 추가
- [ ] 자체 테스트 완료

### Supabase

- 로컬 Docker 기반 (`127.0.0.1:54321`)
- `.env.local`은 gitignore 대상 — 팀원에게 별도 공유
- Supabase MCP 도구 사용 금지, CLI(`npx supabase`)와 `psql`만 사용
