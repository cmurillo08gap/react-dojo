# Concept: External store sync

**Category:** state-management
**Difficulty:** intermediate
**Status:** template — expand as you work through it

## What this demonstrates

- A tiny **external store** — plain module state plus a listener list, no
  React involved — the same shape as a real external store you'd have to
  integrate with (`window` size, `navigator.onLine`, a WebSocket cache, a
  Redux-less pub/sub singleton).
- The **ad hoc** way of reading it: `useState(() => store.getSnapshot())`
  plus a manual `store.subscribe(...)` call inside `useEffect`. This is
  the pattern most people reach for first, and it's subtly unsafe — a
  store change between the initial render and the Effect actually
  attaching its subscription is missed entirely by that consumer.
- The **fixed** way: `useSyncExternalStore(subscribe, getSnapshot)`, which
  subscribes as part of rendering/committing (not a delayed Effect) and
  re-checks `getSnapshot()` on every render, including throwaway/retried
  renders under concurrent rendering — so every consumer of the same
  store stays consistent within a commit.
- **Tearing**: two components reading the "same" external value
  momentarily disagreeing about it. The demo has two ad hoc consumers and
  two `useSyncExternalStore` consumers reading one shared counter store
  side by side, with an artificial subscribe-delay toggle that reliably
  exposes the ad hoc pair disagreeing — and shows the synced pair never
  does.

Run it:

```bash
pnpm --filter concept-external-store-sync dev
```

Open the printed local URL. The page shows a theory panel, the
interactive demo, and a "What just happened" panel that updates with the
exact code that ran and why. Try this sequence: click **"Simulate slow
subscribe: ON"** (this remounts Ad hoc B with an artificial 600ms
subscribe delay), then quickly click **"Increment store"** — watch Ad hoc
A and both Synced consumers jump immediately while Ad hoc B lags behind
for 600ms, and the "Do Ad hoc A and B agree?" line flips to "torn"
during that window. The two `useSyncExternalStore` consumers never
disagree, no matter how many times you repeat this.

## Key takeaways

- `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)` is
  the hook React ships specifically for reading data that lives outside
  React state — reach for it instead of hand-rolling `useState` +
  `useEffect` subscription whenever the data source isn't a React
  component's own state.
- `subscribe` must register `callback` with the store and return an
  unsubscribe function; React itself calls `subscribe`, synchronously, as
  part of rendering/committing — not from a delayed Effect.
- `getSnapshot` must return an **immutable**, reference-stable value —
  return a cached snapshot when nothing changed, never a freshly built
  object, or React re-renders in an infinite loop (React surfaces this as
  "The result of `getSnapshot` should be cached").
- The ad hoc `useState` + `useEffect` pattern is not "wrong" in every
  case — it can happen to work when nothing interrupts rendering between
  mount and the Effect's subscribe call. It's unsafe because that
  guarantee doesn't hold in general (slow-mounting trees, Suspense,
  concurrent rendering), and the failure mode — a stale UI for a render
  or two — is easy to miss in testing and only shows up under load.
- If your app is fully built with React, prefer normal React state
  (`useState`/`useReducer`/context) over introducing an external store at
  all — `useSyncExternalStore` exists for the cases where you're
  integrating with something that isn't React's, not as a general state
  management tool.

## Discussion / interview questions

1. Why is subscribing inside `useEffect` not equivalent to subscribing
   inside `useSyncExternalStore`'s `subscribe` argument, timing-wise?
2. What specifically does "tearing" mean, and why does concurrent
   rendering make it possible in a way that synchronous rendering
   (React 17 and earlier) mostly didn't?
3. Why must `getSnapshot()` return a cached/immutable value instead of a
   fresh object every call — what error does React throw if it doesn't,
   and why?
4. When would you reach for `useSyncExternalStore` over just lifting the
   data into a `useState` owned by a common ancestor component?

## Further reading

- [react.dev — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [react.dev — You Might Not Need an Effect: Subscribing to an external store](https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store)
