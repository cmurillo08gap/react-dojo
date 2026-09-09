# Concept: Code-splitting with `React.lazy`

**Category:** performance
**Difficulty:** intermediate
**Status:** template — expand as you work through it

## What this demonstrates

- By default a bundler follows every static `import` from your entry point
  and concatenates the reachable code into one main JS file — a rarely-used
  view ships to every visitor even if they never open it.
- `React.lazy(() => import("./Module"))` wraps a **dynamic** `import()`,
  which is the signal Vite/Rollup use to split that module into its own
  chunk, fetched over the network only when it's actually needed.
- `Suspense`'s `fallback` renders while that `import()` promise is pending —
  the same mechanism used for data-fetching Suspense, but here guarding a
  code fetch instead (data-fetching Suspense is covered separately in
  `concurrent-features/suspense-basics`).
- Once a lazily-imported module resolves, the module cache keeps it resolved
  — remounting the same lazy component later doesn't re-fetch or re-suspend.

Run it:

```bash
pnpm --filter concept-code-splitting-lazy dev
```

Open the printed local URL (fixed at `http://localhost:5352`). The page
shows a theory panel, the interactive demo, and a "What just happened"
panel that updates with the exact code that ran and why.

In the demo:

1. Click **Show eager panel** — it appears instantly. `EagerPanel` is a
   normal top-of-file `import`, so its code is already sitting in the main
   bundle; there's nothing left to fetch or parse.
2. Click **Show lazy panel** — you'll see a spinner for about 1.2s (an
   artificial delay so the loading state is reliably visible regardless of
   real network speed) before `HeavyPanel` appears. That delay stands in for
   the network fetch + parse of a separate chunk.
3. Hide the lazy panel and show it again — no spinner this time. The dynamic
   `import()` already resolved once, so the module cache serves it
   synchronously and `Suspense` has nothing to wait on.

### Verifying the split for real

This repo can't show you a live Network panel, so the concrete, verifiable
artifact is the build output itself:

```bash
pnpm --filter concept-code-splitting-lazy build
```

Then look inside `dist/assets`. You should see a separate chunk file for
`HeavyPanel` (its filename will include `HeavyPanel` in the hash-suffixed
name) distinct from the main `index-*.js` chunk that contains `App`,
`EagerPanel`, and everything else. That separate file is the proof: only
`HeavyPanel`'s code was pulled out because it's reached exclusively through
a dynamic `import()`, never a static one.

## Key takeaways

- Static `import` → bundled eagerly into the chunk that reaches it. Dynamic
  `import()` → its own chunk, fetched on demand.
- `React.lazy` expects a function returning a dynamic `import()` that
  resolves to a module with a **default export** — that's why `HeavyPanel`
  is exported as `export default function HeavyPanel()`.
- Every lazy component needs a `Suspense` ancestor with a `fallback`; a lazy
  component rendered outside `Suspense` throws when its import is still
  pending.
- The trade-off is real: eager loading has zero loading-state complexity but
  costs bundle size up front; lazy loading shrinks the initial bundle but
  requires designing a loading state — and, once loaded, that cost is paid
  only once per session thanks to the module cache.

## Discussion / interview questions

1. Why does `HeavyPanel.tsx` need a default export, while `EagerPanel.tsx`
   doesn't?
2. What happens if you render `<LazyPanel />` without wrapping it in
   `<Suspense>`? Why?
3. Where in a real app would you draw the line between "eager" and "lazy"
   — what's a good heuristic for deciding a component is worth its own
   chunk?
4. The demo shows the fallback only on the _first_ render of `LazyPanel`.
   How would route-based code-splitting (e.g. lazy-loading each page)
   change how often users see a loading state in practice?

## Further reading

- [react.dev — `lazy`](https://react.dev/reference/react/lazy)
- [react.dev — `Suspense`](https://react.dev/reference/react/Suspense)
