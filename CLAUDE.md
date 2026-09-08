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
writing or explaining React APIs — especially anything from React 19
(Actions, `use()`, Compiler, Server Components) or any library API whose
behavior might have changed — resolve the library and pull current docs
with context7 rather than relying on training data. This repo exists
specifically to stay current; stale API explanations defeat the purpose.

If you notice `.mcp.json` isn't connected (no context7 tools available),
say so rather than silently falling back to memory.

## Working in `concepts/`

- One concept = one small, runnable idea. If you're tempted to demonstrate
  three hooks in one app, that's three concept packages, not one.
- Follow the layout in [`concepts/README.md`](concepts/README.md) exactly —
  a learner should be able to predict where anything lives after seeing one
  example.
- Write the `README.md` to match `concepts/hooks/use-state-basics/README.md`'s
  shape: what it demonstrates, how to run it, key takeaways, 2-4 discussion
  questions, further reading. Write it *before or alongside* the code, not
  as an afterthought.
- Prefer code that demonstrates a **contrast** (buggy vs. correct, naive vs.
  optimized) over code that just shows the happy path — that's what makes a
  concept memorable and interview-relevant. See the
  `incrementTwiceUnsafely`/`incrementTwiceSafely` pattern in the example.
- Update the status table in `concepts/README.md` when you add one.

## Working in `challenges/`

- Tests define the spec. Write `src/__tests__/*.test.ts` first, then a
  `src/solution.ts` stub that throws / is obviously unimplemented.
- **Never commit a pre-solved `solution.ts`.** The reference solution goes
  in a collapsed `<details>` block at the bottom of the challenge's
  `README.md` only — see `challenges/easy/flatten-array/README.md` for the
  pattern.
- Tag difficulty accurately against the tiers in
  [`challenges/README.md`](challenges/README.md) — don't inflate/deflate to
  make the bank look more complete.
- Update the status table in `challenges/README.md` when you add one
  (🟡 unsolved by default).

## Working in `interviews/`

- `question-bank/*.md` entries follow the shape used in the existing
  files: difficulty tag, discussion points (not a rigid script), 1-2
  follow-ups. Add questions there as new ones come up — don't invent a new
  file structure per topic.
- The `/mock-interview` skill (`.claude/skills/mock-interview/SKILL.md`)
  drives actual interview sessions. If you change how sessions should be
  run (format, debrief shape, where transcripts save), edit the skill file,
  not ad hoc behavior.
- Generated session transcripts go in `interviews/sessions/` and are
  gitignored by default — don't move that convention without discussing it,
  since it's a deliberate choice (interview attempts are personal/numerous).

## Commands

Run from the repo root unless noted:

```bash
pnpm install                                   # after adding/editing any package.json
pnpm --filter <package-name> dev                 # run one concept
pnpm --filter <package-name> test                # run one challenge's tests once
pnpm --filter <package-name> test:watch           # watch mode
pnpm lint                                          # eslint, whole repo
pnpm format                                         # prettier --write, whole repo
pnpm typecheck                                       # tsc, every package
```

Package names are `concept-<slug>` / `challenge-<slug>`, matching each
`package.json`'s `name` field — check the file if unsure rather than
guessing from the folder name.

## Conventions

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
