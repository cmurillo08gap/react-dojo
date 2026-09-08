# Concept: `useActionState` basics

**Category:** forms-and-actions
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A form that validates against a server needs a value, a pending flag, and
  a resulting message, all kept in sync across an **async** round trip —
  here, a signup username field with a simulated "already taken" check.
- `useActionState` collapses that trio into one hook call:
  `const [state, formAction, isPending] = useActionState(fn, initialState, permalink?)`.
  `fn` is called as `fn(previousState, formData)` — previous state first,
  the submitted `FormData` second — and whatever `fn` **returns** becomes
  the new `state` on the next render, exactly like a reducer.
- `formAction` wires directly into `<form action={formAction}>`; submitting
  the form is what triggers `fn`. `isPending` is `true` for the duration of
  that call with no separate `useState` needed to track it.
- Contrast: the same validation logic re-implemented with plain
  `useState` (the pre-React-19 pattern) needs a manual
  `event.preventDefault()`, a hand-written pending flag that has to be
  flipped back off in **every** branch, and (to be fully correct) a guard
  against an out-of-order response overwriting a newer one —
  `useActionState`'s internal queuing makes that guard unnecessary.

Run it:

```bash
pnpm --filter concept-use-action-state-basics dev
```

Open the printed local URL (fixed at `http://localhost:5333`). The page
shows a theory panel, the interactive demo, and a "What just happened"
panel that updates with the exact code that ran and why. In the demo:

1. Stay on **useActionState** and submit the username `taken` (or `admin`,
   `root`, `test`). After the simulated ~900ms server round trip, the
   error message renders and the "What just happened" panel shows the
   `fn(previousState, formData)` call that produced it — notice there's no
   explicit `setPending(false)` anywhere.
2. Submit a short username like `ab` to see the same error path handle a
   client-side-shaped validation rule identically to the "taken" case —
   both are just different return values from the same function.
3. Submit any other username (e.g. `newuser`) to see the success state.
4. Switch to **Manual useState (pre-19)** and repeat the same submissions.
   The result is the same, but the "What just happened" panel now shows
   three separate setter calls that have to move together in **both** the
   success and error branches — miss one and the UI can get stuck showing
   "Checking…" forever.

## Key takeaways

- `useActionState`'s action function signature is
  `(previousState, formData) => newState` — previous state is always the
  **first** argument, the form's `FormData` the **second**. This order is
  easy to get backwards from memory; verify it against
  [react.dev](https://react.dev/reference/react/useActionState) rather
  than guessing in an interview.
- The action's **return value** is the entire next state — there's no
  separate setter to call, so a field can't be updated without the rest of
  the state object being decided in the same return statement.
- `isPending` comes from the hook itself and reflects whether a dispatched
  action for *this* hook is currently in flight — no `useState` boilerplate
  needed to track it when the trigger is a `<form action={formAction}>`
  submission.
- Calling `formAction` (or dispatching) outside of a form submission — e.g.
  from a plain `onClick` — needs to be wrapped in `startTransition` for
  `isPending` to update correctly; a `<form action={...}>` submission
  already runs inside a transition for you.
- Two kinds of failure, two responses: a **known**, expected failure
  (bad input, "already taken") is returned as state and rendered inline —
  this demo's pattern. An **unknown** error (a genuine bug) should be
  thrown instead, so React can cancel queued actions and surface it to the
  nearest Error Boundary rather than silently rendering it as a normal
  message.
- The manual `useState` equivalent isn't just more verbose — it's a
  smaller surface for bugs to hide in: a forgotten `setPending(false)` in
  one branch, or (without an explicit guard) a slower earlier response
  landing after a newer one and overwriting it.

## Discussion / interview questions

1. Write out the exact signature of `useActionState`, including the order
   of the tuple it returns and the order of arguments its action function
   receives. Which of these orders is most often gotten backwards from
   memory, and why?
2. Why does `signupAction` in this demo return an error object instead of
   throwing when the username is already taken? Under what circumstance
   *should* the action throw instead?
3. In the manual `useState` version, what specifically goes wrong if a
   submission for `"slow"` (imagine it took 5 seconds) is followed
   immediately by a submission for `"fast"` (200ms), and the code doesn't
   guard against out-of-order responses? Does `useActionState` need the
   same guard? Why or why not?
4. `isPending` only updates correctly when the action is triggered through
   a `<form action={formAction}>` submission or a manually-dispatched call
   wrapped in `startTransition`. What would you observe if you called
   `formAction()` directly from a plain `onClick` without wrapping it?

## Further reading

- [react.dev — `useActionState`](https://react.dev/reference/react/useActionState)
- [react.dev — `<form>`](https://react.dev/reference/react-dom/components/form)
- [react.dev — Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
