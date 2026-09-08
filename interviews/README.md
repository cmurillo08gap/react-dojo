# Interviews

AI-driven technical interview prep: a structured question bank plus a
Claude Code skill (`/mock-interview`) that runs an adaptive, spoken-style
mock interview using that bank and saves a transcript + feedback report.

## Layout

```
interviews/
├── question-bank/     # source-of-truth questions, by topic, with difficulty + follow-ups
└── sessions/            # generated transcripts from /mock-interview runs (gitignored, kept locally)
```

## Running a mock interview

From Claude Code, in this repo:

```
/mock-interview
```

See [`.claude/skills/mock-interview/SKILL.md`](../.claude/skills/mock-interview/SKILL.md)
for what the skill does and how to steer it (topic focus, difficulty,
number of questions, seniority level).

## Question bank

| File                                                     | Topic                                                   |
| -------------------------------------------------------- | ------------------------------------------------------- |
| [`fundamentals.md`](question-bank/fundamentals.md)       | JSX, rendering, props/state, lists & keys               |
| [`hooks-and-state.md`](question-bank/hooks-and-state.md) | Hook rules, `useEffect` pitfalls, custom hooks          |
| [`performance.md`](question-bank/performance.md)         | Memoization, re-renders, profiling, code-splitting      |
| [`system-design.md`](question-bank/system-design.md)     | Component/data architecture, larger open-ended problems |
| [`behavioral.md`](question-bank/behavioral.md)           | Collaboration, code review, incident/debugging stories  |

Each entry has a difficulty tag, expected discussion points (not a rigid
script), and 1-2 natural follow-ups. Add questions as you encounter them in
real interviews — this bank is meant to grow.

## Sessions

`sessions/` holds one file per mock-interview run (transcript + the
feedback summary). It's gitignored by default (interview attempts are
personal and numerous) — delete freely, or unignore a specific one you want
to keep as a reference by adding `!interviews/sessions/<file>` to
`.gitignore`.
