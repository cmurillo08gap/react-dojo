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
├── challenges-gallery/    # browsable list of React component-building interview challenges
├── interviews/         # question bank + generated mock-interview transcripts
│   ├── question-bank/
│   └── sessions/
├── gallery/              # landing page linking to every concept's dev server
├── playground/            # free-form plain-JS React sandbox — bring your own code
├── resources/             # curated external links, cheat sheets
├── tooling/                # shared Vite config factory + the concept port manifest
├── docs/plans/               # cross-session tracking: what's built, backlog, session log
└── .claude/skills/mock-interview/  # the /mock-interview skill
```

See each folder's own `README.md` for the details and the "how to add a
new one" steps: [`concepts/README.md`](concepts/README.md) ·
[`challenges/README.md`](challenges/README.md) ·
[`challenges-gallery/README.md`](challenges-gallery/README.md) ·
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

Or run **everything at once** and browse from one page: `pnpm dev` starts
every concept's dev server plus the [`gallery/`](gallery) — a plain
landing page listing every concept by category. Open
[`http://localhost:5300`](http://localhost:5300) and click through instead
of running `pnpm --filter` per concept. Each concept has a fixed dev port
(see [`tooling/concept-manifest.ts`](tooling/concept-manifest.ts)) so the
gallery's links stay stable across runs.

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

Early scaffold. `fundamentals` is fully built out (4 concepts) plus one
`hooks` concept ([`hooks/use-state-basics`](concepts/hooks/use-state-basics))
and one example challenge
([`easy/flatten-array`](challenges/easy/flatten-array)) establish the
pattern for the rest. See [`docs/plans/concepts.md`](docs/plans/concepts.md)
for the full build status and scoped backlog.
