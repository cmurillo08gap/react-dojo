# Question bank: Forms & React 19 Actions

Tags: `forms` `actions` `use-action-state` `use-form-status` `use-optimistic`

---

### Walk through what actually happens when you pass a function to `<form action={fn}>` in React 19, contrasted with a traditional `onSubmit` handler.

- **Difficulty:** medium
- **Discussion points:** an Action runs inside a Transition automatically —
  no manual `event.preventDefault()`, no manual `useState` for a pending
  flag; React manages the pending state and, on success, automatically
  resets uncontrolled fields. Contrast with the manual version: preventing
  default, tracking `isSubmitting` by hand, manually clearing the form.
- **Follow-ups:**
  - What still has to be done by hand even with an Action (validation
    display, error state shape)?

---

### What does `useActionState` give you that a hand-rolled `useState`-based pending/error setup doesn't?

- **Difficulty:** medium
- **Discussion points:** `useActionState(fn, initialState, permalink?)`
  wraps an action, returning the latest state, a wrapped action to pass to
  the form, and a pending flag — and it guards against an out-of-order
  response race (a slow first submission resolving after a fast second one
  and clobbering its result), which a naive manual `useState` update after
  an `await` does not protect against by itself.
- **Follow-ups:**
  - What would the manual version need to add to close that same race
    condition itself?

---

### A submit button is nested three components deep inside a `<form>` and needs to know "is this form submitting" without prop-drilling a flag down. How do you solve it, and what's the gotcha?

- **Difficulty:** medium
- **Discussion points:** `useFormStatus` (from `react-dom`), called
  directly in the nested component, reading `{ pending, data, method,
action }` — no prop drilling needed. The gotcha: it must be called from
  a component nested _inside_ the `<form>`, not the component that renders
  the `<form>` itself — called there, `pending` always reports `false`.
- **Follow-ups:**
  - Why doesn't calling it in the form-rendering component work — what's
    actually being read?

---

### Walk through the rollback story for `useOptimistic` when the real request fails.

- **Difficulty:** medium
- **Discussion points:** the optimistic value is shown immediately while
  the real action is in flight; if it succeeds, the real result reconciles
  in with no extra render needed to clear the optimistic state; if it
  fails, the optimistic update needs to be rolled back — usually by
  catching the error and re-throwing/handling it so the underlying state
  reverts, since `useOptimistic` itself doesn't manage error state.
- **Follow-ups:**
  - What does the user actually see during a failed submission if you
    don't handle the rollback path deliberately?

---

### How do React 19 Actions and `FormData` shift the controlled-vs-uncontrolled trade-off for a simple form?

- **Difficulty:** medium
- **Discussion points:** for a form that doesn't need per-keystroke
  validation/formatting, an Action reading `FormData` from uncontrolled
  fields removes the need for controlled `useState` + `onChange` per
  field entirely — less re-rendering, less code. Controlled inputs are
  still the right call when you need live validation/formatting as the
  user types, or need the current value for something else in the UI.
- **Follow-ups:**
  - Would you still reach for a controlled field inside a form that's
    otherwise action/`FormData`-driven? When?
