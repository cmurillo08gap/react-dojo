# Concept: `React.memo` basics

**Category:** performance
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A plain function component re-renders every time its parent does, even
  when its own props haven't changed at all — it has no mechanism to opt
  out.
- `React.memo` wraps a component and does a **shallow equality check** of
  its previous vs. next props on every re-render; if every prop compares
  equal, React skips re-rendering that component (and its subtree)
  entirely.
- The pitfall: an inline object, array, or function literal written
  directly in JSX (`onClick={() => ...}`, `options={{ ... }}`) is a **new
  reference every render**, even when its contents are identical. Passed
  to a memoized child, that defeats the shallow check completely — the
  child re-renders anyway, and `React.memo` provides zero benefit.
- The fix: stabilize that prop's reference in the parent with
  `useCallback` (functions) or `useMemo` (objects/arrays), so
  `React.memo`'s comparison actually sees "same props" and bails out.

This package shows three contrasting children side by side:

1. **Plain child** — no `React.memo` — always re-renders with its parent.
2. **Memoized, defeated** — `React.memo`, but the parent passes a fresh
   inline function every render.
3. **Memoized, working** — the _same_ `React.memo`-wrapped component, but
   the parent now passes a `useCallback`-stabilized function.

Run it:

```bash
pnpm --filter concept-react-memo-basics dev
```

Open the printed local URL (fixed at `http://localhost:5351`). Click
**Tick** repeatedly — it only changes an unrelated counter in the parent —
and watch the "Renders: N" badge on each child: Plain and Defeated climb on
every click, Working does not move. Then click the "Why?" buttons to see
the exact code and reasoning behind each one, and **Reset** to remount all
three children and start the counts over.

## Key takeaways

- `React.memo`'s comparison is shallow, not deep — it compares each prop by
  reference (`Object.is`), not by recursively inspecting object contents.
- A component wrapped in `React.memo` is only as effective as the
  stability of the props it receives; an unstabilized function/object/array
  prop silently defeats it.
- `React.memo` cannot prevent a component from re-rendering because of its
  **own** local state or context change — it only gates re-renders driven
  by the parent re-rendering with unchanged props.
- Reach for `React.memo` (plus `useCallback`/`useMemo` on the props it
  receives) when profiling shows a specific, expensive subtree re-rendering
  unnecessarily — not as a default wrapper on every component.

## Discussion / interview questions

1. Why does wrapping `MemoChild` in `React.memo` do nothing by itself in
   the "Defeated" scenario? What specifically changes between "Defeated"
   and "Working"?
2. `React.memo`'s shallow comparison checks `label` too — why doesn't that
   comparison ever fail across renders in this demo?
3. Would `React.memo` help at all if `MemoChild` itself called
   `useState`/`useContext` and that state/context changed? Why or why not?
4. React 19 ships the React Compiler, which can auto-memoize components and
   stabilize values at build time in many cases. This repo's packages don't
   enable it, so this demo relies on manual `React.memo`/`useCallback`. If
   the Compiler were enabled here, which of the three children's behavior
   would you expect to change, and which would you still want to verify by
   profiling rather than assuming?

## Further reading

- [react.dev — `memo`](https://react.dev/reference/react/memo)
- [react.dev — `useCallback`](https://react.dev/reference/react/useCallback)
- [react.dev — `useMemo`](https://react.dev/reference/react/useMemo)
