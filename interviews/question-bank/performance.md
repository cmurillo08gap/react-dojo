# Question bank: Performance

Tags: `memoization` `re-renders` `profiling` `code-splitting`

---

### A list of 1,000 rows re-renders every row on every keystroke in an unrelated search box. Diagnose and fix.

- **Difficulty:** medium
- **Discussion points:** likely the list and the input share a common
  parent whose state update re-renders the whole subtree; fixes: lift the
  input's state down/colocate it, `React.memo` on row components with
  stable props, split state so unrelated UI doesn't share a re-render
  boundary, virtualization if the list itself is the bottleneck (not
  re-renders).
- **Follow-ups:**
  - How would you _prove_ this diagnosis using the React DevTools Profiler
    before writing any fix?

---

### `React.memo` didn't stop the re-render you expected it to. Why?

- **Difficulty:** medium
- **Discussion points:** a prop is referentially new every render (inline
  object/array/function literal, or an un-memoized callback/derived value);
  `memo`'s shallow comparison can't see through that; context changes bypass
  `memo` entirely for consumers.

---

### Explain code-splitting with `React.lazy`/`Suspense` and one real trade-off.

- **Difficulty:** medium
- **Discussion points:** ship less JS up front, defer a route/heavy
  component's chunk until needed; trade-off: a loading flash/waterfall if
  split too aggressively or without a sensible `Suspense` boundary + prefetch
  strategy.

---

### What does the React Compiler change about how you write performance-sensitive code?

- **Difficulty:** medium/hard
- **Discussion points:** auto-memoizes components/values based on static
  analysis, reducing the need for manual `useMemo`/`useCallback`/`memo`;
  still needs the Rules of React followed (no mutation of props/state,
  pure render) to be safe to apply; doesn't replace virtualization or
  algorithmic fixes.

---

### You suspect a component tree causes "cascading re-renders." How do you confirm it and communicate the fix to a reviewer?

- **Difficulty:** hard
- **Discussion points:** React DevTools Profiler flame chart + "why did
  this render" highlighting; distinguish an _expensive_ render from a
  _wasteful_ (unnecessary) one — they need different fixes; communicating
  with before/after profiler screenshots or commit counts, not vibes.
