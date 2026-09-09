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

| File                                                             | Topic                                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`fundamentals.md`](question-bank/fundamentals.md)               | JSX, rendering, props/state, lists & keys                                    |
| [`hooks-and-state.md`](question-bank/hooks-and-state.md)         | Hook rules, `useEffect` pitfalls, custom hooks                               |
| [`state-management.md`](question-bank/state-management.md)       | Context, `useReducer`, lifting state, external stores                        |
| [`forms-and-actions.md`](question-bank/forms-and-actions.md)     | Controlled inputs, Actions, `useActionState`/`useFormStatus`/`useOptimistic` |
| [`concurrent-features.md`](question-bank/concurrent-features.md) | Suspense, transitions, the `use()` API                                       |
| [`performance.md`](question-bank/performance.md)                 | Memoization, re-renders, profiling, code-splitting                           |
| [`patterns.md`](question-bank/patterns.md)                       | Compound components, render props, HOCs, controlled/uncontrolled             |
| [`testing.md`](question-bank/testing.md)                         | React Testing Library, mocking, accessibility queries                        |
| [`system-design.md`](question-bank/system-design.md)             | Component/data architecture, larger open-ended problems                      |
| [`behavioral.md`](question-bank/behavioral.md)                   | Collaboration, code review, incident/debugging stories                       |

Each entry has a difficulty tag, expected discussion points (not a rigid
script), and 1-2 natural follow-ups. Add questions as you encounter them in
real interviews — this bank is meant to grow. Each of the first eight
files maps 1:1 to a `concepts/*` category (see
[`docs/plans/interviews.md`](../docs/plans/interviews.md) for that mapping
and the backlog/build status); `system-design.md` and `behavioral.md`
deliberately don't.

## Sessions

`sessions/` holds one file per mock-interview run (transcript + the
feedback summary). It's gitignored by default (interview attempts are
personal and numerous) — delete freely, or unignore a specific one you want
to keep as a reference by adding `!interviews/sessions/<file>` to
`.gitignore`.
