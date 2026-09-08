# react-dojo

A structured React learning and interview-prep repository: runnable
**concepts**, **coding challenges**, and **AI-driven mock interviews**, all
in one pnpm workspace.

## Structure

```
react-dojo/
├── concepts/         # runnable React apps, one per concept — read, run, break, discuss
│   └── <category>/<slug>/
├── challenges/        # TDD-style coding exercises (algorithmic + React-flavored)
│   └── <easy|medium|hard>/<slug>/
├── interviews/         # question bank + generated mock-interview transcripts
│   ├── question-bank/
│   └── sessions/
├── resources/          # curated external links, cheat sheets
├── tooling/             # shared Vite config factory used by concept packages
└── .claude/skills/mock-interview/  # the /mock-interview skill
```

See each folder's own `README.md` for the details and the "how to add a
new one" steps: [`concepts/README.md`](concepts/README.md) ·
[`challenges/README.md`](challenges/README.md) ·
[`interviews/README.md`](interviews/README.md).

## Getting started

Requires Node 20+ and [pnpm](https://pnpm.io) 9+ (`corepack enable` gives
you the version pinned in `package.json` automatically).

```bash
pnpm install
```

Run a specific concept or challenge (package names are `concept-<slug>` /
`challenge-<slug>`):

```bash
pnpm --filter concept-use-state-basics dev
pnpm --filter challenge-flatten-array test:watch
```

Repo-wide commands (run across every workspace package):

```bash
pnpm test        # every package's test script
pnpm build        # every package's build script
pnpm lint          # eslint across the whole repo
pnpm format         # prettier --write across the whole repo
pnpm typecheck        # tsc across every package
```

## Mock interviews

```
/mock-interview
```

Runs an adaptive Q&A session drawing from [`interviews/question-bank/`](interviews/question-bank),
then saves a transcript + feedback report to `interviews/sessions/`. See
[`.claude/skills/mock-interview/SKILL.md`](.claude/skills/mock-interview/SKILL.md)
for exactly what it does.

## Tooling & conventions

- **React 19** + **TypeScript** + **Vite**, package-per-concept/challenge in
  a **pnpm workspace**.
- One shared root config for TypeScript (`tsconfig.base.json`), ESLint
  (`eslint.config.js`), and Prettier — individual packages extend/inherit,
  they don't redefine.
- **Vitest** (+ React Testing Library where a concept covers testing) for
  tests.
- Live React docs are pulled via the `context7` MCP server (configured in
  `.mcp.json`) rather than relying on stale training data — useful given how
  fast the React 19.x line and its ecosystem move.

See [`CLAUDE.md`](CLAUDE.md) for the full set of conventions Claude Code
follows when working in this repo.

## Status

Early scaffold — one example concept
([`hooks/use-state-basics`](concepts/hooks/use-state-basics)) and one
example challenge ([`easy/flatten-array`](challenges/easy/flatten-array))
are in place to establish the pattern. Everything else grows from here.
