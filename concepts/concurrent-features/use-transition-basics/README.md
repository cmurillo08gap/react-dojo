# Concept: `useTransition` basics

**Category:** concurrent-features
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Not every state update is equally urgent. A **naive** update ties a text
  input's own value to the same synchronous render as an expensive list
  recompute (a few thousand rows, each paying a deliberately wasteful fixed
  cost) — React can't paint the next keystroke until that whole render
  finishes, so fast typing visibly lags or drops characters.
- `useTransition()` returns `[isPending, startTransition]`. Wrapping the
  expensive update in `startTransition(() => setQuery(value))` marks it as
  **non-urgent**: React renders it in the background while the input's own
  value — updated separately, urgently, via a plain `setState` — stays
  instantly responsive. `isPending` is `true` for as long as that background
  render is still in flight, which the demo uses to show a "stale/pending"
  affordance over the list.
- Transitions are **interruptible**. Per react.dev: "If a user triggers a
  new interaction while a transition is in progress, React will prioritize
  the new interaction, effectively interrupting the previous transition." —
  so typing again before the list catches up restarts the background render
  with the latest value instead of queuing renders up behind stale ones.
- react.dev is explicit that a controlled input's own `value` must **not**
  be wrapped in a transition — "Controlled inputs require synchronous
  updates, which Transitions do not provide" — which is exactly why the
  demo updates `inputValue` urgently and only defers the query that drives
  the expensive list.

Run it:

```bash
pnpm --filter concept-use-transition-basics dev
```

Open the printed local URL (fixed at `http://localhost:5342`). The page
shows a theory panel, the interactive demo, and a "What just happened"
panel that updates with the exact code that ran and why. In the demo:

1. Stay on **Naive (blocking)** and type quickly into the input. Notice
   typing feels laggy — every keystroke pays the full cost of re-filtering
   3,000 rows (shown in the "last list render cost" line) before the next
   character can appear.
2. Switch to **useTransition** and type quickly. The input itself stays
   smooth. A pending indicator (spinner + dimmed list) appears while the
   background render catches up, then clears once it commits.
3. In **useTransition**, type several characters in quick succession before
   the list finishes updating. Only the final value's render actually needs
   to complete — that's the "interrupting the previous transition" behavior
   from react.dev, not a queue of renders for every keystroke.

## Key takeaways

- `useTransition`'s signature is
  `const [isPending, startTransition] = useTransition();` — `isPending`
  reports whether a transition is still rendering; `startTransition` is the
  function used to mark updates as non-urgent.
- `startTransition(action)` runs `action` **immediately**; only state
  updates made **synchronously** during that call are marked as part of the
  transition. An update scheduled after an `await` or `setTimeout` inside
  `action` needs its own `startTransition` call to also count.
- Marking work as a transition doesn't make it cheaper — it changes _when_
  and _how blockingly_ it renders, not how much CPU it costs.
- Never wrap a controlled input's own `value` update in a transition; keep
  that urgent and defer only the expensive, derived work.
- The standalone `startTransition` import (for use outside components, e.g.
  in a data library) behaves the same way but has no `isPending` — that's
  the reason `useTransition` exists as a hook at all.

## Discussion / interview questions

1. Why does wrapping `setTransitionQuery` in `startTransition` keep the
   input responsive when wrapping `setNaiveQuery` directly does not — given
   that `computeMatches()` costs exactly the same in both cases?
2. What would happen if you also wrapped `setInputValue` in
   `startTransition`? Why does react.dev call this out specifically for
   controlled inputs?
3. If you called the standalone `startTransition` (not the hook) for this
   same update, what would you lose, and how would you compensate for it in
   the UI?
4. The demo measures and displays how long `computeMatches()` took on the
   last render. Does wrapping that call in `startTransition` change the
   number displayed? What does that tell you about what a transition does
   and doesn't optimize?

## Further reading

- [react.dev — `useTransition`](https://react.dev/reference/react/useTransition)
- [react.dev — `startTransition`](https://react.dev/reference/react/startTransition)
