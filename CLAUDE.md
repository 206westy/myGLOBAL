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
- **Supabase:** never run Supabase locally. New tables must be added as SQL migration files under `supabase/migrations/` and handed to the user to apply.
- **Korean text:** after generating code, verify no Korean characters are mojibake under UTF-8 and fix any that are.

## Code Style

- Functional, immutable style; prefer `map`/`filter`/`reduce` over mutation.
- Early returns over nested conditionals; conditional class composition (via `cn()` in `src/lib/utils.ts`) over ternaries in JSX.
- Minimize AI-generated comments — use descriptive names instead. Comment *why*, not *what*.
- Reuse existing components and patterns before introducing new abstractions.

## Ruler

`.ruler/AGENTS.md` is the source of truth that gets distributed to multiple AI agents (cursor, codex, claude) via the `ruler` tool, configured in `.ruler/ruler.toml`. The root `AGENTS.md` and `.cursor/rules/global.mdc` are generated copies — edit `.ruler/AGENTS.md` if you need to change shared agent instructions.
