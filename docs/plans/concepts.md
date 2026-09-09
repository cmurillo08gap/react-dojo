# Plan: `concepts/`

Tracks what's built, in progress, and planned across `concepts/*/*`
packages, so a new session can pick up without re-deriving scope. Ground
truth for what actually exists is
[`concepts/README.md`](../../concepts/README.md)'s status table — this doc
adds the _why_ and _what's next_ that table doesn't carry, fully scoped
down to individual planned packages so a session can pick one and start
building without a scoping pass first.

Conventions (layout, in-app panel shape, contrast-over-happy-path,
category definitions) live in [`CLAUDE.md`](../../CLAUDE.md) and
[`concepts/README.md`](../../concepts/README.md) — not duplicated here.

Every concept runs on a fixed dev port and is listed in the
[`gallery/`](../../gallery) landing page (`pnpm dev` → `http://localhost:5300`)
instead of needing `pnpm --filter` per package. When you build one of the
planned packages below: assign it the next free port in its category's
block from [`tooling/concept-manifest.ts`](../../tooling/concept-manifest.ts)
(scheme documented at the top of that file), set it as a literal in the
package's own `vite.config.ts`, and add a matching manifest entry so the
gallery picks it up — see `concepts/CLAUDE.md`.

**Architecture decision (revisit only if it starts actually hurting):** one
Vite app per concept, each its own dev server/port, stays the pattern as
this scales to ~40 packages — considered and rejected switching to a
single SPA (loses per-concept process isolation, the actual pedagogical
point) or a Vite multi-page app sharing one `node_modules`/package.json
(shared dependency tree across all concepts, loses "add a dep to just one
package cleanly"). The `node_modules`-per-package concern that prompted
this was disk-space-based and doesn't hold up — pnpm's content-addressable
store means each package's `node_modules` is almost entirely symlinks back
to one shared store, not duplicated content (confirmed empirically: 5
concept packages + gallery = 165M total, and the per-package folders are
~2.7M each of mostly symlinks). The one real cost worth watching: `pnpm dev`
boots every package's dev server concurrently for the gallery to link to —
fine at 5-10 concepts, worth revisiting (e.g. gallery starting servers on
demand) if it gets unwieldy around 20-30.

Section order below follows the intended build/learning order — each
category leans on the ones above it (state management assumes fundamentals

- hooks, forms assume state management, etc.) — not the alphabetical order
  `concepts/README.md`'s category table happens to use.

## Status at a glance

Legend: ✅ built · 🚧 in progress · 📋 scoped, not started · ❌ excluded.

| Category              | Built | Scoped (planned) | Status                           |
| --------------------- | :---: | :--------------: | -------------------------------- |
| `fundamentals`        |   4   |        0         | ✅ complete for now              |
| `hooks`               |   6   |        0         | ✅ complete for now              |
| `state-management`    |   4   |        0         | ✅ complete for now              |
| `forms-and-actions`   |   5   |        0         | ✅ complete for now              |
| `concurrent-features` |   4   |        0         | ✅ complete for now              |
| `performance`         |   4   |        0         | ✅ complete for now              |
| `patterns`            |   4   |        0         | ✅ complete for now              |
| `testing`             |   4   |        0         | ✅ complete for now              |
| `architecture`        |   —   |        —         | ❌ excluded — see decision below |

"Scoped" means a slug and a concrete core idea/contrast are decided below —
not that a README or code exists yet. Update this table's counts whenever
the per-category tables change.

## `fundamentals`

Covers: JSX, components, props, rendering, keys, lists, conditional
rendering. **Fully built** — no open backlog unless a gap surfaces later.

| Package                    | Status | Core idea / contrast                                                                                                                                                                 |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `jsx-and-components`       | ✅     | JSX compiles to function calls; tag capitalization (string vs. identifier); a component defined _inside_ another component's body loses identity → state resets on parent re-render. |
| `props-basics`             | ✅     | Props flow parent → child; `useState(props.x)` only seeds once and goes stale vs. reading `props.x` directly every render.                                                           |
| `rendering-lists-and-keys` | ✅     | `.map()` + `key`; index-as-key vs. id-as-key, demonstrated with an uncontrolled `<input>` whose DOM identity "sticks" to the wrong item after an insert.                             |
| `conditional-rendering`    | ✅     | `&&` / ternary / early return; the `count && <Badge/>` trap that renders a stray `"0"` at `count === 0`.                                                                             |

## `hooks`

Covers: `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, custom
hooks.

| Package               | Status | Core idea / contrast                                                                                                                                                                                                                                                     |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `use-state-basics`    | ✅     | Updater-fn vs. value form of `setCount`; stale-closure bug from calling the setter twice with the captured value.                                                                                                                                                        |
| `use-effect-basics`   | ✅     | Effects sync a component with an external system. Contrast: an effect that subscribes without a cleanup function (duplicate subscriptions pile up across re-renders/remounts, very visible under `<StrictMode>`'s double-invoke) vs. one that returns a cleanup.         |
| `use-ref-basics`      | ✅     | Refs hold a mutable value that survives re-renders _without_ triggering one. Contrast: storing a value that should drive the UI in a ref (UI silently doesn't update) vs. the same value in `useState`; plus a DOM ref for imperative focus/scroll.                      |
| `use-memo-basics`     | ✅     | Contrast: an expensive computation re-run on every render (even for unrelated state changes) vs. wrapped in `useMemo` with the right dependency array. Pairs naturally with `react-memo-basics` in `performance`.                                                        |
| `use-callback-basics` | ✅     | Contrast: a new function identity every render breaking a memoized child's `React.memo` bail-out vs. `useCallback` stabilizing it. Needs `react-memo-basics`-style child to make the effect visible — consider building after/alongside `performance/react-memo-basics`. |
| `custom-hooks-basics` | ✅     | Extracting shared stateful logic into a hook (e.g. `useToggle` or `useLocalStorageState`); rules of hooks (top-level only, hooks/components only) and why a hook is "just a function that calls other hooks."                                                            |

## `state-management`

Covers: Context, `useReducer`, lifting state up, external stores.

| Package               | Status | Core idea / contrast                                                                                                                                                                                                                                |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lifting-state-up`    | ✅     | Two sibling components each holding their own local copy of the same logical state (they drift out of sync) vs. lifting it to their common parent and passing it down.                                                                              |
| `context-basics`      | ✅     | Prop drilling a value through several layers of components that don't use it, vs. `createContext`/`useContext`. Include the "every consumer re-renders" pitfall when the context value is a fresh object literal each render, vs. a memoized value. |
| `use-reducer-basics`  | ✅     | A component with several related `useState` calls that can be updated inconsistently (invalid combinations) vs. one `useReducer` with a defined action set that keeps transitions valid.                                                            |
| `external-store-sync` | ✅     | Reading a value from a store that lives outside React (e.g. `window` size, or a tiny custom event-emitter store) via ad hoc `useState` + manual subscription (risk of tearing/missed updates) vs. `useSyncExternalStore`.                           |

## `forms-and-actions`

Covers: controlled inputs, React 19 Actions, `useActionState`,
`useFormStatus`, `useOptimistic`. **Fully built** — no open backlog unless
a gap surfaces later.

| Package                             | Status | Core idea / contrast                                                                                                                                                                                                                                                                                                         |
| ----------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `controlled-vs-uncontrolled-inputs` | ✅     | `value` + `onChange` (React owns the input's value) vs. `defaultValue` + a ref (the DOM owns it), plus a live "switching trap" input that flips between the two and captures React's real console warning inline.                                                                                                            |
| `form-actions-basics`               | ✅     | A traditional `onSubmit` handler with manual `preventDefault`, manual pending-state `useState`, and manual error handling vs. a React 19 `<form action={fn}>` Action — including the automatic reset of uncontrolled fields on success.                                                                                      |
| `use-action-state-basics`           | ✅     | `useActionState` for form state + validation error display across submissions, including the pending flag it returns, vs. the pre-19 manual `useState` equivalent (with an out-of-order-response race guard the hook makes unnecessary).                                                                                     |
| `use-form-status-basics`            | ✅     | A submit button nested three components deep inside a `<form>` that needs to know "is this form submitting" without prop-drilling a flag down vs. `useFormStatus` read directly in the nested component — plus a live "gotcha" demo of calling the hook in the form-rendering component itself (always reports non-pending). |
| `use-optimistic-basics`             | ✅     | UI that waits for a round trip before showing a new comment vs. `useOptimistic` showing it immediately and reconciling (or rolling back) when the real response lands — a "simulate failure" toggle makes the rollback something you watch happen, not just read about.                                                      |

## `concurrent-features`

Covers: Suspense, transitions (`useTransition`, `useDeferredValue`), the
`use()` API. **Fully built** — no open backlog unless a gap surfaces later.

| Package                     | Status | Core idea / contrast                                                                                                                                                                                           |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suspense-basics`           | ✅     | A `<Suspense>` boundary with a `fallback`, wrapping a component that suspends on a pending promise/lazy import — what "suspending" actually means vs. a manual `isLoading` flag.                               |
| `use-transition-basics`     | ✅     | An expensive render triggered synchronously (UI freezes/janks) vs. the same update wrapped in `startTransition`, using `isPending` to keep the UI responsive and interruptible.                                |
| `use-deferred-value-basics` | ✅     | A search-as-you-type list whose expensive re-render lags every keystroke vs. rendering the list from a `useDeferredValue`-wrapped query, keeping the input itself responsive.                                  |
| `use-api-basics`            | ✅     | The `use()` hook reading a promise or context conditionally (inside an `if`/loop — something regular hooks can't do) vs. the old `useEffect` + `useState` data-fetching dance, inside a `<Suspense>` boundary. |

## `performance`

Covers: memoization, code-splitting, virtualization, profiling.

| Package                   | Status | Core idea / contrast                                                                                                                                                                                                                        |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-memo-basics`       | ✅     | A child re-rendering every time its parent does, even with unchanged props, vs. wrapped in `React.memo`. Include the pitfall that a fresh object/array/function prop each render (see `hooks/use-callback-basics`) defeats the memoization. |
| `code-splitting-lazy`     | ✅     | One large upfront bundle vs. `React.lazy` + `Suspense` splitting a rarely-used view into its own chunk, shown via the Network panel / a visible loading fallback.                                                                           |
| `list-virtualization`     | ✅     | Rendering a few thousand DOM nodes for a long list (visible jank on scroll) vs. windowing so only the visible slice is ever mounted.                                                                                                        |
| `profiling-with-devtools` | ✅     | A deliberately over-rendering component tree instrumented with the `<Profiler>` API (or a walkthrough of React DevTools' Profiler tab) to _find_ the problem the other performance packages fix.                                            |

## `patterns`

Covers: compound components, render props, controlled/uncontrolled, HOCs.

| Package                                 | Status | Core idea / contrast                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compound-components`                   | ✅     | A `<Tabs>`/`<Tab>`-style API sharing implicit state via Context internally, vs. the same feature built by prop-drilling every option down from one giant component.                                                                                                        |
| `render-props`                          | ✅     | Sharing stateful logic via a function-as-child/prop (the pre-hooks pattern) vs. the same logic extracted into a custom hook — showing _why_ hooks displaced most render-prop use cases.                                                                                    |
| `controlled-vs-uncontrolled-components` | ✅     | The general component-design version of controlled/uncontrolled (e.g. an `<Accordion>` that can be either parent-driven via props+callback, or self-managed) — distinct from `forms-and-actions/controlled-vs-uncontrolled-inputs`, which is specifically about `<input>`. |
| `higher-order-components`               | ✅     | A HOC injecting props (e.g. `withLoading`) vs. the equivalent custom hook — the naming-collision/prop-shadowing/wrapper-hell pitfalls that motivated moving away from HOCs.                                                                                                |

## `testing`

Covers: React Testing Library, Vitest, mocking, accessibility queries.

| Package              | Status | Core idea / contrast                                                                                                                                                      |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rtl-basics`         | ✅     | `render` + `screen` + `user-event`; a test coupled to implementation details (class names, component internals) vs. one that queries and interacts the way a user would.  |
| `testing-async-ui`   | ✅     | Testing a component with loading/error/success states from an async fetch — `findBy*`/`waitFor`, and the flaky-test pitfall of not awaiting async UI updates.             |
| `mocking-basics`     | ✅     | A test that hits a real network call or real timers (slow, flaky) vs. mocking the module/`fetch`/timers at the boundary with Vitest's `vi.mock`/`vi.useFakeTimers`.       |
| `accessible-queries` | ✅     | `getByRole`/`getByLabelText` and friends vs. `data-testid` as a last resort — how accessible queries double-check the UI is actually usable, not just present in the DOM. |

## `architecture`

**Decision (2026-09-09): excluded from `concepts/` entirely** — not scoped,
not planned, and not coming back later without a fresh scoping discussion.
This would have covered: project structure, data-fetching patterns, Server
Components (conceptually).

Both packages sketched below ran into the same wall the open questions
(kept here for context) had already flagged: neither actually fits this
repo's "small, runnable Vite app" format, which is the entire pedagogical
point of `concepts/*` (see `concepts/README.md` / `concepts/CLAUDE.md`) —
so rather than force a workaround format (a README-only package, a
diagram-heavy write-up with no live demo) that breaks the one rule every
other concept package follows, the category is dropped.

- `server-components-conceptually` can't be a normal runnable Vite app the
  way every other concept is — no server, no RSC runtime — this repo's
  packages are Vite/CSR-only, so an actual RSC boundary can't run here.
- `data-fetching-patterns` (waterfall `useEffect` fetches vs. parallel
  requests) could technically run as a normal concept app, but it was
  scoped as this category's other half; splitting it out alone would leave
  `architecture` a category of exactly one package, which isn't worth
  keeping open. It's also arguably a better fit as an open-ended interview
  question than a fixed-contrast demo (see below).
- Project structure (folder-by-feature vs. folder-by-type, etc.) never fit
  the "one small runnable idea" shape either — it's a repo-level
  organizational discussion, not a demo.

**Where this material actually lives instead:** these are exactly the
open-ended, no-single-"correct"-contrast questions a real interview asks
without expecting a live demo — they're covered as interview-prep
material in [`interviews/question-bank/system-design.md`](../../interviews/question-bank/system-design.md)
instead (data-fetching waterfalls/de-duplication, auth structuring, and
design-system component APIs already live there). See
[`docs/plans/interviews.md`](interviews.md) for how that bank is scoped.

## Next up

Suggested default order — each category leans on the ones before it, so
this isn't arbitrary, but it's not a hard constraint either:

1. ~~`fundamentals`~~ ✅ done
2. ~~`hooks`~~ ✅ done
3. ~~`state-management`~~ ✅ done
4. ~~`forms-and-actions`~~ ✅ done
5. ~~`concurrent-features`~~ ✅ done
6. ~~`performance`~~ ✅ done
7. ~~`patterns`~~ ✅ done
8. ~~`testing`~~ ✅ done
9. ~~`architecture`~~ ❌ excluded (2026-09-09) — see the decision above;
   not coming back without a fresh scoping discussion

## Session log

### 2026-09-09 (architecture excluded; interviews planning doc added)

- Decided to exclude `concepts/architecture` entirely rather than resolve
  its two open questions by forcing a workaround format — see the decision
  record in the `architecture` section above. Updated the status-at-a-
  glance table (❌ excluded) and `concepts/README.md`'s categories table to
  match (row removed, footnote added pointing here).
- Added [`docs/plans/interviews.md`](interviews.md): a build-status/backlog
  doc for `interviews/question-bank/*.md`, cross-referenced against every
  `concepts/*` category (including a note on where the now-excluded
  `architecture` ideas live instead — `system-design.md`), then built out
  the gap it identified. See that doc's own session log for details.

### 2026-09-08 (performance category completed)

- Built all 4 `performance` packages in parallel via 4 subagents, each
  scoped to its own package directory (`react-memo-basics` port 5351,
  `code-splitting-lazy` 5352, `list-virtualization` 5353,
  `profiling-with-devtools` 5354) — `performance` is now ✅ complete. Each
  subagent was handed pre-verified context7 facts (`/react/react`,
  v19.2.7) rather than re-querying independently, since the orchestrating
  session had already pulled current docs for `React.memo`'s shallow-equal
  bail-out mechanism, `React.lazy`/`Suspense`'s code-splitting pattern, and
  the `<Profiler>` `onRender` callback signature before fanning out — one
  subagent (`profiling-with-devtools`) caught and corrected a naming
  mismatch in that pre-supplied brief anyway (`startTime`/`commitTime`, not
  `actualStartTime`/`commitStartTime`), verified against both the
  installed `@types/react@19.2.18` and a fresh context7 pull.
- Each package follows the established contrast pattern: `react-memo-basics`
  (plain child vs. `React.memo` defeated by a fresh inline `onPing` vs. the
  same memoized child given a `useCallback`-stabilized `onPing`, with a
  live "Renders: N" badge per child); `code-splitting-lazy` (a statically
  imported `EagerPanel` vs. a `React.lazy`-loaded `HeavyPanel` behind
  `Suspense`, with an artificial import delay so the fallback is reliably
  visible, and a documented `pnpm build` step proving `HeavyPanel` lands in
  its own chunk); `list-virtualization` (naive render of 5,000 rows vs.
  hand-rolled windowing — `startIndex`/`endIndex` derived from `scrollTop`
  in render, not an effect — with a live "rows mounted" counter as the
  in-app proxy for DOM node count); `profiling-with-devtools` (an
  unmemoized three-child tree wrapped in React's built-in `<Profiler>`,
  logging `actualDuration`/`baseDuration` per commit, toggled against a
  `React.memo`-optimized twin of the same tree to make the savings
  concrete, with the README pointing to React DevTools' Profiler tab as
  the real tool this in-app table stands in for).
- Orchestrating session then ran `pnpm install` once (38 workspace
  projects, up from 34) and `pnpm lint`, which caught a real bug in
  `react-memo-basics`: it mutated a `useRef` during render
  (`renderCount.current += 1`) to count renders, which this repo's
  `eslint-plugin-react-hooks` recommended rules flag as an error
  (`react-hooks/refs` — React's render-purity rule, since a component may
  be rendered more than once per commit under StrictMode/concurrent
  features). Tried a state+effect counter keyed on the child's own props
  as a rule-compliant alternative, but that tripped a second rule
  (`react-hooks/set-state-in-effect`) for calling `setState` synchronously
  in an effect body. Settled on keeping the `useRef` mutation (it's the
  only technique that actually counts direct function-body executions)
  behind one explicit, narrowly-scoped `eslint-disable-next-line` comment
  explaining why this specific diagnostic-only, self-contained case is the
  sole exception in the repo — plus a callout in the demo about
  `<StrictMode>` double-invoking render functions on mount, so badges may
  start at "Renders: 2" instead of 1.
- Full-repo `pnpm typecheck` passed clean across all 38 packages. `pnpm
lint` was clean after the fix above (the one warning it surfaces is the
  same pre-existing, unrelated issue in `challenges/easy/flatten-array`
  noted in earlier entries below). `pnpm format` (repo-wide, `prettier
--write .`) reformatted the 4 new `performance/*` packages (subagents
  hadn't run Prettier themselves) but also rewrote ~15 older,
  already-committed files across `forms-and-actions`/`state-management` —
  the same pure prose-width/JSX-wrapping drift flagged as pre-existing and
  out of scope in every prior entry below. Reverted those via `git checkout
--` to keep this change scoped to `performance/`. Manually verified
  `concept-code-splitting-lazy`'s `pnpm build` actually produces a separate
  `HeavyPanel-*.js` chunk distinct from the main bundle, matching what its
  README tells the learner to check.
- Updated `tooling/concept-manifest.ts`, `concepts/README.md`'s status
  table, and this doc's status-at-a-glance/performance tables/Next-up
  section once, serially, from the orchestrating session (not
  per-subagent), per `concepts/CLAUDE.md`'s parallelization guidance.

### 2026-09-08 (testing category completed)

- Built all 4 `testing` packages in parallel via 4 subagents, each scoped
  to its own package directory (`rtl-basics` port 5371,
  `testing-async-ui` 5372, `mocking-basics` 5373, `accessible-queries` 5374) — `testing` is now ✅ complete. Each subagent verified React-API
  claims against context7 (`/reactjs/react.dev`) before writing: whether
  React Testing Library's `render` wraps children in `<StrictMode>` (it
  doesn't, unless you pass a `wrapper`) and `act`'s role in flushing
  pending updates for `rtl-basics`; `act`/batching semantics for
  promise-driven state updates for `testing-async-ui`; `useEffect`'s
  cleanup-before-next-run ordering (what makes the debounce cancel/
  reschedule correctly) for `mocking-basics`; and that `role`/`aria-*`/
  `tabIndex` are ordinary DOM props React does nothing special with, for
  `accessible-queries`.
- New infrastructure needed for this category alone: each package adds
  `vitest`, `@testing-library/react`, `@testing-library/jest-dom`,
  `@testing-library/user-event`, and `jsdom` as devDependencies, plus a
  `test`/`test:watch` script (on top of the usual `dev`/`build`/
  `preview`/`typecheck`) — a deliberate, noted exception to CLAUDE.md's
  "concepts get dev/build, challenges get test" script convention, since
  this category's whole point is runnable tests. Each package also gets
  its own `vitest.config.ts` (a separate file, not a change to the shared
  `tooling/vite-react.config.ts` factory) because Vitest ignores
  `vite.config.ts`'s `server` block once a dedicated `vitest.config.ts`
  exists, and the factory has no `test` option to extend anyway. A
  `src/setupTests.ts` is imported via `vitest.config.ts`'s `setupFiles` in
  every package to (a) import `@testing-library/jest-dom/vitest` for the
  DOM matchers and (b) manually register `afterEach(() => cleanup())` —
  discovered this is required, not automatic, because Testing Library's
  own auto-cleanup only fires when it detects a _global_ `afterEach`, and
  this repo's `vitest.config.ts` deliberately doesn't set
  `test.globals: true` (every test file imports `describe`/`it`/`vi`/etc.
  explicitly from `"vitest"` instead, to match the rest of the repo's
  explicit-imports style).
- Each package follows the established contrast pattern, made _provably_
  real rather than just narrated (mirroring the "buggy vs. correct" habit
  from other categories) via Vitest's `test.fails(...)` inverse-assertion
  API — a test that's expected to throw, so the suite stays green while
  concretely proving a failure mode: `rtl-basics` (`LikeButton` vs.
  `LikeButtonRefactored`, same accessible role/name/behavior but different
  class names/markup — one `describe.each`-parameterized accessible-query
  test suite passes against both, one `container.querySelector(".like-btn")`
  test is wrapped in `test.fails` because it only breaks against the
  refactored version); `testing-async-ui` (`UserProfile`'s loading/success/
  error states, mocking the `api` module boundary with `vi.mock` +
  `vi.importActual` for a partial mock, covering `findByText`,
  `waitForElementToBeRemoved`, and a `test.fails`-wrapped "forgot to
  await" sync-query mistake); `mocking-basics` (`SearchBox`'s debounced
  search — one test file genuinely pays out real timers + a real
  simulated-latency `api` module and needs `findByText`, the other mocks
  both the module and the clock via `vi.mock` + `vi.useFakeTimers()` +
  `await vi.advanceTimersByTimeAsync(300)`, resolving near-instantly with
  a plain sync query); `accessible-queries` (a `SignupForm` whose
  newsletter toggle swaps between `SubscribeToggle`, a `<div onClick>`
  with no role/tabIndex, and `SubscribeToggleFixed`, a real
  `<button role="switch" aria-checked>` — `getByRole("switch", ...)`
  is wrapped in `test.fails` against the broken version because it
  can't be found at all, then `getByTestId` is shown as the pragmatic but
  bug-signalling fallback).
- All 4 subagents were cut off mid-task by a session-level rate limit
  before finishing (`mocking-basics` was missing its `README.md` and, more
  seriously, its entire `src/index.css` — it would not have rendered at
  all; `testing-async-ui` was missing both its test file and `README.md`).
  The orchestrating session finished both packages by hand after the
  agents failed: wrote `mocking-basics/src/index.css` (copied from the
  `hooks/use-state-basics` base + package-specific classes,
  `search-box`/`search-results`/`explain-outcome.slow`/`.fast`, etc.) and
  its `README.md`; wrote `testing-async-ui/src/__tests__/user-profile.test.tsx`
  and its `README.md`. Also found and fixed the missing-`afterEach(cleanup)`
  issue described above across all 4 packages' `setupTests.ts` (none of
  the agents had added it, and none could have caught it by running the
  suite themselves — dependencies weren't installed yet at that point) and
  a stray `App.tsx` in `mocking-basics` that hid a plain `useState` call
  behind an unnecessary wrapper function with a bottom-of-file import,
  simplified back to a direct `useState` call matching every other
  concept's `App.tsx`.
- Orchestrating session then ran `pnpm install` once for all 4 new
  packages' dependencies together, then `pnpm typecheck`/`test`/`lint`/
  `format:check` — this surfaced three real problems the agents couldn't
  have caught themselves (dependencies weren't installed yet while they
  were writing code), all now fixed:
  - **Version picking matters more than "latest."** The agents (correctly
    told not to run `pnpm install` themselves) picked each dependency's
    current npm version by hand. The very latest `vitest@5.0.0`,
    `jsdom@30.0.1`, and `@testing-library/jest-dom@7.0.1` all declare
    `engines.node` ranges that exclude this environment's Node 20.19.0
    (jsdom 30 needs `^22.22.2`+, jest-dom 7 needs `>=22`) — jsdom failed
    outright (`webidl.util.markAsUncloneable is not a function`, a
    Node-version-gated internal undici API). Downgraded to
    `jsdom@^25.0.1`/`jest-dom@^6.6.3` (both Node ≥18) — check a
    dependency's `engines` field against the actual Node in use, not just
    "is this the newest version," especially right after a major bump.
  - **Mixing vitest majors across the monorepo breaks jest-dom's type
    augmentation.** `challenges/*` already pins `vitest@^2.1.5`; the new
    packages initially used `vitest@^3.2.4`/`^4.1.11`. jest-dom has no
    peer-specific pnpm install variant for `vitest` (it's an optional
    peer), so pnpm resolves its ambient `import 'vitest'` through a
    single shared "any version will do" symlink at
    `node_modules/.pnpm/node_modules/vitest` — which pointed at whichever
    vitest the _other_ packages happened to hoist. jest-dom's
    `declare module 'vitest' { interface Assertion ... }` augmentation
    landed on that unrelated version's `Assertion` type, not the one the
    new packages' own test files actually used, so every jest-dom matcher
    (`toBeInTheDocument`, `toHaveTextContent`, etc.) typechecked as
    missing even though the tests passed at runtime. Fixed by pinning all
    4 new packages to `vitest@^2.1.9`, matching `challenges/*` — one
    vitest major repo-wide removes the ambiguity entirely. (Runtime had
    its own version of this: with `vitest@4.1.11` specifically, jest-dom's
    matchers didn't even apply at _runtime_ — `expect().toHaveTextContent`
    threw "Invalid Chai property" — so version-align rather than chase the
    newest major for this stack.)
  - **`user-event` + `vi.useFakeTimers()` hung indefinitely** in
    `mocking-basics`' fake-timers test, even using `user-event`'s
    documented `advanceTimers` setup option (confirmed with a minimal
    repro: a bare `<input>`, no React, still hung). Fixed by using
    `fireEvent.change` instead of `user-event` for that one test — no
    async waiting of its own, so a fake clock can't stall it — noted in
    the theory panel/README as a narrow, deliberate trade-off rather than
    a general preference. Also needed a second, zero-length
    `await vi.advanceTimersByTimeAsync(0)` after the 300ms advance, since
    `searchApi()`'s `.then()` callback (and the `setState` inside it) is
    created _during_ the timer callback, one microtask hop later than
    what the first flush drains.
  - `pnpm lint` caught a real `react-hooks/set-state-in-effect` violation
    in `SearchBox`: synchronous `setResults`/`setIsSearching` calls at the
    top of the debounce effect. Fixed by moving the "query cleared" reset
    into the input's change handler (a direct response to that event, not
    an effect's job) and moving `setIsSearching(true)` inside the
    `setTimeout` callback instead of before scheduling it — every setState
    in that effect now happens from within a callback, not the effect
    body itself, which also means "Searching…" now only appears once the
    debounce window has actually elapsed.
  - Re-ran `pnpm typecheck`/`test`/`lint`/`format:check` (scoped to the
    changed files for formatting, since `format:check` already fails on
    several pre-existing, untouched files elsewhere in `concepts/`) after
    each fix — all 4 packages end clean: typecheck, lint, and every test
    file (36 tests total, including the 4 `test.fails` ones) passing.

### 2026-09-08 (patterns category completed)

- Built all 4 `patterns` packages in parallel via 4 subagents, each scoped
  to its own package directory (`compound-components` port 5361,
  `render-props` 5362, `controlled-vs-uncontrolled-components` 5363,
  `higher-order-components` 5364) — `patterns` is now ✅ complete. Each
  subagent verified its theory content against context7
  (`/reactjs/react.dev`) before writing: `compound-components` against
  `createContext`/`useContext` (including the React 19 `<Context
value={...}>` provider syntax and memoizing an object/function context
  value) and "Passing Data Deeply with Context"'s prop-drilling-vs-context
  framing; `render-props` against "Reusing Logic with Custom Hooks" plus
  react.dev's own current `Children`/render-prop-shaped examples (used to
  argue the pattern isn't purely obsolete, e.g. headless UI libraries);
  `controlled-vs-uncontrolled-components` against "Sharing State Between
  Components"'s controlled/uncontrolled section (the `Accordion`/`Panel`
  example is the direct official grounding for this package) and the
  `<input>` reference's controlled/uncontrolled caveats, cited to explain
  why React warns natively for `<input>` but not for custom components;
  `higher-order-components` against "Reusing Logic with Custom Hooks" —
  this subagent also confirmed current react.dev docs no longer cover HOCs
  as a pattern at all (the only hit was an anti-pattern warning against
  dynamically creating a "higher-order Hook"), and said so explicitly in
  its theory panel/README rather than presenting HOCs as current guidance.
- Each package follows the established contrast pattern:
  `compound-components` (a `TabsMonolith` config-array component vs.
  `Tabs`/`Tabs.List`/`Tabs.Tab`/`Tabs.Panels`/`Tabs.Panel` sharing state via
  Context, shown side by side with a shared "disable a tab" toggle to make
  the prop-plumbing cost concrete); `render-props` (`<MouseTracker>`
  function-as-children vs. `useMouseTracker()`, both driving an identical
  cursor-tracked dot so the two wirings are visibly interchangeable);
  `controlled-vs-uncontrolled-components` (one `Accordion` implementing the
  "controlled if the prop is defined" convention, demoed uncontrolled,
  controlled, and — since React has no built-in warning for custom
  components switching modes the way it does for `<input>` — a
  self-written `useEffect` guard whose `console.error` is captured and
  shown inline when an instance flips modes); `higher-order-components`
  (`withLoading` colliding with a wrapped component's own same-named
  `isLoading` prop, proven live via a debug readout, vs. `useLoading()`
  called directly with no collision risk, plus a static
  `withTheme(withLoading(SaveButton))` readout making "wrapper hell"'s
  `displayName` mangling concrete).
- Orchestrating session then ran `pnpm install` once. `render-props` failed
  `typecheck` (`tsc -b --noEmit`): `TS18047 'node' is possibly 'null'` in
  both `MouseTracker.tsx` and `useMouseTracker.ts`, inside a
  `function handleMouseMove(event) {...}` declared after an `if (!node)
return;` guard — TypeScript doesn't propagate narrowing of a `const`
  into a hoisted function _declaration_'s body, only into function
  _expressions_ created after the guard. Fixed both by changing
  `function handleMouseMove(event) {}` to `const handleMouseMove = (event)
=> {}`; re-ran typecheck clean. The other 3 packages typechecked clean
  with no changes needed.
- Full-repo `pnpm lint` was clean (the one warning it surfaces is the same
  pre-existing, unrelated issue in `challenges/easy/flatten-array` noted in
  earlier entries below). `pnpm format` (repo-wide `prettier --write .`)
  reformatted the new `patterns/*` files with no diff (subagents already
  matched Prettier's output) but also rewrote ~15 older, already-committed
  files across `forms-and-actions`/`state-management`/`concepts/README.md`/
  this doc — pure JSX-text-wrapping/prose-width drift unrelated to this
  session's work (consistent with the pre-existing `format:check` drift
  flagged in the `hooks`/`forms-and-actions` entries below). Reverted those
  unrelated files via `git checkout --` to keep this change scoped to
  `patterns/`; left that repo-wide drift out of scope again. Kept the
  `pnpm-lock.yaml` update (purely additive — the 4 new workspace packages).
- Updated `tooling/concept-manifest.ts`, `concepts/README.md`'s status
  table, and this doc's status-at-a-glance/patterns tables/Next-up section
  once, serially, from the orchestrating session (not per-subagent), per
  `concepts/CLAUDE.md`'s parallelization guidance. Also corrected a stale
  "up next" marker on `concurrent-features` in the Next-up list (it was
  already ✅ complete per the status table but the list hadn't been updated
  since) while editing the adjacent `patterns` line.

### 2026-09-08 (forms-and-actions category completed)

- Built all 5 `forms-and-actions` packages in parallel via 5 subagents,
  each scoped to its own package directory
  (`controlled-vs-uncontrolled-inputs` port 5331, `form-actions-basics`
  5332, `use-action-state-basics` 5333, `use-form-status-basics` 5334,
  `use-optimistic-basics` 5335) — `forms-and-actions` is now ✅ complete.
  Each subagent verified its theory content against context7
  (`/reactjs/react.dev`) before writing: `controlled-vs-uncontrolled-inputs`
  against the `<input>` reference's controlled/uncontrolled caveats and the
  exact "changing an uncontrolled input to be controlled" warning wording;
  `form-actions-basics` against the `<form>` reference's `action` prop
  (Transition semantics, no `preventDefault`, POST-only, automatic reset of
  uncontrolled fields on success); `use-action-state-basics` against the
  exact `useActionState(fn, initialState, permalink?)` signature and
  argument order; `use-form-status-basics` against `useFormStatus`'s
  `react-dom` import path, its `{ pending, data, method, action }` return
  shape, and the "must be called from a component nested inside the form"
  caveat; `use-optimistic-basics` against `useOptimistic`'s signature and
  react.dev's "no extra render to clear the optimistic state" reconciliation
  wording.
- Mid-run coordination hiccup, recorded so a future session recognizes the
  pattern: 3 of the first 5 subagents hit the account's session rate limit
  and were reported "failed" by the harness before finishing. Two of those
  three (`controlled-vs-uncontrolled-inputs`, `use-action-state-basics`,
  `use-optimistic-basics` — actually all three) had, on inspection, mostly
  or fully written their files before the failure; 2 packages
  (`form-actions-basics`, `use-form-status-basics`) had only scaffolding.
  Relaunched 2 fresh subagents for just the missing `App.tsx`/`index.css`/
  `README.md` trio once the rate limit reset. Those two subagents then
  appeared to stall (no visible progress across several `ListAgents`
  checks) — the orchestrating session started writing the same two
  packages by hand as a fallback, which raced with the subagents (they
  were in fact still alive, just slow) and caused real file-write
  collisions on both packages. Recovery: sent both subagents a heads-up
  message describing the collision and asking them to re-read and
  reconcile their own final `App.tsx`/`index.css`/`README.md` trio for
  internal consistency before reporting done, rather than reverting either
  side's edits. Both did — `use-form-status-basics`'s subagent explicitly
  found and fixed a real bug introduced by the interleaving (a
  `htmlFor`/`id` mismatch that broke the label/input association) and
  rewrote its README from scratch to match the component names actually
  on disk. **Lesson for next time:** don't start manually editing a
  subagent's files based on `ListAgents`' "started Xm ago" reading not
  advancing between checks — it was not a reliable stall signal here;
  checking file mtimes on disk (or just waiting for the actual completion
  notification) would have shown both were still progressing.
- Orchestrating session then ran `pnpm install` once, followed by
  `typecheck` and a production `build` per new package (all 5 clean once
  fixed — see below), then the full-repo `pnpm lint`, which caught one
  real bug: `controlled-vs-uncontrolled-inputs`'s render counter mutated a
  ref during render (`renderCountRef.current += 1`), tripping
  `react-hooks/refs`. Fixed by replacing the generic "count every render"
  ref with a `useState` counter incremented directly inside the controlled
  input's own `onChange` handler — a plain event-handler `setState` call,
  which is both lint-clean and a more precise demonstration (it now reads
  "controlled input re-renders" and ticks up exactly once per keystroke,
  rather than an unconditional per-render count that would also move on
  unrelated interactions like the other two demo inputs' buttons); updated
  the README's two references to match. Re-ran lint/typecheck/build clean
  after the fix. Reviewed all 5 `App.tsx`/`README.md` pairs by hand; no
  further correctness issues found. Also normalized two READMEs
  (`controlled-vs-uncontrolled-inputs`, `use-optimistic-basics`) that were
  missing the "fixed at `http://localhost:53xx`" callout the other three
  packages' "Run it" sections have. `pnpm format:check`'s pre-existing
  repo-wide drift (see hooks category note below) remains out of scope.
  Updated `tooling/concept-manifest.ts`, `concepts/README.md`'s status
  table, and this doc's status-at-a-glance/forms-and-actions
  tables/Next-up section once, serially, from the orchestrating session
  (not per-subagent), per `concepts/CLAUDE.md`'s parallelization guidance.

### 2026-09-08 (state-management category completed)

- Built all 4 `state-management` packages in parallel via 4 subagents, each
  scoped to its own package directory (`lifting-state-up` port 5321,
  `context-basics` 5322, `use-reducer-basics` 5323, `external-store-sync` 5324) — `state-management` is now ✅ complete. Each subagent verified its
  theory content against context7 (`/reactjs/react.dev`) before writing:
  `lifting-state-up` against "Sharing State Between Components"/"Managing
  State"; `context-basics` against `createContext`/`useContext`/`memo`
  (including the React 19 `<Context value={...}>` provider syntax) and the
  re-render/memoization semantics specifically; `use-reducer-basics`
  against the `useReducer` reference and "Extracting State Logic into a
  Reducer"; `external-store-sync` against `useSyncExternalStore` and "You
  Might Not Need an Effect"'s external-store section.
- Each package follows the established contrast pattern: `lifting-state-up`
  (two sibling temperature editors with independent `useState`s drifting
  out of sync vs. state lifted to their common parent), `context-basics`
  (three tabbed sub-demos — prop drilling vs. context, plus a dedicated
  memoization-pitfall demo with live render-count badges on
  `React.memo`-wrapped consumers), `use-reducer-basics` (a fetch-status
  `status`/`data`/`error` trio that reaches an invalid combination with
  loose `useState` calls vs. a discriminated-union reducer that makes it
  structurally unreachable, including a `never` exhaustiveness check),
  `external-store-sync` (a module-level store with an ad hoc
  `useState`+`useEffect` subscriber pair that can visibly tear under an
  artificial subscribe delay vs. a `useSyncExternalStore` pair that never
  does).
- Orchestrating session then ran `pnpm install` once, followed by
  `typecheck` and a production `build` per new package (all 4 clean), then
  the full-repo `pnpm lint` (clean — the one warning it surfaced is a
  pre-existing issue in `challenges/easy/flatten-array`, unrelated to this
  work). Reviewed all 4 `App.tsx`/`README.md` pairs by hand; no
  correctness issues found. Updated `tooling/concept-manifest.ts`,
  `concepts/README.md`'s status table, and this doc's status-at-a-glance/
  state-management tables/Next-up section once, serially, from the
  orchestrating session (not per-subagent), per `concepts/CLAUDE.md`'s
  parallelization guidance.

### 2026-09-08 (hooks category completed)

- Built the remaining 5 `hooks` packages in parallel via 5 subagents, each
  scoped to its own package directory (`use-effect-basics` port 5312,
  `use-ref-basics` 5313, `use-memo-basics` 5314, `use-callback-basics`
  5315, `custom-hooks-basics` 5316) — `hooks` is now ✅ complete. Each
  subagent verified its theory content against context7
  (`/react/react`/`react.dev` docs) before writing, rather than relying on
  training data.
- Orchestrating session then ran `pnpm install` once, and `typecheck` +
  `build` per new package, then the full-repo `pnpm lint` — which caught 4
  real correctness issues the subagents' generated demo code had (not
  their pedagogical anti-patterns, which are intentional): reading/writing
  `ref.current` during render (`use-ref-basics`'s "reveal" display,
  `use-callback-basics`'s ref-based render counter) and calling the impure
  `performance.now()` during render/inside a `useMemo` factory
  (`use-memo-basics`'s timing readout), plus a synchronous `setState` as
  the first line of an effect body (`use-effect-basics`'s initial
  active-listener-count sync). All four are exactly the kind of "don't do
  this in render" rules these concepts themselves teach, caught by
  `eslint-plugin-react-hooks`'s newer purity/refs/set-state-in-effect
  rules — fixed by: a lazy `useState` initializer instead of an effect-body
  `setState` (`use-effect-basics`); redesigning the "reveal" interaction in
  `use-ref-basics` so the ref's value is only ever read inside an event
  handler and copied into state, never read during render; swapping the
  `performance.now()` timing metric in `use-memo-basics` for a pure,
  deterministic "division checks performed" count; and rewriting
  `use-callback-basics`'s render counter using React's own sanctioned
  "adjust state while rendering" idiom (a guarded state comparison) instead
  of a mutated ref — which turned out to also fix a pre-existing StrictMode
  double-invoke count-doubling glitch. Re-ran lint/typecheck/build clean
  after fixes; updated the affected READMEs to match. `pnpm format:check`
  has pre-existing repo-wide drift (confirmed via `git stash` — even
  already-committed reference files like `use-state-basics` fail it), left
  out of scope.
- Updated `tooling/concept-manifest.ts`, `concepts/README.md`'s status
  table, and this doc's status-at-a-glance/hooks tables/Next-up section
  once, serially, from the orchestrating session (not per-subagent), per
  `concepts/CLAUDE.md`'s parallelization guidance.

### 2026-09-08

- Scaffolded all four `fundamentals` packages (`jsx-and-components`,
  `props-basics`, `rendering-lists-and-keys`, `conditional-rendering`),
  following the `use-state-basics` reference layout exactly (theory + demo
  - "what just happened" panels, contrast-driven demos).
- Verified each package with `pnpm lint`, `pnpm typecheck`, and a
  production `build` — all clean. One intentional lint suppression
  (`react-hooks/static-components` in `jsx-and-components`, commented) for
  the deliberate anti-pattern the concept demonstrates.
- Updated `concepts/README.md`'s status table.
- Created this `docs/plans/` tracking doc.
- Reordered this doc so `fundamentals` leads (matches build/learning
  order), added the at-a-glance status table, and fully scoped every
  remaining category down to named packages with a concrete core
  idea/contrast each — ready to build from directly next session. Flagged
  two open questions under `architecture` that need a decision before
  that category can be scoped as cleanly as the others.
- Verified `jsx-and-components`'s theory (JSX → `jsx(type, props)` element
  descriptor, lowercase-tag-as-string pitfall, component-defined-in-render
  losing identity) against context7/`/react/react` — it was written from
  training knowledge originally and had gone unverified; the other three
  `fundamentals` packages were already context7-checked when written.
- Added [`gallery/`](../../gallery): a plain (non-React) landing page that
  lists every concept by category and links to its dev server, with a live
  reachable/not-reachable dot per link. Gave every existing concept package
  a fixed `vite.config.ts` dev port (was the default auto-bumping 5173) so
  the gallery's links stay stable across runs — the scheme and the port
  registry live in `tooling/concept-manifest.ts`. Added `gallery` to
  `pnpm-workspace.yaml` (it's outside `concepts/*/*`/`challenges/*/*`, so
  needed its own entry). `pnpm dev` now boots everything, including the
  gallery, at `http://localhost:5300`. Verified end-to-end: booted the
  gallery plus two concept servers, confirmed the fixed ports and the
  live-reachability check both work.
