# Question bank: State management

Tags: `context` `use-reducer` `lifting-state` `external-store`

---

### Two sibling components each keep their own copy of what's logically the same piece of state, and they drift out of sync. How do you fix it, and what's the trade-off of over-applying the fix?

- **Difficulty:** easy/medium
- **Discussion points:** lift the state to the nearest common parent and
  pass it down with a setter; the trade-off is prop drilling if you lift
  too far up the tree past components that don't care about that state —
  "lift only as far as the nearest common owner," not automatically to the
  root.
- **Follow-ups:**
  - At what point does prop drilling get bad enough that you'd reach for
    Context instead of lifting further?

---

### You wrapped a component in `React.memo`, but every consumer of a Context still re-renders whenever the provider re-renders. Why, and how do you fix it?

- **Difficulty:** medium
- **Discussion points:** a context `value` that's a fresh object/array/
  function literal created on every provider render is referentially new
  every time, so every consumer re-renders regardless of `memo` — `memo`
  can't see through a context read the way it shallow-compares props. Fix:
  memoize the value (`useMemo`), and/or split one context into a rarely-
  changing "state" context and a stable "dispatch" context so most
  consumers only depend on the one that doesn't change.
- **Follow-ups:**
  - Would splitting state into two separate contexts (instead of one
    object) ever be simpler than memoizing?

---

### When do you reach for `useReducer` over several related `useState` calls?

- **Difficulty:** medium
- **Discussion points:** a smell where independent `useState` calls can
  land in an invalid combination (e.g. `status: "success"` with
  `error` still set from a previous failed request) — a reducer's action
  set can make that combination structurally unreachable (discriminated
  union + a `never` exhaustiveness check). Also: a reducer is a pure
  function, easy to unit-test without rendering a component at all.
- **Follow-ups:**
  - Show a concrete invalid state combination that loose `useState` calls
    allow but a well-designed reducer doesn't.

---

### Why not just `useState` + `useEffect` + manual subscribe for reading a value from a store that lives outside React (e.g. `window` size, a custom event emitter)? What does `useSyncExternalStore` actually buy you?

- **Difficulty:** medium/hard
- **Discussion points:** a hand-rolled subscribe effect can tear under
  concurrent rendering — different parts of the tree can read the store
  at different points in time and disagree within a single commit.
  `useSyncExternalStore` guarantees a consistent snapshot across the whole
  render, including under concurrent features (`useTransition`, etc.).
- **Follow-ups:**
  - When would you write your own `useSyncExternalStore`-based hook vs.
    reach for a library (Zustand, Jotai) that's already built on it?

---

### When is plain Context "enough," and when does it start to hurt?

- **Difficulty:** medium
- **Discussion points:** fine for low-frequency updates and a handful of
  consumers (theme, auth user, locale); starts to hurt with high-frequency
  updates (every consumer re-renders on every change, even memoized ones,
  per the pitfall above) or many unrelated consumers reading one big
  context object. That's the point a dedicated state-management library
  (selector-based subscriptions, fine-grained reactivity) starts paying
  for itself.
- **Follow-ups:**
  - What would you check first to decide "is Context still fine here," on
    a real, already-built feature — before reaching for a library?
