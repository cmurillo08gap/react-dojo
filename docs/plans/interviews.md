# Plan: `interviews/`

Tracks what's built, in progress, and planned across
`interviews/question-bank/*.md`, so a new session can pick up without
re-deriving scope — the same role
[`docs/plans/concepts.md`](concepts.md) plays for `concepts/`. Ground
truth for what actually exists is
[`interviews/README.md`](../../interviews/README.md)'s question-bank
table — this doc adds the _why_ and _what's next_.

Conventions (entry shape: difficulty tag, discussion points, follow-ups;
where sessions save) live in [`interviews/CLAUDE.md`](../../interviews/CLAUDE.md) —
not duplicated here.

**What this bank is actually for, concretely:** it is the sole content
source the [`/mock-interview`](../../.claude/skills/mock-interview/SKILL.md)
skill reads from to run an adaptive interview — the skill pulls questions
from `interviews/question-bank/*.md` matching the user's chosen topic(s)
and seniority, asks them one at a time in character as an interviewer, and
never reveals a question's "Discussion points"/"Follow-ups" until after
the candidate has answered. Every entry added here is written with that
consumer in mind: discussion points are the interviewer's private
grading rubric, not a script to read aloud, and follow-ups are natural
probes for a vague answer, not mandatory sub-questions. This means the
skill file and this bank are coupled — adding a new topic file here isn't
done until `SKILL.md`'s "Topic focus" list and `interviews/README.md`'s
table both know about it (see the session log below for when that
happened).

## Status at a glance

Legend: ✅ built · 📋 scoped, not started.

| File                     | Topic                                                                        | Maps to `concepts/` category         | Status |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------ | ------ |
| `fundamentals.md`        | JSX, rendering, props/state, lists & keys                                    | `fundamentals`                       | ✅     |
| `hooks-and-state.md`     | Hook rules, `useEffect` pitfalls, custom hooks                               | `hooks`                              | ✅     |
| `state-management.md`    | Context, `useReducer`, lifting state, external stores                        | `state-management`                   | ✅     |
| `forms-and-actions.md`   | Controlled inputs, Actions, `useActionState`/`useFormStatus`/`useOptimistic` | `forms-and-actions`                  | ✅     |
| `concurrent-features.md` | Suspense, transitions, `use()`                                               | `concurrent-features`                | ✅     |
| `performance.md`         | Memoization, re-renders, profiling, code-splitting                           | `performance`                        | ✅     |
| `patterns.md`            | Compound components, render props, HOCs, controlled/uncontrolled             | `patterns`                           | ✅     |
| `testing.md`             | RTL, mocking, accessibility queries                                          | `testing`                            | ✅     |
| `system-design.md`       | Component/data architecture, open-ended problems                             | none — this is deliberate, see below | ✅     |
| `behavioral.md`          | Collaboration, code review, incident/debugging stories                       | cross-cutting, not concept-tied      | ✅     |

