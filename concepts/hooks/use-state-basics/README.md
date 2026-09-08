# Concept: `useState` basics

**Category:** hooks
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- State is local to the component instance and persists across re-renders.
- The **updater function** form of the setter (`setCount(c => c + 1)`) reads
  the latest state, avoiding stale-closure bugs when an event handler calls
  the setter more than once, or when the update depends on state captured
  earlier in an async callback.
- React **batches** state updates triggered inside the same event handler
  (and, since React 18, inside promises/timeouts/native handlers too) into a
  single re-render.

Run it:

```bash
pnpm --filter concept-use-state-basics dev
```

Open the printed local URL and click the buttons in `src/App.tsx` — in
particular, compare `+2 (stale closure bug)` against `+2 (updater fn,
correct)`.

## Key takeaways

- Prefer the updater-function form whenever the new state depends on the
  previous state.
- `useState`'s setter identity is stable across renders — safe to omit from
  a `useEffect`/`useCallback` dependency array.
- Calling the setter with a value referentially equal (`Object.is`) to the
  current state **bails out** of the re-render (still runs the render
  function on the *first* call in dev/StrictMode double-invoke, but skips
  committing/re-rendering children).

## Discussion / interview questions

1. Why does `incrementTwiceUnsafely` only add 1 instead of 2?
2. What does React do differently in development under `<StrictMode>` that
   makes stale-closure bugs like this easier to spot?
3. When would you reach for `useReducer` instead of multiple `useState`
   calls?
4. Is `setCount(count)` (same value) guaranteed to skip a re-render? What
   does "guaranteed" mean here — of the component itself vs. its children?

## Further reading

- [react.dev — `useState`](https://react.dev/reference/react/useState)
- [react.dev — Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
