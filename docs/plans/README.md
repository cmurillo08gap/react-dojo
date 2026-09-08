# Plans

Spec-driven tracking docs for this repo's content areas — one plan per area
(`concepts/`, and later `challenges/`, `interviews/`), each covering scope,
status, backlog, and a dated session log so work can resume cleanly across
separate Claude Code sessions.

These are **planning documents**, not the source of truth for what's built —
`concepts/README.md`'s status table (and the equivalent for other areas) is
the ground truth for what actually exists. A plan can drift ahead of it
(intent recorded before the package is scaffolded) or behind it (built, not
yet logged) — reconcile against the actual folder contents, not just this
file, before trusting either.

## Index

| Plan                         | Covers                                     | Status      |
| ---------------------------- | ------------------------------------------ | ----------- |
| [`concepts.md`](concepts.md) | `concepts/` — one plan per category        | active      |
| `challenges.md`              | `challenges/` bank                         | not started |
| `interviews.md`              | `interviews/question-bank/` + session flow | not started |

## How to use these across sessions

1. Starting a session on an area: read that area's plan file first — it has
   the current status table, backlog, and the most recent session log entry.
2. Doing the work: follow the relevant section of the root
   [`CLAUDE.md`](../../CLAUDE.md) for the actual conventions (layout, TDD
   order, etc.) — the plan tracks _what_/_status_, CLAUDE.md governs _how_.
3. Wrapping up a session: update the status table for anything you
   built/changed, and append a dated entry to the session log with what
   shipped and what's next. Keep entries short — a few bullets, not a
   transcript.