Every `concepts/*` category that survived the exclusion decision in
[`docs/plans/concepts.md`](concepts.md#architecture) now has a matching
question-bank file — that 1:1 mapping is deliberate: a learner who's done
a category's concept packages should be able to walk straight into a mock
interview on the same material. `system-design.md` is the one file that's
intentionally _not_ mapped to a concept category: it's where the ideas
`concepts/architecture` would have covered (data-fetching patterns, and
the broader "how would you structure X" questions that category's own
sketch implied) actually live now that building runnable demos for them
was ruled out — open-ended, no-single-correct-contrast questions are a
better fit for an interview prompt than a fixed before/after demo anyway.
`behavioral.md` stays unmapped on purpose — it's soft-skills/collaboration
material with no concept-package equivalent to link to.

## Gaps this doc found (now closed)

Before this session, only `fundamentals.md`, `hooks-and-state.md`,
`performance.md`, `system-design.md`, and `behavioral.md` existed — five
of the eight built `concepts/` categories (plus `architecture`'s
replacement and behavioral) had no dedicated interview coverage at all:
`state-management`, `forms-and-actions`, `concurrent-features`,
`patterns`, and `testing` were entirely uncovered as question-bank
topics (a couple of adjacent one-liners existed — e.g. a controlled-vs-
uncontrolled-inputs question in `fundamentals.md` — but nothing scoped to
those categories' own concept packages: Context re-render pitfalls,
`useActionState`/`useFormStatus`/`useOptimistic`, `useTransition`/
`useDeferredValue`/`use()`, compound components/render props/HOCs, and
RTL/mocking/accessible-queries testing practice were all missing). Built
all five this session (see session log).

## Writing a new entry

Match the shape already in every file: difficulty tag, 2-4 discussion
points (a grading rubric, not a script), 1-2 natural follow-ups. Ground
the discussion points in the same theory the matching `concepts/*`
package already verified against context7 (per root `CLAUDE.md`'s
context7 rule) rather than re-deriving/re-verifying independently — the
concept package's README and `docs/plans/concepts.md`'s "core idea /
contrast" column are the source of truth for the underlying API facts;
this bank's job is turning that into a question + rubric, not re-litigating
the API behavior.

## Next up

No open gaps at the category level. Future growth is organic, per
`interviews/README.md`'s "add questions as you encounter them in real
interviews" note — candidates for next additions if/when they come up:

- A live-coding-flavored entry per topic (the skill already supports a
  live-coding format option; the bank doesn't yet have any entries tagged
  for it specifically).
- More `system-design.md` prompts as `architecture`-shaped interview
  questions surface, since that's now this repo's only outlet for them.

## Session log

### 2026-09-09 (state-management, forms-and-actions, concurrent-features, patterns, testing added)

- Wrote this plan doc first, cross-referencing `concepts/README.md`'s
  categories against `interviews/README.md`'s existing question-bank
  table to find the coverage gap described above.
- Added the five missing files, 5 questions each, following the existing
  entry shape exactly (difficulty tag, discussion points, follow-ups),
  content grounded in the corresponding concept packages'
  already-context7-verified theory (via their README "Key takeaways" and
  this repo's `docs/plans/concepts.md` "core idea / contrast" summaries)
  rather than re-deriving React API claims from scratch:
  - `state-management.md`: lifting state up (drift-out-of-sync failure
    mode), the Context "every consumer re-renders" pitfall from a fresh
    object/function value each render, `useReducer` vs. several
    correlated `useState` calls, `useSyncExternalStore`'s tearing
    guarantee vs. a hand-rolled subscribe effect, and when Context alone
    stops being enough vs. reaching for a library.
  - `forms-and-actions.md`: `<form action={fn}>` vs. manual `onSubmit` +
    `preventDefault` + manual pending state, what `useActionState` adds
    over hand-rolled state (the race-condition guard), the
    `useFormStatus` "must be nested inside the form, not the
    form-rendering component" gotcha, `useOptimistic`'s rollback story,
    and how Actions/`FormData` shift the controlled-vs-uncontrolled
    calculus for simple forms.
  - `concurrent-features.md`: what "suspending" means vs. a manual
    `isLoading` flag, `useTransition` vs. `useDeferredValue` (what each
    actually defers), `use()`'s ability to be called conditionally vs. a
    regular hook, diagnosing/fixing a laggy search-as-you-type list with
    `useDeferredValue`, and what "concurrent" actually changes about
    React's rendering model.
  - `patterns.md`: compound components sharing state via Context vs. a
    config-array monolith, render props vs. custom hooks (why hooks
    displaced most of it, and where render props still make sense),
    HOC naming-collision/wrapper-hell pitfalls vs. a custom hook, the
    controlled/uncontrolled-components convention for a design-system
    component (and the "no built-in warning on mode-flip" gap vs.
    `<input>`), and whether HOCs are still current guidance.
  - `testing.md`: why RTL favors role/label queries over class
    names/test-ids, testing async loading/success/error states without
    flaky waits (`findBy*`/`waitFor`), module-boundary mocking
    (`vi.mock`) vs. fake timers for a debounced search box, when
    `data-testid` is actually the right call, and what an accessible
    query does and doesn't prove about real accessibility.
- Updated `interviews/README.md`'s question-bank table (10 rows now, was 5) and `.claude/skills/mock-interview/SKILL.md`'s "Topic focus" list in
  step 1 to include all 10 topics, so the skill can actually be asked for
  any of the new ones by name.
