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

Legend: ✅ built · 🚧 in progress · 📋 scoped, not started.

| Category              | Built |  Scoped (planned)   | Status              |
| --------------------- | :---: | :-----------------: | ------------------- |
| `fundamentals`        |   4   |          0          | ✅ complete for now |
| `hooks`               |   1   |          5          | 🚧 partial          |
| `state-management`    |   0   |          4          | 📋 scoped           |
| `forms-and-actions`   |   0   |          5          | 📋 scoped           |
| `concurrent-features` |   0   |          4          | 📋 scoped           |
| `performance`         |   0   |          4          | 📋 scoped           |
| `patterns`            |   0   |          4          | 📋 scoped           |
| `testing`             |   0   |          4          | 📋 scoped           |
| `architecture`        |   0   | 2 (+ open question) | 📋 partially scoped |

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
| `use-effect-basics`   | 📋     | Effects sync a component with an external system. Contrast: an effect that subscribes without a cleanup function (duplicate subscriptions pile up across re-renders/remounts, very visible under `<StrictMode>`'s double-invoke) vs. one that returns a cleanup.         |
| `use-ref-basics`      | 📋     | Refs hold a mutable value that survives re-renders _without_ triggering one. Contrast: storing a value that should drive the UI in a ref (UI silently doesn't update) vs. the same value in `useState`; plus a DOM ref for imperative focus/scroll.                      |
| `use-memo-basics`     | 📋     | Contrast: an expensive computation re-run on every render (even for unrelated state changes) vs. wrapped in `useMemo` with the right dependency array. Pairs naturally with `react-memo-basics` in `performance`.                                                        |
| `use-callback-basics` | 📋     | Contrast: a new function identity every render breaking a memoized child's `React.memo` bail-out vs. `useCallback` stabilizing it. Needs `react-memo-basics`-style child to make the effect visible — consider building after/alongside `performance/react-memo-basics`. |
| `custom-hooks-basics` | 📋     | Extracting shared stateful logic into a hook (e.g. `useToggle` or `useLocalStorageState`); rules of hooks (top-level only, hooks/components only) and why a hook is "just a function that calls other hooks."                                                            |

## `state-management`

Covers: Context, `useReducer`, lifting state up, external stores.

| Package               | Status | Core idea / contrast                                                                                                                                                                                                                                |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lifting-state-up`    | 📋     | Two sibling components each holding their own local copy of the same logical state (they drift out of sync) vs. lifting it to their common parent and passing it down.                                                                              |
| `context-basics`      | 📋     | Prop drilling a value through several layers of components that don't use it, vs. `createContext`/`useContext`. Include the "every consumer re-renders" pitfall when the context value is a fresh object literal each render, vs. a memoized value. |
| `use-reducer-basics`  | 📋     | A component with several related `useState` calls that can be updated inconsistently (invalid combinations) vs. one `useReducer` with a defined action set that keeps transitions valid.                                                            |
| `external-store-sync` | 📋     | Reading a value from a store that lives outside React (e.g. `window` size, or a tiny custom event-emitter store) via ad hoc `useState` + manual subscription (risk of tearing/missed updates) vs. `useSyncExternalStore`.                           |

## `forms-and-actions`

Covers: controlled inputs, React 19 Actions, `useActionState`,
`useFormStatus`, `useOptimistic`.

| Package                             | Status | Core idea / contrast                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `controlled-vs-uncontrolled-inputs` | 📋     | `value` + `onChange` (React owns the input's value) vs. `defaultValue` + a ref (the DOM owns it). When each is the right call, and the "switching between controlled/undefined value" console warning. Scoped to form inputs specifically — see `patterns/controlled-vs-uncontrolled-components` for the general component-design version of this idea. |
| `form-actions-basics`               | 📋     | A traditional `onSubmit` handler with manual `preventDefault`, manual pending-state `useState`, and manual error handling vs. a React 19 `<form action={fn}>` Action.                                                                                                                                                                                   |
| `use-action-state-basics`           | 📋     | `useActionState` for form state + validation error display across submissions, including the pending flag it returns.                                                                                                                                                                                                                                   |
| `use-form-status-basics`            | 📋     | A submit button nested a few levels inside a `<form>` that needs to know "is this form submitting" without prop-drilling a flag down vs. `useFormStatus` read directly in the nested component.                                                                                                                                                         |
| `use-optimistic-basics`             | 📋     | UI that waits for a round trip before showing a new item (e.g. a comment/like) vs. `useOptimistic` showing it immediately and reconciling (or rolling back) when the real response lands.                                                                                                                                                               |

## `concurrent-features`

Covers: Suspense, transitions (`useTransition`, `useDeferredValue`), the
`use()` API.

| Package                     | Status | Core idea / contrast                                                                                                                                                                                           |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suspense-basics`           | 📋     | A `<Suspense>` boundary with a `fallback`, wrapping a component that suspends on a pending promise/lazy import — what "suspending" actually means vs. a manual `isLoading` flag.                               |
| `use-transition-basics`     | 📋     | An expensive render triggered synchronously (UI freezes/janks) vs. the same update wrapped in `startTransition`, using `isPending` to keep the UI responsive and interruptible.                                |
| `use-deferred-value-basics` | 📋     | A search-as-you-type list whose expensive re-render lags every keystroke vs. rendering the list from a `useDeferredValue`-wrapped query, keeping the input itself responsive.                                  |
| `use-api-basics`            | 📋     | The `use()` hook reading a promise or context conditionally (inside an `if`/loop — something regular hooks can't do) vs. the old `useEffect` + `useState` data-fetching dance, inside a `<Suspense>` boundary. |

## `performance`

Covers: memoization, code-splitting, virtualization, profiling.

| Package                   | Status | Core idea / contrast                                                                                                                                                                                                                        |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-memo-basics`       | 📋     | A child re-rendering every time its parent does, even with unchanged props, vs. wrapped in `React.memo`. Include the pitfall that a fresh object/array/function prop each render (see `hooks/use-callback-basics`) defeats the memoization. |
| `code-splitting-lazy`     | 📋     | One large upfront bundle vs. `React.lazy` + `Suspense` splitting a rarely-used view into its own chunk, shown via the Network panel / a visible loading fallback.                                                                           |
| `list-virtualization`     | 📋     | Rendering a few thousand DOM nodes for a long list (visible jank on scroll) vs. windowing so only the visible slice is ever mounted.                                                                                                        |
| `profiling-with-devtools` | 📋     | A deliberately over-rendering component tree instrumented with the `<Profiler>` API (or a walkthrough of React DevTools' Profiler tab) to _find_ the problem the other performance packages fix.                                            |

## `patterns`

Covers: compound components, render props, controlled/uncontrolled, HOCs.

| Package                                 | Status | Core idea / contrast                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compound-components`                   | 📋     | A `<Tabs>`/`<Tab>`-style API sharing implicit state via Context internally, vs. the same feature built by prop-drilling every option down from one giant component.                                                                                                        |
| `render-props`                          | 📋     | Sharing stateful logic via a function-as-child/prop (the pre-hooks pattern) vs. the same logic extracted into a custom hook — showing _why_ hooks displaced most render-prop use cases.                                                                                    |
| `controlled-vs-uncontrolled-components` | 📋     | The general component-design version of controlled/uncontrolled (e.g. an `<Accordion>` that can be either parent-driven via props+callback, or self-managed) — distinct from `forms-and-actions/controlled-vs-uncontrolled-inputs`, which is specifically about `<input>`. |
| `higher-order-components`               | 📋     | A HOC injecting props (e.g. `withLoading`) vs. the equivalent custom hook — the naming-collision/prop-shadowing/wrapper-hell pitfalls that motivated moving away from HOCs.                                                                                                |

## `testing`

Covers: React Testing Library, Vitest, mocking, accessibility queries.

| Package              | Status | Core idea / contrast                                                                                                                                                      |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rtl-basics`         | 📋     | `render` + `screen` + `user-event`; a test coupled to implementation details (class names, component internals) vs. one that queries and interacts the way a user would.  |
| `testing-async-ui`   | 📋     | Testing a component with loading/error/success states from an async fetch — `findBy*`/`waitFor`, and the flaky-test pitfall of not awaiting async UI updates.             |
| `mocking-basics`     | 📋     | A test that hits a real network call or real timers (slow, flaky) vs. mocking the module/`fetch`/timers at the boundary with Vitest's `vi.mock`/`vi.useFakeTimers`.       |
| `accessible-queries` | 📋     | `getByRole`/`getByLabelText` and friends vs. `data-testid` as a last resort — how accessible queries double-check the UI is actually usable, not just present in the DOM. |

## `architecture`

Covers: project structure, data-fetching patterns, Server Components
(conceptually).

| Package                          | Status | Core idea / contrast                                                                                                                                    |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-fetching-patterns`         | 📋     | A waterfall of sequential `useEffect` fetches (each blocked on the last) vs. kicking off independent requests in parallel and combining loading states. |
| `server-components-conceptually` | 📋 ⚠️  | See open question below before building — this repo's packages are Vite/CSR-only, so an actual RSC boundary can't run here.                             |

**Open questions (resolve before building further in this category):**

- `server-components-conceptually` can't be a normal runnable Vite app the
  way every other concept is (no server, no RSC runtime) — decide whether
  it becomes a comparison-only README (breaking the "must be a runnable
  demo" rule deliberately, with that noted explicitly), a diagram-heavy
  in-app write-up with no live demo panel, or gets dropped in favor of
  covering the idea inside `data-fetching-patterns`' README instead of as
  its own package.
- Project structure (folder-by-feature vs. folder-by-type, etc.) doesn't
  obviously fit the "small runnable idea" concept-app format either — it
  may be better suited to a repo-level architecture doc than a
  `concepts/architecture/*` package. Decide the format before scoping it
  as a package here.

## Next up

Suggested default order — each category leans on the ones before it, so
this isn't arbitrary, but it's not a hard constraint either:

1. ~~`fundamentals`~~ ✅ done
2. `hooks` — finish out the remaining 5 (state-management and everything
   after leans on `useEffect`/`useRef`/`useMemo`/`useCallback`)
3. `state-management`
4. `forms-and-actions`
5. `concurrent-features`
6. `performance` (pairs well with `hooks/use-memo-basics` +
   `hooks/use-callback-basics` — consider interleaving)
7. `patterns`
8. `testing` (arguably worth pulling earlier — nothing here depends on it
   existing last, it's just been convention to test what already exists)
9. `architecture` — resolve the open questions above first

## Session log

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
