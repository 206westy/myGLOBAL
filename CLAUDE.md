# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Directory

All source code and configuration live under `project/`, not the repo root. Run every command from `project/`:

```bash
cd project
```

## Commands

```bash
npm run dev      # Next.js dev server (uses --turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # next lint (ESLint 9, eslint-config-next)
```

There is no test runner configured.

**Package manager:** npm only — do not introduce yarn/pnpm/bun lockfiles.

## Tech Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · shadcn/ui (Radix primitives) · TanStack Query v5 · Zustand · React Hook Form + Zod · date-fns · ts-pattern · es-toolkit · framer-motion · axios.

Path alias `@/*` → `./src/*`. `tsconfig.json` intentionally relaxes type checking: `strictNullChecks: false`, `noImplicitAny: false` — strict mode is on, but these are off.

## Architecture

### App Router + Providers
`src/app/layout.tsx` wraps all routes in `src/app/providers.tsx`, which sets up:
- `QueryClientProvider` with the standard SSR pattern (`getQueryClient()` returns a fresh client on the server, a singleton in the browser; default `staleTime: 60_000`).
- `ThemeProvider` from `next-themes` (`attribute="class"`, system theme).

When adding new top-level providers, compose them inside `providers.tsx` rather than `layout.tsx`.

### Feature-based directory layout
Common code lives at `src/`; per-feature code is colocated under `src/features/[featureName]/`:

```
src/
  app/                       # Next.js routes
  components/ui/             # shadcn-ui primitives (do not hand-edit; use shadcn CLI)
  hooks/                     # cross-feature hooks (e.g. use-toast)
  lib/                       # cross-feature utilities (e.g. cn() in utils.ts)
  constants/                 # cross-feature constants
  remote/                    # http client
  features/[featureName]/
    components/
    hooks/
    lib/
    constants/
    api.ts                   # fetch functions for the feature
```

When you build a new feature, create a new `src/features/<name>/` folder rather than dumping files into the shared roots.

## Project-specific Rules (from AGENTS.md / .cursor/rules)

These are non-obvious conventions enforced in this repo:

- **Every component is a client component.** Add `"use client"` at the top of every component file, including ones that look purely presentational. This is intentional for this template — do not "optimize" by switching to server components.
- **`page.tsx` params are Promises.** Type and `await` them per the Next.js 15 async-params API:
  ```ts
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
- **Placeholder images:** use `picsum.photos` URLs (must be valid).
- **shadcn/ui components:** do not write them by hand. When a new primitive is needed, surface the install command for the user to run:
  ```
  npx shadcn@latest add <component>
  ```
- **Supabase:** 이 프로젝트는 **로컬 Supabase**를 사용한다. Supabase MCP 도구(`mcp__claude_ai_Supabase__*`)를 절대 사용하지 말 것. 스키마 분석·마이그레이션 모두 **Supabase CLI**(`npx supabase`)와 `psql`(host: 127.0.0.1, port: 54322, user: postgres, password: postgres)을 사용할 것. 마이그레이션 파일은 `supabase/migrations/`에 작성.
- **Korean text:** after generating code, verify no Korean characters are mojibake under UTF-8 and fix any that are.

## Git Flow

이 프로젝트는 `main` / `develop` / `feature/*` 브랜치 전략을 사용한다.

- **main**: 배포 버전. 직접 push 금지. develop에서 PR로만 머지.
- **develop**: 통합 테스트 브랜치. 직접 push 금지. feature 브랜치에서 PR로만 머지.
- **feature/기능명**: develop에서 분기하여 작업. 완료 후 develop으로 PR.
- **hotfix/버그명**: main에서 분기. 수정 후 main + develop 둘 다 PR.

AI가 코드를 커밋할 때도 이 규칙을 따른다:
- 현재 브랜치가 `main`이나 `develop`이면 직접 커밋하지 말고 feature 브랜치를 만들어서 작업할 것.
- 커밋 메시지 컨벤션: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`

## AI Development Rules

- AI(Claude Code, Cursor 등)로 개발할 때도 반드시 feature 브랜치에서 작업한다.
- `.env.local`은 git에 올리지 않는다. Supabase URL/키 등 환경 변수는 팀원에게 별도 공유.
- 새 기능 작업 시 `src/features/<name>/` 폴더를 만들어 코드를 격리한다.
- 작업 완료 후 `npm run build` + `npm run lint` 통과를 확인한 뒤 PR을 생성한다.

## Code Style

- Functional, immutable style; prefer `map`/`filter`/`reduce` over mutation.
- Early returns over nested conditionals; conditional class composition (via `cn()` in `src/lib/utils.ts`) over ternaries in JSX.
- Minimize AI-generated comments — use descriptive names instead. Comment *why*, not *what*.
- Reuse existing components and patterns before introducing new abstractions.

## Ruler

`.ruler/AGENTS.md` is the source of truth that gets distributed to multiple AI agents (cursor, codex, claude) via the `ruler` tool, configured in `.ruler/ruler.toml`. The root `AGENTS.md` and `.cursor/rules/global.mdc` are generated copies — edit `.ruler/AGENTS.md` if you need to change shared agent instructions.
