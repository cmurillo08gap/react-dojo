# Question bank: Fundamentals

Tags: `jsx` `rendering` `props` `state` `lists`

---

### What actually happens when a component "re-renders"?

- **Difficulty:** easy
- **Discussion points:** function component = call the function again;
  reconciliation diffs the new element tree against the last one; DOM only
  touched where the diff says so; re-render ≠ re-paint/re-mount.
- **Follow-ups:**
  - When does a child re-render if its own state didn't change?
  - What's the difference between re-rendering and re-mounting (and what
    causes an unwanted remount — e.g. changing a `key` or component
    identity in the tree)?

---

### Why does React want a stable `key` on list items, and what breaks if you use the array index?

- **Difficulty:** easy
- **Discussion points:** keys let React match elements across renders;
  index-as-key breaks when the list is reordered/filtered — state gets
  attached to the wrong item, inputs/animations glitch.
- **Follow-ups:**
  - Is index-as-key ever fine? (static, never-reordered lists)
  - How would you generate a stable key for items without a natural id?

---

### Controlled vs. uncontrolled inputs — what's the actual difference and when would you choose each?

- **Difficulty:** easy/medium
- **Discussion points:** controlled = React state is the source of truth
  (`value` + `onChange`); uncontrolled = DOM holds the value, read via
  `ref`/`FormData`. Trade-offs: validation/formatting-as-you-type needs
  controlled; large forms / perf-sensitive forms sometimes prefer
  uncontrolled + refs, or React 19 Actions with `FormData`.
- **Follow-ups:**
  - How do React 19 Actions (`useActionState`) change this trade-off?

---

### What's the difference between `props` and `state`, and why can't a component change its own props?

- **Difficulty:** easy
- **Discussion points:** props = input from parent, owned by parent, read-only
  from the child's perspective; state = internal, owned by the component,
  mutable via its setter. "Read-only" is about ownership/unidirectional data
  flow, not `Object.freeze`.

---

### Explain the children prop and one real use case beyond passing JSX through.

- **Difficulty:** medium
- **Discussion points:** `children` is just a prop; composition over
  configuration (e.g. a `Card` that doesn't know its contents); render-prop
  style `children` as a function; slots pattern with multiple named props.
