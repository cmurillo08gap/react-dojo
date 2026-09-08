# Concept: `useFormStatus` basics

**Category:** forms-and-actions
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A submit button nested a few components below a `<form>` (here,
  `Form` → `ButtonGroup` → `SubmitButton`) needs to know "is this form
  submitting" to disable itself and show a loading label. Without
  `useFormStatus`, the only way to get that boolean there is to own it
  further up (`DrilledForm`'s own `useState`) and **thread it down as a
  prop** through every component in between — including
  `DrilledButtonGroup`, which never uses the value itself.
- `useFormStatus` (exported from **`"react-dom"`**, not `"react"`) lets
  `HookSubmitButton` read `{ pending }` **directly**, with zero
  submission-related props passed through `HookButtonGroup` at all.
- The critical constraint, stated by react.dev as a caveat: **`useFormStatus`
  must be called from a component rendered *inside* a `<form>`.** It only
  reports status for a *parent* form — never for a `<form>` rendered by
  that same component, and never for a form rendered by a child.
- The most common mistake made concrete: `GotchaForm` calls
  `useFormStatus()` in the **same** component that renders the `<form>`
  below it. Its `pending` reads `false` for the entire submission — shown
  side by side with a separately-tracked `phase` state (`idle` →
  `pending` → `success`/`error`) that reflects what the form is actually
  doing, so the mismatch is visible on screen instead of only described in
  prose.

Run it:

```bash
pnpm --filter concept-use-form-status-basics dev
```

Open the printed local URL (fixed at `http://localhost:5334`). The page
shows a theory panel, the interactive demo, and (for the first two modes)
a "What just happened" panel that updates with the exact code that ran and
why. The demo is a "Save profile" form with a single **Name** field; leave
it blank to see the error path, or type a name to see success — either
way takes ~800ms of simulated delay. In the demo:

1. Stay on **Prop drilling** and submit with a name filled in.
   `DrilledForm` sets its own `pending` state to `true` before awaiting
   the simulated save, and passes it as a prop through
   `DrilledButtonGroup` (which has no use for it) down to
   `DrilledSubmitButton`, two levels away.
2. Switch to **useFormStatus (child)** and submit again.
   `HookButtonGroup` passes no submission-related props at all —
   `HookSubmitButton` calls `useFormStatus()` directly and reads a live
   `pending` value with nothing threaded through the component between it
   and the `<form>`.
3. Switch to **useFormStatus (gotcha)** and submit. Watch the two lines
   printed below the form: "pending (read in the form-rendering
   component)" never leaves `false`, while "actual submission phase"
   correctly cycles through `pending` → `success`/`error` — proof the
   form really is submitting even though `GotchaForm`'s own
   `useFormStatus()` call can't see it.

## Key takeaways

- `useFormStatus` takes no arguments and returns an object:
  `pending` (boolean), `data` (the submitting `FormData`, or `null`),
  `method` (`"get"` or `"post"`), and `action` (a reference to the
  function passed to the parent form's `action` prop, or `null`).
- It is imported from **`"react-dom"`**, unlike `useState`/`useReducer`/
  `useActionState`, which come from `"react"` — easy to get wrong from
  memory.
- The hook only ever reports on the **nearest parent `<form>`** relative
  to where it's called. A component that renders a `<form>` itself is not
  "inside" that form — react.dev's own example of this exact mistake is
  annotated "🚩 `pending` will never be true."
- This is what makes `useFormStatus` a replacement for prop drilling: any
  component nested inside the `<form>`, at any depth, can call the hook
  and read live status — no intermediate component (`HookButtonGroup`)
  needs to know the flag exists, let alone forward it. Compare that to
  `DrilledButtonGroup`, which has to accept and relay a `pending` prop it
  never reads itself.
- `GotchaForm` proves the mistake instead of just asserting it: its own
  `useFormStatus().pending` stays `false` for the whole submission, while
  a `phase` state tracked independently in the same component shows the
  submission genuinely moving through `pending` → `success`/`error` at
  the same time — the hook simply isn't watching the form it renders.

## Discussion / interview questions

1. Why does `DrilledButtonGroup` need a `pending` prop, while
   `HookButtonGroup` needs no submission-related props at all? What
   specifically changed about *where* the pending state is read from?
2. State the exact rule that makes `GotchaForm` broken, in your own words,
   and point to the specific line that violates it.
3. `GotchaForm` tracks two different signals during one submission:
   `pending` from `useFormStatus()`, and a separately-managed `phase`
   state. Why does `pending` stay `false` throughout while `phase`
   correctly moves from `idle` to `pending` to `success`/`error`? What
   change to `GotchaForm` would make a `useFormStatus()` call there report
   the real value?
4. If you needed `pending` in the component that renders the `<form>`
   itself (not a descendant), `useFormStatus` can't give it to you
   directly. What hook from this repo's other `forms-and-actions` concept
   (`useActionState`) would you reach for instead, and why would that work
   where `useFormStatus` doesn't?

## Further reading

- [react.dev — `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [react.dev — `<form>`](https://react.dev/reference/react-dom/components/form)
- [react.dev — `useActionState`](https://react.dev/reference/react/useActionState)
