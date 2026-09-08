# Concept: Controlled vs. uncontrolled inputs

**Category:** forms-and-actions
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A **controlled** `<input>` has a `value` prop bound to React state plus an
  `onChange` handler that updates it — React "force[s] the input's value to
  match the state variable" (react.dev), so every keystroke round-trips
  through a re-render.
- An **uncontrolled** `<input>` uses `defaultValue` to seed only the
  _initial_ value; after that first render the DOM node owns the value, and
  reading it back requires a `ref` (`inputRef.current.value`). Typing never
  touches React state and never re-renders the component.
- React enforces a hard rule at runtime, not just a style guideline: **an
  input can't be both controlled and uncontrolled, and can't switch between
  the two over its lifetime.** Flip a `value` prop between a real string and
  `undefined` on the same element and React logs a real console warning
  ("A component is changing an uncontrolled input to be controlled" or the
  mirror-image message) the instant it happens.

Run it:

```bash
pnpm --filter concept-controlled-vs-uncontrolled-inputs dev
```

Open the printed local URL (fixed at `http://localhost:5331`). The page shows a theory panel, the interactive
demo, and a "What just happened" panel that updates with the exact code
that ran and why. In the demo:

1. **Controlled input** — type into it and watch the "Controlled input
   re-renders" counter above it climb on every keystroke, and the mirrored
   `name` state value update live underneath. React is doing work on every
   character.
2. **Uncontrolled input** — type into it and watch that counter *not*
   move — it has no `onChange` to increment anything. Click "Read value" (or
   click away to blur the field) to see the
   "Last value read via ref" line update — that's the only way this
   component ever finds out what's in the field.
3. **The switching trap** — click "Flip to uncontrolled/controlled"
   repeatedly. The same `<input>` element has its `value` prop toggled
   between a tracked string and `value={undefined}`. The page temporarily
   patches `console.error` so the real React warning about this shows up
   inline instead of only in devtools — read the captured message and
   compare it with the theory panel's caveats.

## Key takeaways

- `value` + `onChange` is the controlled pattern: React dictates what's on
  screen. Passing `value` with no `onChange` produces a read-only field and
  a console error — every controlled input needs a handler that
  synchronously syncs state back.
- `defaultValue` is the uncontrolled pattern: it's read once, on mount, and
  after that the browser DOM is the source of truth. A `ref` is the only
  way back in.
- A controlled `value` should always resolve to a string, never `null` or
  `undefined` — coerce with `value={someValue ?? ""}` if the value might
  arrive from an API before it's loaded, since an eventually-defined value
  starting out as `undefined` is exactly the pattern that trips the
  controlled/uncontrolled warning.
- Reach for **controlled** when you need to react to every keystroke: live
  validation, formatting as-you-type, disabling a submit button, or
  mirroring one value into multiple places in the UI.
- Reach for **uncontrolled** when you only need the value at a specific
  moment (e.g. on submit) and don't want a re-render on every character —
  simpler code, cheaper renders, at the cost of not being able to react
  live.
- Whichever you pick, pick it once. React can't reconcile an input that
  sometimes has a `value` and sometimes doesn't — the moment it changes
  shape, a warning fires because React genuinely can't tell which mode you
  meant.

## Discussion / interview questions

1. What specifically makes an `<input>` "controlled" in React's eyes — is
   it the presence of `onChange`, or something else? (Check the demo's
   "switching trap" input: it starts controlled, and flipping it to
   `value={undefined}` with no `onChange` at all is exactly what triggers
   the warning.)
2. Why doesn't typing into the uncontrolled input in this demo move the
   re-render counter, while typing into the controlled one does on every
   character?
3. A teammate initializes controlled state from an API response with
   `useState<string | undefined>(undefined)` and binds it straight to
   `value`. What goes wrong the moment the API response arrives, and what's
   the one-line fix?
4. Give a concrete UI feature that's only practical with a controlled input
   (not just "validation" in the abstract), and one that's genuinely
   simpler left uncontrolled.

## Further reading

- [react.dev — `<input>` (React DOM Components reference)](https://react.dev/reference/react-dom/components/input)
- [react.dev — Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [react.dev — Sharing State Between Components (state as the single source of truth)](https://react.dev/learn/sharing-state-between-components)
