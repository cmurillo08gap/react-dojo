# Concept: `useDeferredValue` basics

**Category:** concurrent-features
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Filtering a large, artificially expensive list directly from live input
  state makes **typing itself** feel slow — the **naive** version here
  computes `filterDataset(query)` on every render, so the input's own
  updated value can't commit until that whole expensive pass over a
  3,000-item dataset finishes.
- `useDeferredValue(value, initialValue?)` returns a version of `value`
  that's allowed to **lag behind** during heavy updates: the input still
  renders from the live `query` and stays instantly responsive, while the
  expensive list is computed from `deferredQuery` instead, catching up once
  React can afford the background render.
- `const isStale = query !== deferredQuery` is a direct way to detect
  whether that background render has caught up yet — used here to dim the
  result list while it's behind.
- React 19 added the optional second `initialValue` argument, used only for
  the very first render (before any deferral has happened); omitting it
  just uses `value` on that first render.
- How this differs from fixed-delay **debouncing/throttling** (adapts to
  device speed, and the background render is interruptible by new input)
  and from **`useTransition`** (which wraps the code that _produces_ a
  state update, rather than deferring a value you're handed with no setter
  to wrap).

Run it:

```bash
pnpm --filter concept-use-deferred-value-basics dev
```

Open the printed local URL (fixed at `http://localhost:5343`). The page
shows a theory panel, the interactive demo, and a "What just happened"
panel that updates with the exact code that ran and why. In the demo:

1. Stay on **Naive** and type a few characters into the search box. Notice
   the input itself feels sluggish — every keystroke pays the cost of
   re-filtering the whole dataset before it can even show the character you
   just typed.
2. Switch to **useDeferredValue** and type the same thing. The input stays
   smooth immediately; the result list dims (`⏳ stale`) for a moment, then
   updates once the deferred value catches up.
3. Watch the match count and the stale/fresh badge while typing quickly —
   the badge flips to `✓ fresh` only once React has finished the background
   render for your latest keystroke.

## Key takeaways

- `useDeferredValue`'s signature is
  `const deferredValue = useDeferredValue(value, initialValue?)`. `value` is
  required; the optional `initialValue` (React 19+) is used only on the
  component's first render.
- On an urgent update (like typing), React first commits a render that
  keeps the _previous_ deferred value, then schedules an interruptible,
  lower-priority background render with the new value — if another urgent
  update arrives first, that background render is abandoned and restarted
  rather than blocking on stale work.
- Detect staleness by comparing the live value to the deferred one
  (`value !== deferredValue`) — a common pattern for dimming/fading UI that
  hasn't caught up yet, as this demo's result list does.
- Unlike debouncing/throttling's fixed time delay, `useDeferredValue`
  integrates with React's scheduler: it adapts to device speed automatically
  and its background render is interruptible, instead of always waiting out
  a fixed timer regardless of render cost.
- Unlike `useTransition` — which wraps the _code that calls a setter_
  (`startTransition(() => setState(...))`) — `useDeferredValue` defers a
  _value you're given_ (a prop, or something from a hook you don't own)
  where there's no setter to wrap in the first place. Per react.dev's
  `startTransition` caveats: transitions "cannot be used to control text
  inputs... If you need to trigger a transition based on prop changes or
  values from custom hooks, `useDeferredValue` is the recommended
  alternative."
- Pass primitives or referentially stable objects — an object literal
  created fresh every render always looks "new" to `useDeferredValue`'s
  equality check, so it can never reuse the previous deferred value.

## Discussion / interview questions

1. In the naive mode, why does the _input_ itself lag, not just the result
   list — after all, the input's value comes from `query`, not from the
   expensive computation?
2. How does `useDeferredValue`'s "lag, then catch up" behavior differ from
   wrapping the list update in `useTransition`'s `startTransition`? When
   would you reach for one over the other?
3. How is `useDeferredValue` different from debouncing the search input
   with `setTimeout`? What does a fixed-delay debounce get wrong that
   `useDeferredValue` handles automatically?
4. What would happen to the "stale" detection (`query !== deferredQuery`)
   if `query` were an object literal created fresh on every render instead
   of a string? Why does that break the comparison?

## Further reading

- [react.dev — `useDeferredValue`](https://react.dev/reference/react/useDeferredValue)
- [react.dev — `useTransition` (`startTransition` caveats)](https://react.dev/reference/react/useTransition)
