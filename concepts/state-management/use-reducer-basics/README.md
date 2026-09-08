# Concept: `useReducer` basics

**Category:** state-management
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Several related `useState` calls can drift into an **invalid combination**
  when a handler updates only the field it "owns" and forgets the others —
  here, a fetch-status trio (`status` / `data` / `error`) where a success
  handler forgets to clear a leftover `error`, or a failure handler forgets
  to clear leftover `data`.
- `useReducer` replaces that trio with **one state value** and a **fixed,
  typed set of actions** (a discriminated union). Because each reducer
  `case` returns a complete replacement state object, the same invalid
  combination becomes structurally unreachable — not just avoided by
  discipline.
- Migrating `useState` → `useReducer` is a three-step move (per react.dev):
  dispatch actions from event handlers, write a reducer function, then wire
  it up with `useReducer(reducer, initialState)`.

Run it:

```bash
pnpm --filter concept-use-reducer-basics dev
```

Open the printed local URL. The page shows a theory panel, the interactive
demo, and a "What just happened" panel that updates with the exact code
that ran and why. In the demo:

1. Stay on **Loose useState (buggy)** and click **Fail**, then **Succeed**.
   Watch the printed `status` / `data` / `error` block — you'll see
   `status: success` with a leftover `error` still set, flagged by the
   warning banner.
2. Switch to **useReducer (fixed)** and repeat the exact same click
   sequence (**Fail**, then **Succeed**). The warning never appears —
   the `"succeed"` case always sets `error` back to `null` as part of the
   same returned object.

## Key takeaways

- An invalid combination like `status: "success"` plus a stale `error` is
  easy to reach with independent `useState` calls because nothing forces
  every handler to touch every related field.
- A reducer's `case` for a given action returns the **entire** next state,
  so fields that should always move together (here, all three of
  `status`/`data`/`error`) can't fall out of sync — the reducer's return
  type is the thing enforcing consistency, not handler discipline.
- A discriminated-union action type (`{ type: "fetch" } | { type: "succeed"; data: string } | ...`)
  lets TypeScript flag a missing `switch` case via an exhaustiveness check
  (`const unreachable: never = action;`).
- Reducers run during rendering and must stay pure — no mutating the
  `state` argument, no side effects. React intentionally double-invokes
  the reducer (and initializer) in Strict Mode, in development only, to
  help surface accidental impurities.
- This isn't "always use `useReducer` for 2+ `useState` calls" — react.dev's
  own guidance is to reach for a reducer when a component keeps getting
  bugs from incorrect state updates and would benefit from more structure,
  not as a blanket replacement for `useState`.

## Discussion / interview questions

1. Walk through why `handleSucceedLoose` (loose version) can leave `status`
   and `error` in an inconsistent combination. What's the minimal fix if
   you *had* to keep using separate `useState` calls?
2. Why can the same invalid combination never occur in the `useReducer`
   version, even though the fetch logic is "the same"? What specifically
   about the reducer's return type rules it out?
3. What does the `const unreachable: never = action;` line in the default
   case buy you, and when would it actually fail to compile?
4. React calls a component's reducer twice in development under
   `<StrictMode>`. What would go wrong if the reducer weren't pure — say,
   if a case mutated the incoming `state` object instead of returning a
   new one?

## Further reading

- [react.dev — `useReducer`](https://react.dev/reference/react/useReducer)
- [react.dev — Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
