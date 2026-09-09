# Concept: `use()` API basics

**Category:** concurrent-features
**Difficulty:** intermediate
**Status:** template — expand as you work through it

This builds on [`concurrent-features/suspense-basics`](../suspense-basics),
which covers `<Suspense>` boundary/fallback mechanics in depth — this
package focuses on `use()` itself: reading a Promise or a Context from
inside a component body, and the one Rules-of-Hooks exception that makes
it different from every other Hook.

## What this demonstrates

- **`use()` can be called conditionally.** Per React's own
  `eslint-plugin-react-hooks` docs: "The `use` hook is an exception to the
  standard Rules of Hooks and can be called conditionally or within loops."
  `useState`, `useContext`, `useEffect`, and every other Hook must run
  unconditionally, in the same order, on every render — `use()` is
  exempt. The demo shows this two ways: an `if`/`else` that reads a
  _different Context_ depending on a prop, and a Promise read that only
  happens _after_ an early return.
- **Reading a Context** with `use(context)` reads the same value
  `useContext(context)` would (nearest provider above, or the default
  value) — the only difference is that `use()` can be called from a branch
  and `useContext` cannot.
- **Reading a Promise** with `use(promise)` requires a `<Suspense>`
  boundary above it: while the promise is pending, the component
  suspends and the boundary's fallback shows instead. If the promise
  rejects, `use()` re-throws that rejection during render and React walks
  up to the **nearest error boundary** to handle it — there's no
  try/catch (in fact `use()` must never be wrapped in one).
- **The old way, side by side:** the same "load a profile" request
  implemented with `useEffect` + three separate `useState` calls
  (`data`/`loading`/`error`) next to the `use(promise)` + `<Suspense>` +
  error-boundary version — same simulated network delay, same "Simulate
  failure" toggle, so the amount of boilerplate and the different
  error/loading model are something you can watch, not just read about.

Run it:

```bash
pnpm --filter concept-use-api-basics dev
```

Open the printed local URL (fixed at `http://localhost:5344`). The page
shows a theory panel, the interactive demo, and a "What just happened"
panel that updates with the exact code that ran and why. In the demo:

1. On **1. Conditional calls**, switch "Audience" between Beginner and
   Expert — each click runs a _different_ `use()` call inside the same
   `if`/`else`, something `useContext` could never do. Then toggle "Show
   bonus fact": `use()` is only reached _after_ an early return, once
   `show` is true.
2. Switch to **2. Data fetching** and click "Fetch profile". Both columns
   kick off the same simulated 1.2s request. Notice the manual column
   needs a loading flag, a data field, and an error field all managed by
   hand; the `use()` column's component body only has to handle success —
   the pending/error states live in the `<Suspense>` fallback and the
   error boundary instead.
3. Turn on **Simulate failure** and click "Fetch profile" again. The
   manual column's `.then()` error callback sets its own error state; the
   `use()` column's promise rejection is caught by the error boundary
   wrapping it, with no code in the component itself aware that anything
   went wrong.

## Key takeaways

- `use(promise)` and `use(context)` are the two things `use()` accepts;
  it reads a Context exactly like `useContext` would, and unwraps a
  Promise's resolved value (or suspends/throws while it settles).
- `use()` is the one API in React explicitly carved out of the Rules of
  Hooks: it can be called conditionally, inside loops, and after early
  returns. It still can't be called from outside a component or Hook, and
  it can never be wrapped in `try`/`catch` — it relies on throwing
  internally to integrate with Suspense and error boundaries.
- A Promise passed to `use()` **must be cached** across renders (a plain
  `Map` keyed by whatever varies is enough, as this demo's
  `fetchProfileResource` shows) — creating a fresh Promise every render
  means the component suspends forever, since from React's point of view
  it's always waiting on a Promise that never gets the chance to resolve.
- On rejection, `use()` re-throws to the nearest error boundary — which,
  as of this writing, still means a class component
  (`componentDidCatch`/`getDerivedStateFromError`), since React has no
  Hook-based error boundary API yet.
- In a Server Component, the same job is usually just a top-level
  `await` — `use()` exists because Client Components can't `await`
  during render.

## Discussion / interview questions

1. Why is `use()` allowed to be called conditionally, in loops, or after
   an early return, when every other Hook is explicitly forbidden from
   that? What is different about how React tracks `use()` internally?
2. What actually happens, step by step, when `use(promise)` is called on
   a pending Promise — what does "the component suspends" mean for the
   parent `<Suspense>` boundary and for this component's own remaining
   render work?
3. Why must a Promise passed to `use()` be cached instead of created
   fresh during render? What would you observe in the demo's "Fetch
   profile" column if `fetchProfileResource` created a brand-new Promise
   on every call instead of reusing one from its `Map`?
4. Compare the error handling models: the manual column's `catch`/`.then()`
   error state vs. the `use()` column's error boundary. What has to change
   in each approach if you want a "Retry" button, and which one required
   more of that logic to be written by hand?

## Further reading

- [react.dev — `use`](https://react.dev/reference/react/use)
- [react.dev — Rules of Hooks (`eslint-plugin-react-hooks`): the `use` exception](https://react.dev/reference/eslint-plugin-react-hooks/lints/rules-of-hooks)
- [react.dev — `<Suspense>`](https://react.dev/reference/react/Suspense)
