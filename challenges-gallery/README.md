# Challenges gallery

A single browsable page listing common **React component-building**
interview challenges — the "build a counter/stopwatch/autocomplete from
scratch" style, as opposed to the algorithmic TDD packages under
[`../challenges/`](../challenges). Each entry has a plain-English
explanation of what to build, a requirements checklist, follow-up
questions interviewers often ask live, and a reference Vitest + React
Testing Library file describing the expected behavior.

This page is **read-only reference material** — nothing in it is executed
or checked automatically. The workflow is:

1. Run this gallery and pick a challenge:
   ```bash
   pnpm --filter challenges-gallery dev
   ```
   Opens at [http://localhost:5250](http://localhost:5250).
2. Implement it yourself in the playground:
   ```bash
   pnpm --filter playground dev
   ```
   Edit `playground/src/App.jsx` to build the component.
3. Optional — check your work: copy the challenge's reference test code
   over `playground/src/__tests__/App.test.jsx`, then
   ```bash
   pnpm --filter playground test:watch
   ```
   The test code in each entry assumes the same shape as playground's
   starter test (`import { App } from "../App"`), so it drops in without
   edits beyond matching your own markup/copy.

## Challenge list

| Challenge                       | Tier   | Focus                                               |
| ------------------------------- | ------ | --------------------------------------------------- |
| Counter                         | easy   | Basic `useState` mechanics                          |
| Accordion                       | easy   | Toggling UI state, ARIA `aria-expanded`             |
| Star rating                     | easy   | Hover-preview vs. committed state                   |
| Stopwatch                       | medium | `useEffect` + interval cleanup, stale closures      |
| Debounced search / autocomplete | medium | Debouncing, async race conditions                   |
| Tabs                            | medium | Composition, ARIA tab pattern, roving focus         |
| Infinite scroll list            | hard   | Pagination, avoiding duplicate fetches, stable keys |
| Toast notification queue        | hard   | Independent timers, imperative API, cleanup         |
| Nested comments tree            | hard   | Recursive rendering, tree data shape                |

Difficulty tiers match [`../challenges/README.md`](../challenges/README.md#difficulty-tiers).

## Where this list came from

Compiled from a web search across current front-end interview prep
sources (GreatFrontEnd, InterviewBit, GeeksforGeeks, and similar
"machine coding" round write-ups) for the components that show up
repeatedly across difficulty levels, then trimmed to nine that avoid
overlapping an existing concept package (e.g. list virtualization is
already covered in depth by
[`concepts/performance/list-virtualization`](../concepts/performance/list-virtualization)).

## Adding a new challenge

Add an entry to the `CHALLENGES` array in
[`src/challenges.ts`](src/challenges.ts) — `slug`, `title`, `tier`,
`summary`, `prompt`, `requirements`, `followUps`, and a `testCode`
reference test string — then add a row to the table above. No other
wiring is needed; the page renders straight from that array.
