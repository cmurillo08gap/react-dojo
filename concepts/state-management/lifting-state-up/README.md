# Concept: Lifting state up

**Category:** state-management
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Two sibling components that both need to reflect the **same logical
  value** cannot stay in sync by each holding a private `useState` — the
  values only happen to agree at the start, and nothing keeps them
  agreeing once either one changes.
- The fix — **lifting state up** — has three steps: remove the state from
  both children, pass the value down from their closest common parent as a
  prop, then add the state to that parent together with a callback prop
  each child calls to request a change.
- Once state is lifted, the common parent is the **single source of
  truth** and both children become _controlled_: they render what the
  parent tells them to, and ask the parent to change it instead of
  changing it themselves.

Run it:

```bash
pnpm --filter concept-lifting-state-up dev
```

Open the printed local URL. The page shows a theory panel, the
interactive demo, and a "What just happened" panel that updates with the
exact code that ran and why. The demo shows a **Celsius editor** and a
**Fahrenheit editor** — two sibling inputs describing the same physical
temperature — side by side in two versions:

- **Buggy** — each editor owns its own `useState`. Edit one and watch the
  sync banner below flip to "Out of sync": the other editor doesn't move,
  because nothing connects the two.
- **Fixed** — a single `celsius` value lives in the parent and is passed
  to both editors as a prop, with a shared `onChange` callback. Edit
  either field and the other always updates to match, because both are
  reading (and converting) from the same shared state.

## Key takeaways

- Local `useState` in two different components always produces **two
  independent values**, even if they start out numerically equal —
  React has no built-in way to keep separate state variables in sync.
- To find where to lift state to, find the **closest common parent** of
  every component that needs to read or write it — not necessarily the
  app root.
- A lifted value is usually accompanied by a **callback prop**
  (`onChange`, `onSelect`, etc.) so children can request updates without
  owning the state themselves — this is what makes them "controlled".
- Deriving one representation from another (Fahrenheit from Celsius, in
  this demo) inside the child that needs it is usually simpler than
  storing both and trying to keep them manually synchronized.

## Discussion / interview questions

1. Why do the two buggy editors start in sync but drift apart after the
   first edit — what exactly is different about their state compared to
   the fixed version's?
2. In the fixed version, why does `FixedFahrenheitEditor` convert its
   input's value back to Celsius before calling `onChange`, instead of
   storing Fahrenheit in the parent?
3. How would you decide whether to lift state all the way to a page-level
   component versus a smaller wrapper that's the direct common parent of
   just these two editors?
4. At what point does lifting state up to a shared parent get unwieldy
   enough that you'd reach for `useReducer`, Context, or an external
   store instead?

## Further reading

- [react.dev — Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [react.dev — Managing State](https://react.dev/learn/managing-state)
- [react.dev — Lifting state up (Tic-Tac-Toe tutorial)](https://react.dev/learn/tutorial-tic-tac-toe#lifting-state-up)
