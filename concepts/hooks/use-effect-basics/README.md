# Concept: `useEffect` basics

**Category:** hooks
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Effects let you **synchronize a component with an external system** —
  something outside React's own state, like a subscription, a timer, or a
  WebSocket connection.
- An effect's setup function can **return a cleanup function**; React calls
  it right before the effect reruns and again when the component unmounts.
- An effect that subscribes to an external system **without** returning a
  cleanup leaks: duplicate subscriptions pile up across remounts, and
  nothing ever removes them.
- `<StrictMode>`'s development-only **mount → cleanup → mount double-invoke**
  makes a missing/incorrect cleanup visible immediately, on the very first
  mount — before it ever reaches production traffic.

Run it:

```bash
pnpm --filter concept-use-effect-basics dev
```

Open the printed local URL. The page shows a theory panel, the interactive
demo, and a "What just happened" panel that updates with the exact code
that ran and why. The demo subscribes a component to a tiny module-level
"ticker" (a `setInterval`-based pub/sub external to React) and shows the
ticker's live **active listener count**:

- Click "Mount (buggy — no cleanup)" a few times in a row. Each click mounts
  a brand-new subscriber, but the active listener count only ever goes up —
  it never drops back down, even right after that very first mount, because
  `<StrictMode>` already double-invoked the effect once in development.
- Click "Mount (correct — with cleanup)" instead, any number of times: the
  listener count always settles back to exactly one.
- The tick log below highlights (in red) any tick where more than one
  listener fired — the direct, visible symptom of a leaked subscription.

## Key takeaways

- Always pair a subscription/connection made inside an effect with a
  cleanup function that undoes exactly that subscription/connection.
- The dependency array should list every reactive value the effect's setup
  function reads — an empty array (`[]`) means "run once after the initial
  mount, and clean up once on unmount."
- `<StrictMode>` double-invokes effects (setup → cleanup → setup) only in
  development, and only to help you find missing cleanup early — production
  builds run the setup function exactly once per real mount.
- "It only ran once when I tested it" is not the same as "the cleanup is
  correct" — the double-invoke check exists precisely because that
  assumption is where leaks like this hide.

## Discussion / interview questions

1. Why does the buggy subscriber already have **two** active listeners
   right after its very first mount, before you've clicked anything else?
2. What specifically would break in production (not just development) if
   the buggy variant's leaked listeners were, say, updating global state
   with `setState` calls that reference an unmounted component's closure?
3. If the ticker were replaced with `fetch` inside the effect instead of a
   subscription, what would "cleanup" mean there, and why is it still worth
   returning one (hint: an `AbortController`)?
4. The dependency array here is `[mode]`. What would change if it were `[]`
   instead, given that `mode` only ever changes by remounting the whole
   component (a new `key`)?

## Further reading

- [react.dev — `useEffect`](https://react.dev/reference/react/useEffect)
- [react.dev — Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [react.dev — Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- [react.dev — `StrictMode`](https://react.dev/reference/react/StrictMode)
