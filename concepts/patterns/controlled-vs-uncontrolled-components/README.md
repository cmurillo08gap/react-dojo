# Concept: Controlled vs. uncontrolled components

**Category:** patterns
**Difficulty:** intermediate
**Status:** template — expand as you work through it

This is the **general, component-design** version of controlled/uncontrolled
— unlike [`forms-and-actions/controlled-vs-uncontrolled-inputs`](../../forms-and-actions/controlled-vs-uncontrolled-inputs),
which is specifically about the built-in `<input>` element, this package
builds a plain custom component (`<Accordion>`) that supports both modes
itself.

## What this demonstrates

- Per react.dev's _Sharing State Between Components_: a component is
  **uncontrolled** when "the important information in it" lives in its own
  local state — "its parent cannot influence" it. A component is
  **controlled** when that information is "driven by props rather than its
  own local state," letting the parent "fully specify its behavior."
- A single `<Accordion>` component supports BOTH, using the same
  "controlled if the prop is defined" convention real libraries (Radix,
  Headless UI, React Aria) use:
  ```ts
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  ```
- Unlike `<input>`, which React's own DOM layer refuses to let switch
  between controlled and uncontrolled at runtime (a real console warning),
  a plain component gets **no such protection for free** — this
  `<Accordion>` implements its own guard effect to demonstrate what a
  library author has to build by hand.

Run it:

```bash
pnpm --filter concept-controlled-vs-uncontrolled-components dev
```

Open the printed local URL (fixed at `http://localhost:5363`). The page
shows a theory panel, the interactive demo, and a "What just happened"
panel that updates with the exact code that ran and why. In the demo:

1. **Uncontrolled panel** — no `open` prop is passed, so the `<Accordion>`
   manages its own state via `useState`. It's still handed an
   `onOpenChange` for observation only — watch the "Parent has observed…"
   counter tick up while the parent still can't force the panel open or
   closed itself.
2. **Controlled panel** — `open` + `onOpenChange` are passed, so the parent
   fully owns the state. Click "Force open (parent button)" / "Force
   closed (parent button)" — buttons that never touch the Accordion's own
   header at all — to prove the parent is genuinely in charge.
3. **The mode-switching trap** — a single instance whose `open`/
   `onOpenChange` are conditionally passed at all, flipping between
   controlled and uncontrolled across renders on purpose. Click "Flip
   to…" repeatedly to trigger this component's own dev-mode guard, which
   logs a warning the instant the mode changes mid-lifetime (captured and
   shown inline, the same way the `<input>` concept captures React's
   built-in warning — except here the guard is code this package wrote
   itself, since React provides no equivalent check for custom
   components).

## Key takeaways

- "Controlled" and "uncontrolled" aren't strict technical terms — per
  react.dev, most real components mix both, and the useful question is
  "should _this piece of state_ be controlled (via props) or uncontrolled
  (via state)?"
- The "controlled if the prop is defined" convention
  (`open !== undefined`) is how one component API supports both usages
  without two separate implementations — it's the same trick `<input>`
  itself effectively uses (a string `value` means controlled; its absence
  means uncontrolled).
- A controlled instance must never call its own internal setter for the
  controlled piece of state — it renders exactly what the prop says and
  defers entirely to the callback, or it will fight the parent's next
  render.
- `defaultOpen` (uncontrolled) mirrors `<input defaultValue>` — read once
  on mount, then owned entirely by the component's own state afterward.
- React's runtime warning against switching an `<input>` between
  controlled/uncontrolled is special-cased for built-in DOM elements —
  a plain component gets no equivalent protection unless its author adds
  one explicitly (as this `<Accordion>` does).

## Discussion / interview questions

1. How do you support **both** controlled and uncontrolled usage in one
   component API, and what's the "controlled if the prop is defined"
   convention? Why does checking `open !== undefined` (not
   `defaultOpen !== undefined`, and not the presence of `onOpenChange`)
   work as the switch?
2. What goes wrong if a component silently switches between
   controlled/uncontrolled across renders, and how does that relate to
   the equivalent `<input>` warning? Why does React catch this for
   `<input>` automatically but not for a custom component like this
   `<Accordion>`?
3. In the uncontrolled demo, `onOpenChange` is passed even though `open`
   is not. Why doesn't that make the component controlled, and what's a
   real-world reason you might want an uncontrolled component to still
   accept a change callback?
4. If you were building this `<Accordion>` for a design-system library
   used across many teams, would you make `defaultOpen`/`open` required
   or optional, and would you export the `isControlled` check as a
   reusable hook (e.g. `useControllableState`)? What's the tradeoff?

## Further reading

- [react.dev — Sharing State Between Components (Controlled and uncontrolled components)](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components)
- [react.dev — `useState`](https://react.dev/reference/react/useState)
- [react.dev — `<input>` (for contrast — the built-in controlled/uncontrolled contract)](https://react.dev/reference/react-dom/components/input)
