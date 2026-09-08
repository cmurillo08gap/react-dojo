# Concept: Form Actions basics

**Category:** forms-and-actions
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A plain `<form onSubmit>` needs manual `event.preventDefault()`, a
  hand-written pending flag (flipped on before the request and off again in
  a `finally` block so it can't get stuck), and a manual reset of the
  controlled input's value on success.
- React 19 lets a `<form>`'s `action` prop be a **function** instead of a
  URL string. React calls it with the submitted `FormData` directly — no
  event object — and runs it inside a **Transition**, which is why
  `e.preventDefault()` is unnecessary.
- Two things React genuinely does for you automatically, both confirmed
  against react.dev: after the action **resolves successfully**, every
  **uncontrolled** field in the form is reset for you; and **pending**
  status is available via `useFormStatus()` (from `"react-dom"`) called
  from a component **nested inside** the `<form>` — not the component that
  renders the form itself.
- One thing it does **not** do: a bare action's return value isn't captured
  anywhere. Turning a caught error into an on-screen message still needs a
  `useState` you write yourself — that gap is exactly what
  `useActionState` (see `forms-and-actions/use-action-state-basics`) fills.

Run it:

```bash
pnpm --filter concept-form-actions-basics dev
```

Open the printed local URL (fixed at `http://localhost:5332`). The page
shows a theory panel, the interactive demo, and a "What just happened"
panel that updates with the exact code that ran and why. In the demo:

1. Stay on **`<form action>` (React 19)** and submit an email like
   `newuser@example.com`. After the simulated ~800ms server round trip,
   the success message renders and the input **clears itself** — nothing
   in the code calls a reset function; the field is simply uncontrolled.
2. Submit `taken@example.com` (or `test@example.com`, already subscribed)
   or `not-an-email` (invalid format) to see the error path. Notice the
   field is **not** cleared this time — only a successful action resets
   uncontrolled fields — so the address stays put to edit.
3. Switch to **onSubmit (pre-19)** and repeat the same submissions. The
   result is the same, but the "What just happened" panel now shows a
   hand-written `preventDefault()`, an `isPending` `useState` that must be
   flipped off in a `finally` block reached from every branch, and a
   manual `setOldEmail("")` on success.

## Key takeaways

- Passing a **function** to `<form action={fn}>` (instead of the plain
  HTML behavior of a URL string) makes React call `fn(formData)` on
  submit and run it inside a Transition — no `event.preventDefault()`
  needed, because there's no page-reload default to prevent in the first
  place.
- Caveat confirmed via react.dev: when `action` is a function, the form
  always submits with `POST`, regardless of any `method` prop.
- **Automatic form reset** applies only to **uncontrolled** fields (no
  `value` prop) and only fires once the action **resolves without
  throwing** — react.dev's own wording: "After the action function
  successfully completes, all uncontrolled field elements within the form
  are automatically reset."
- **Pending tracking** comes from `useFormStatus()`, and only works when
  called from a component nested inside the `<form>` — calling it in the
  same component that renders the `<form>` always reports the non-pending
  default. A deeper dive on that requirement lives in
  `forms-and-actions/use-form-status-basics`.
- A bare form action still leaves you to catch errors and store a message
  yourself if you want it rendered inline — react.dev's documented
  fallback for an **uncaught** throw inside an action is an Error
  Boundary around the `<form>`, not a silent no-op.
- This concept intentionally stays at the `<form action={fn}>` level,
  without `useActionState` or `useFormStatus` in real depth — see the
  sibling concepts in this category for those.

## Discussion / interview questions

1. Why is `event.preventDefault()` unnecessary inside a function passed to
   `<form action={...}>`, when it's mandatory inside a plain
   `<form onSubmit={...}>` handler?
2. In this demo, why does the email field clear itself after a successful
   submission in the **React 19** version but not in the **pre-19**
   version, given both call the exact same `subscribeOnServer` function?
3. `useFormStatus()` is called from `NewSubmitButton`, a separate
   component from `App`, even though `App` is the one rendering the
   `<form>`. What would you observe if `useFormStatus()` were called
   directly inside `App` instead, and why?
4. A bare `<form action={fn}>` doesn't capture `fn`'s return value as
   state anywhere. What specifically would you need to add to make an
   expected validation error (e.g. "already subscribed") render inline
   without maintaining your own `useState` for it — and which hook in this
   repo already does that?

## Further reading

- [react.dev — `<form>`](https://react.dev/reference/react-dom/components/form)
- [react.dev — `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [react.dev — `useActionState`](https://react.dev/reference/react/useActionState)
