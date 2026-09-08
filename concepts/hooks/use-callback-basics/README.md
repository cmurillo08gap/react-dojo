# Concept: `useCallback` basics

**Category:** hooks
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Every render creates a **brand-new function object** for an inline arrow
  function, even when its source code is identical to the previous render's.
- `React.memo(Component)` skips re-rendering a component when every prop is
  shallow-equal (`Object.is`, per prop) to last render's — but a fresh
  function identity on every render defeats that check for any prop that is
  a callback.
- `useCallback(fn, deps)` returns the **same function reference** across
  renders as long as nothing in `deps` changed (compared position-by-position
  with `Object.is`), which is what lets a memoized child's callback prop stay
  stable and its `React.memo` bail-out actually fire.
- The contrast: a parent re-render triggered by state the child doesn't even
  use (an "unrelated" tick) still bumps a naively-defined child's render
  count, but leaves a `useCallback`-stabilized child's render count
  untouched.

Run it:

```bash
pnpm --filter concept-use-callback-basics dev
```

Open the printed local URL. Toggle between the **naive** and **stabilized**
variants, then click **"Re-render parent (unrelated state)"** — watch
`MemoizedChild`'s own render count in the demo panel. In the naive variant it
increases on every click even though the child's `onIncrement` prop does
nothing different; in the stabilized variant it stays put. Also try
**"Increment counter (from inside child)"** in both variants: it's the
callback's _own_ dependency changing, and even that doesn't re-render the
child once it's stabilized, because the child never displays the counter
itself — only its props matter to `React.memo`.

## Key takeaways

- `useCallback` doesn't prevent the parent from re-rendering — it prevents a
  **memoized child** from re-rendering as a side effect of the parent
  re-rendering for an unrelated reason.
- `useCallback(fn, deps)` is shorthand for `useMemo(() => fn, deps)`: it
  memoizes the function value itself, not whatever the function returns when
  called.
- Pairing `useCallback` with a plain (non-memoized) child does nothing
  useful — the child re-renders whenever its parent does regardless of prop
  identity, so there's nothing for the stable reference to protect.
- This repo's Vite setup (`@vitejs/plugin-react`, no React Compiler Babel
  plugin) only performs the classic JSX transform — it does not auto-memoize
  anything, so this manual `useCallback` + `React.memo` pairing is genuinely
  necessary here. Where the React Compiler is enabled, one of its explicit
  design goals is to remove the need for manual `useMemo`/`useCallback`/
  `React.memo` by inferring equivalent memoization automatically.
- Manual memoization isn't free — tracking a dependency array has its own
  per-render cost — so reach for `useCallback` because a memoized consumer is
  measurably re-rendering too often, not speculatively on every function
  prop.

## Discussion / interview questions

1. Why does the naive variant's child re-render on "Re-render parent" even
   though `MemoizedChild` never reads `unrelatedTick`?
2. Why doesn't clicking the stabilized child's own button re-render the
   child, even though that click is exactly what changes the `counter` the
   callback closes over?
3. `useCallback(fn, deps)` vs `useMemo(() => fn, deps)` — what's actually
   different between them?
4. When is wrapping a callback in `useCallback` pure overhead rather than an
   optimization? What has to be true on the _receiving_ end for it to pay off?

## Further reading

- [react.dev — `useCallback`](https://react.dev/reference/react/useCallback)
- [react.dev — `memo`](https://react.dev/reference/react/memo)
- [react.dev — Skipping re-rendering when props are unchanged](https://react.dev/reference/react/memo#skipping-re-rendering-when-props-are-unchanged)
- [react.dev — React Compiler](https://react.dev/learn/react-compiler)
