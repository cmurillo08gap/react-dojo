# Question bank: Concurrent features

Tags: `suspense` `use-transition` `use-deferred-value` `use`

---

### What does it actually mean for a component to "suspend," and how is that different from a manual `isLoading` flag?

- **Difficulty:** medium
- **Discussion points:** suspending means the component throws a pending
  promise during render; the nearest `<Suspense>` boundary catches it and
  shows its `fallback` instead, without the component itself managing any
  loading state. Contrast with a manual `isLoading` flag: that's state the
  component owns and branches on itself; Suspense moves "what to show
  while waiting" up to a boundary that can wrap many components at once.
- **Follow-ups:**
  - What happens to already-committed content elsewhere on the page when
    one sibling suspends — does the whole page go back to a fallback?

---

### `useTransition` vs. `useDeferredValue` — when do you reach for each?

- **Difficulty:** medium
- **Discussion points:** `useTransition` wraps a state _update_ you
  trigger (e.g. from an event handler) marking it low-priority/
  interruptible, and gives you `isPending`; `useDeferredValue` instead
  takes a _value_ you don't control the update of (e.g. a prop) and gives
  you a lagging copy of it to render the expensive part from. Same
  underlying mechanism (deprioritized, interruptible rendering), different
  shape of what you're deferring.
- **Follow-ups:**
  - Could you use `useDeferredValue` instead of `useTransition` for a
    button-triggered update? What would you lose?

---

### How is the `use()` hook different from a regular hook with respect to the Rules of Hooks?

- **Difficulty:** medium/hard
- **Discussion points:** `use()` can be called conditionally or inside a
  loop — the one thing regular hooks can never do — because it doesn't
  rely on call-order tracking the way `useState`/`useEffect` do. It reads
  a promise or a context value directly; reading a promise this way, given
  no cache of its own, needs to sit inside a `<Suspense>` boundary the same
  way any other suspending read does.
- **Follow-ups:**
  - Contrast `use()` reading a promise vs. the classic `useEffect` +
    `useState` data-fetching dance — what does the classic version get
    wrong by default (waterfalls, no request cache) that this doesn't
    automatically fix either, unless paired with something that caches?

---

### A search-as-you-type list feels laggy on every keystroke. Diagnose and fix it with `useDeferredValue`.

- **Difficulty:** medium
- **Discussion points:** the expensive re-render of the filtered/rendered
  list is happening synchronously on every keystroke, blocking the input
  from feeling responsive. Fix: keep the `<input>` bound to the real,
  immediate query state (so typing itself never lags), but derive the
  list from a `useDeferredValue`-wrapped copy of that query — the input
  stays responsive while the list "catches up" a moment later.
- **Follow-ups:**
  - How would you show the user that the list is currently stale/catching
    up (comparing the deferred value to the live one)?

---

### What does "concurrent" actually change about React's rendering model, at a high level?

- **Difficulty:** medium/hard
- **Discussion points:** pre-concurrent rendering, once started, ran
  synchronously to completion; concurrent features let React start
  rendering an update, pause it, and either abandon or resume it — enabling
  prioritization (an urgent update, like typing, can interrupt a
  lower-priority one that's mid-render) instead of everything competing
  for the main thread on a first-come-first-served basis.
- **Follow-ups:**
  - Why does this require the Rules of React (pure render, no side effects
    during render) to hold, more strictly than the old synchronous model
    did in practice?
