# Concept: `useOptimistic` basics

**Category:** forms-and-actions
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Waiting for an async round trip before showing the result of an action
  (posting a comment, liking a post) makes an app feel slow even when the
  request itself only takes a second or two — the **naive** version here
  only adds a new comment to state after `postComment` resolves, so the UI
  just sits there, disabled, for the whole delay.
- `useOptimistic(state, updateFn)` lets you render the *expected* result
  immediately: `addOptimistic(value)` — called inside a transition or an
  Action — triggers a synchronous re-render showing `updateFn(state, value)`,
  before the real request has even started.
- There's no explicit "undo"/rollback API. If the action throws before ever
  updating the real `state`, the optimistic value was only ever a temporary
  overlay on top of it — once the transition settles, React renders `state`
  as-is again and the temporary item **disappears on its own**. That
  disappearance *is* the rollback, and it's something you can watch happen
  in the demo via the "Simulate failure" toggle, not just read about.
- react.dev is explicit that success isn't a separate "clear the optimistic
  flag" step either: "There's no extra render to clear the optimistic
  state. The optimistic and real state converge in the same render when the
  Transition completes."

Run it:

```bash
pnpm --filter concept-use-optimistic-basics dev
```

Open the printed local URL (fixed at `http://localhost:5335`). The page shows a theory panel, the interactive
demo, and a "What just happened" panel that updates with the exact code
that ran and why. In the demo:

1. Stay on **Naive (wait for round trip)** and post a comment. Notice the
   input disables and nothing appears in the list for a full 1.5s, with no
   feedback beyond a disabled button.
2. Switch to **useOptimistic** and post a comment. It appears immediately,
   marked "sending…" — then quietly loses that marker once the (simulated)
   request confirms it, ~1.5s later.
3. Turn on **Simulate failure**, then post a comment in each mode. In
   **Naive**, you wait the full 1.5s and see only an error banner — the
   comment never appeared at all. In **useOptimistic**, the comment appears
   instantly as before, then *disappears again* 1.5s later when the
   rejection lands, alongside an error banner. Nothing in the code
   explicitly removes it — it was never really "in" state to begin with.

## Key takeaways

- `useOptimistic`'s signature is
  `const [optimisticState, addOptimistic] = useOptimistic(state, updateFn)`.
  `updateFn(currentState, optimisticValue)` is a pure function that computes
  what to show right away; `optimisticState` equals `state` whenever nothing
  is pending.
- `addOptimistic` must be called **inside a transition or an Action** —
  calling it from a plain event handler produces React's "An optimistic
  state update occurred outside a Transition or Action" warning. This demo
  wraps the optimistic submit handler in `useTransition`'s `startTransition`.
- If the real `state` changes while an action is pending, React re-runs
  `updateFn` against the *new* state — the optimistic addition stays layered
  on top of fresh data, not a stale snapshot.
- Rollback-on-error is **automatic and implicit**, not something you call:
  since `optimisticState` is recomputed from `state` + `updateFn` on every
  render, failing to ever update the real `state` means the optimistic
  overlay simply isn't there once the pending transition finishes.
  `useOptimistic` does not manage user-facing error messaging for you —
  pair it with your own `try`/`catch` and error state for that.
- Best fit: actions very likely to succeed (posting a comment, liking a
  post, toggling a follow) where instant feedback is worth occasionally
  having it quietly disappear, rather than actions where a wrong optimistic
  guess would be confusing or costly.

## Discussion / interview questions

1. Walk through what happens, render by render, when `addOptimistic` is
   called inside a `startTransition` callback and the awaited request then
   fails. What (if anything) does your code need to do to "undo" the
   optimistic value?
2. Why does calling `addOptimistic` from a plain `onClick` handler (outside
   `startTransition` or a form Action) produce a warning? What is React
   actually complaining about?
3. In the reducer form `useOptimistic(items, (state, action) => ...)`, what
   happens to the optimistic value if `items` itself changes while an
   action is still pending? Why does that matter for a list that multiple
   actions could be updating concurrently?
4. `useOptimistic` doesn't give you a way to show a persistent "failed to
   send" state on the item itself once it's rolled back — you only get a
   window before it disappears. How would you redesign the comment list if
   you needed a failed item to stay visible (e.g. with a "retry" button)?

## Further reading

- [react.dev — `useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [react.dev — `<form>` (Optimistic UI updates with useOptimistic)](https://react.dev/reference/react-dom/components/form)
