# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

A structured React learning and interview-prep repository: runnable
concept apps, TDD-style coding challenges, and AI-driven mock interviews.
It is content-first — the point is what a learner reads and runs, not
building a product. Optimize for **clarity and correctness of the teaching
material**, not for clever abstractions in the tooling around it.

Read [`README.md`](README.md) for the structure overview before making
structural changes.

## Stack & versions

- **React 19.x** (Actions, `useActionState`, `useOptimistic`,
  `useFormStatus`, ref-as-prop, the React Compiler) — function components
  and hooks only. Do not write class components except inside a concept
  package whose explicit purpose is contrasting legacy patterns.
- **TypeScript**, strict mode (`tsconfig.base.json`). No `any` in
  concept/challenge source without a comment explaining why.
- **Vite** per concept package, via the shared factory in
  `tooling/vite-react.config.ts` — don't hand-roll a new Vite config.
- **pnpm workspaces** — one package per concept/challenge. Never add a
  dependency to the root `package.json` that only one package needs; add it
  to that package instead.
- **Vitest** (+ React Testing Library for testing-focused concepts).

## Use context7 for anything React-API-specific

This repo has the `context7` MCP server configured (`.mcp.json`). Before
writing or explaining React APIs — React 19 features (Actions, `use()`,
Compiler, Server Components) especially, but this also covers
long-standing behavior (JSX semantics, reconciliation/keys, hook rules)
— resolve the library and pull current docs with context7 rather than
relying on training data. Don't skip it because a topic feels
"fundamental" or unlikely to have changed — that judgment call is exactly
what this rule exists to remove; verify every concept package's theory
content, not just the ones that look React-19-specific. This repo exists
specifically to stay current; stale API explanations defeat the purpose.

If you notice `.mcp.json` isn't connected (no context7 tools available),
say so rather than silently falling back to memory.

## Working in `concepts/`, `challenges/`, `interviews/`

Directory-specific conventions now live next to each directory, loaded
only when a session actually works there: [`concepts/CLAUDE.md`](concepts/CLAUDE.md),
[`challenges/CLAUDE.md`](challenges/CLAUDE.md),
[`interviews/CLAUDE.md`](interviews/CLAUDE.md).

## Conventions

- Package names are `concept-<slug>` / `challenge-<slug>`, matching each
  `package.json`'s `name` field — check the file if unsure rather than
  guessing from the folder name.
- Don't duplicate root-level config (`tsconfig.base.json`, `eslint.config.js`,
  `.prettierrc.json`) into individual packages — extend/inherit only.
- Keep each package's `package.json` scripts limited to what
  `pnpm -r --if-present` in the root scripts expects: `dev`/`build` for
  concepts, `test`/`test:watch` for challenges, `typecheck` for both.
- When adding a new top-level category under `concepts/` or a new
  difficulty tier under `challenges/`, update that folder's `README.md`
  table of contents in the same change — don't leave the index stale.
- Prefer editing an existing README's status table over leaving a new
  package undocumented.
