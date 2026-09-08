# Question bank: Hooks & state

Tags: `hooks` `useEffect` `custom-hooks` `closures`

---

### Why do the Rules of Hooks forbid calling hooks conditionally or in loops?

- **Difficulty:** easy/medium
- **Discussion points:** React tracks hook state by **call order** per
  component instance (a linked list under the fiber), not by name — a
  conditional hook shifts every subsequent hook's slot and corrupts state.
- **Follow-ups:**
  - How does `eslint-plugin-react-hooks` catch this statically?
  - How do you conditionally _use_ a hook's behavior without conditionally
    _calling_ it? (move the condition inside the hook / render two branches
    that each call it unconditionally)

---

### Walk through a `useEffect` with a missing dependency — what breaks, and how do you find it?

- **Difficulty:** medium
- **Discussion points:** stale closure captures the old value; effect fires
  on a stale schedule; `exhaustive-deps` lint rule; the fix is usually not
  "add the dep and cause a loop" but restructuring (updater function,
  `useRef` for a value that shouldn't trigger the effect, or moving logic
  into an event handler instead of an effect).
- **Follow-ups:**
  - When is it _correct_ to intentionally omit a dependency, and how do you
    document that decision?

---

### When should logic live in an event handler instead of a `useEffect`?

- **Difficulty:** medium
- **Discussion points:** "You Might Not Need an Effect" — effects are for
  synchronizing with an external system (subscriptions, DOM, network),
  not for responding to a user action or deriving state from other state
  (that's a plain calculation during render, or an event handler).
- **Follow-ups:**
  - Give an example of an unnecessary effect that just sets state derived
    from props/state, and how you'd rewrite it.

---

### Design a `useDebounce` custom hook. What are the edge cases?

- **Difficulty:** medium
- **Discussion points:** timer cleanup on unmount/re-call; leading vs.
  trailing edge; returning the debounced _value_ vs. a debounced
  _callback_; what happens if the input changes faster than the delay.
- **Follow-ups:**
  - How would you test it without real timers (`vi.useFakeTimers`)?

---

### `useMemo`/`useCallback` — what problem do they actually solve, and when are they premature?

- **Difficulty:** medium
- **Discussion points:** referential stability to avoid breaking `React.memo`
  / effect dependency arrays, or to avoid genuinely expensive recomputation;
  they are **not** free — cost memory + comparison overhead; overuse without
  measuring is a smell. Mention the React Compiler's role in automating this.

---

### `useRef` vs. `useState` — when does mutating a ref _not_ trigger the behavior you expect?

- **Difficulty:** easy/medium
- **Discussion points:** refs don't trigger re-renders and don't
  participate in the render's data flow — reading `ref.current` during
  render is unreliable/unsafe for anything the UI should reflect.
