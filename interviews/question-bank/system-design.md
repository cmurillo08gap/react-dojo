# Question bank: System design (frontend)

Tags: `architecture` `data-fetching` `open-ended`

Open-ended prompts — evaluate on how the candidate structures the problem
(clarifying questions, constraints, trade-offs) more than on a single
"correct" answer.

---

### Design the state/data layer for a Twitter-like feed (infinite scroll, optimistic likes, real-time new-post banner).

- **Difficulty:** hard
- **Discussion points:** pagination strategy (cursor vs. offset), cache
  shape (normalized by id vs. per-page), optimistic update + rollback for
  likes, where "new posts available" state lives vs. the scrollable list,
  reconciling a WebSocket/poll-driven update with local optimistic state.

---

### Design a reusable `<DataTable>` component for a design system used by many teams.

- **Difficulty:** medium/hard
- **Discussion points:** controlled vs. uncontrolled sort/filter/pagination
  state, compound-component API vs. one giant props object, extensibility
  (custom cell renderers) without prop explosion, accessibility (keyboard
  nav, ARIA roles) as a first-class constraint, not an afterthought.

---

### How would you structure client-side auth (tokens, refresh, protected routes) in a React SPA?

- **Difficulty:** medium
- **Discussion points:** where the token lives (memory vs. storage,
  XSS/CSRF trade-offs), refresh-token flow without a login flash on
  reload, route guards vs. data-loader-level checks, how this changes with
  a framework that has server-rendered routes.

---

### Design a form system that supports async validation, multi-step wizards, and reusable field components.

- **Difficulty:** hard
- **Discussion points:** where validation state/errors live, debouncing
  async validators, cross-field validation, how React 19 Actions
  (`useActionState`, `useFormStatus`) simplify pending/error state vs. a
  form library, schema-driven vs. hand-rolled fields.

---

### A dashboard has 15 widgets, each fetching its own data. How do you avoid a waterfall of requests and redundant re-fetches?

- **Difficulty:** medium/hard
- **Discussion points:** request de-duplication/caching (react-query/SWR-style),
  colocated fetching vs. a shared loader, parallelizing independent
  fetches, `Suspense` for coordinated loading states, cache invalidation
  strategy across widgets that share underlying data.
