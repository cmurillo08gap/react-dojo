# Concept: `useMemo` basics

**Category:** hooks
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A component's render body re-runs on **every** state change, even ones
  that have nothing to do with a given piece of derived data. A call sitting
  directly in the render body — `const value = expensiveFn(n)` — pays the
  full cost of `expensiveFn` on every single one of those renders.
- `useMemo(calculate, deps)` caches `calculate`'s return value between
  renders and only re-invokes `calculate` when a value in `deps` has
  actually changed (compared element-wise with `Object.is`). Otherwise it
  hands back the previously cached result without running `calculate` at
  all.
- The **dependency array** is what makes this safe: it must list every
  reactive value the calculation reads. Get it right and an unrelated
  re-render costs nothing extra for that calculation.

Run it:

```bash
pnpm --filter concept-use-memo-basics dev
```

Open the printed local URL. The page renders a deliberately slow, pure
function — counting primes below `N` by trial division — two ways side by
side: once called directly (naive) and once wrapped in `useMemo(..., [n])`
(memoized). Click one of the `N = …` buttons to change the actual
dependency, then click "Re-render (unrelated state)" a few times and watch
each card's "Computed _ times" counter and "Division checks last run"
readout — the naive card keeps climbing on every click, the memoized card
only climbs when `N` itself changes. (Division-check count is used instead
of a wall-clock timer deliberately — timing a computation with
`performance.now()` inside render, or inside a `useMemo` factory, calls an
impure function while React is rendering; see the code comment on
`countPrimesBelow` for the real tool for measuring render cost: React
DevTools' Profiler tab.)

## Key takeaways

- `useMemo` is a **performance optimization**, not a correctness tool — the
  app must behave identically (just slower) if you deleted the `useMemo`
  wrapper and called the function directly every render. If deleting it
  breaks something, that's a different bug to fix, not a job for `useMemo`.
- Skip it for cheap calculations. `useMemo` itself has a small bookkeeping
  cost (storing and comparing the dependency array), so it only pays off
  once the wrapped calculation is genuinely expensive.
- A missing or wrong dependency array is the two ways to get this wrong:
  omit it entirely and `calculate` runs every render anyway (no caching);
  list too few dependencies and the cached value silently goes stale.
- **React 19 / the Compiler:** React ships an opt-in Compiler (a build-time
  Babel plugin) whose explicit design goal is to infer this kind of
  memoization automatically, removing most hand-written `useMemo` /
  `useCallback` / `React.memo` calls. It is **not** wired into this repo's
  plain Vite setup, so every concept package here — this one included —
  still needs the manual hook. Treat the naive-vs-memoized contrast in this
  demo as exactly the work the Compiler would otherwise be doing for you.

## Discussion / interview questions

1. Why does clicking "Re-render (unrelated state)" bump the naive card's
   counter but not the memoized one's?
2. What are the two ways a dependency array can be _wrong_, and what does
   each one break (staleness vs. no caching at all)?
3. If `countPrimesBelow` only ever performed a handful of division checks
   instead of thousands, would wrapping it in `useMemo` still be a good
   idea? Why or why not?
4. The React Compiler aims to automate most manual memoization. Given that,
   why is it still worth understanding `useMemo`'s actual mechanics rather
   than just relying on the Compiler everywhere?

## Further reading

- [react.dev — `useMemo`](https://react.dev/reference/react/useMemo)
- [react.dev — `useMemo`: Skipping expensive recalculations](https://react.dev/reference/react/useMemo#skipping-expensive-recalculations)
- [react.dev — React Compiler](https://react.dev/learn/react-compiler)
