# Concept: Accessible queries

**Category:** testing
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Testing Library's query priority: `getByRole`, `getByLabelText`, and
  friends find elements the way a real user (or assistive technology) would
  — by role and accessible name, or by a form field's associated label —
  not by reaching into implementation details.
- `data-testid` is a deliberate **last resort**. It finds a DOM node
  regardless of whether a real user could ever find or operate it, so its
  necessity in a test is itself a signal worth investigating, not just a
  convenient escape hatch.
- `role`, `aria-*`, and `tabIndex` are ordinary DOM props available on
  **any** built-in React element — React does nothing special with them.
  Adding `onClick` to a `<div>` makes it respond to a mouse click and
  nothing else: no implicit role, no keyboard handling, no place in the tab
  order. A real `<button>` gets all of that for free.
- The demo's "Broken" `SubscribeToggle` (a `<div onClick>` with no `role` or
  `tabIndex`) and its "Fixed" sibling `SubscribeToggleFixed` (a
  `<button type="button" role="switch" aria-checked={checked}>`) look and
  click identically — the only difference is markup, and it's the
  difference a screen reader user, a keyboard-only user, and an accessible
  query all care about.

Run it:

```bash
pnpm --filter concept-accessible-queries dev
```

Open the printed local URL. Toggle between "Broken" and "Fixed" in the
demo panel, then **try tabbing to the "Subscribe to newsletter" control
with your keyboard** — the broken version is skipped entirely (a `<div>`
isn't in the tab order without an explicit `tabIndex`), the fixed version
receives a visible focus outline and responds to Space/Enter. This is a
real, observable difference in the running app, not just a narrated one.

Run the tests:

```bash
pnpm --filter concept-accessible-queries test
```

- `src/__tests__/signup-form.accessible.test.tsx` drives the whole form
  (email, terms checkbox, subscribe switch, submit) using only `getByRole`
  / `getByLabelText`, against the **fixed** toggle.
- `src/__tests__/signup-form.broken-toggle.test.tsx` shows the same
  `getByRole` query **fail** (via Vitest's `test.fails` inverse-assertion
  API) against the **broken** toggle, then falls back to `getByTestId` to
  prove the fallback works but doesn't fix the underlying bug.

## Key takeaways

- Prefer `getByRole`/`getByLabelText` over `getByTestId` — a query that
  only a screen reader-blind test id can satisfy is a query that proves
  less than it looks like it proves.
- A control's accessible name comes from its label (`<label htmlFor>`) or,
  for a role like `switch`, from its own text content — the same
  computation Testing Library's `name` matcher option and a screen reader
  both rely on.
- A controlled `<input type="checkbox">` uses `checked` (boolean) +
  `onChange` reading `event.target.checked` — the same controlled-input
  shape as a text input, with a different prop/field pair.
- Needing `data-testid` to find an interactive-looking element is a signal
  to fix the component (give it a role and put it in the tab order), not
  just a way to unblock the test and move on.

## Discussion / interview questions

1. Why does `getByRole("switch", { name: /subscribe/i })` throw for the
   broken toggle even though the text "Subscribe to newsletter" is visibly
   right there in the DOM?
2. What three things does swapping a `<div onClick>` for a real `<button>`
   give you "for free" that you'd otherwise have to add by hand
   (`role`/`aria-checked`, `tabIndex`, keyboard activation)?
3. `test.fails` makes a test pass by asserting its body throws. Why is that
   a reasonable way to lock in "this query must not find this element",
   compared to, say, wrapping the call in `expect(() => ...).toThrow()`?
4. `getByTestId` still finds and can click the broken toggle. Why isn't
   that enough to call the component "tested," and what would you tell a
   teammate who says the test suite is green so the component is fine?

## Further reading

- [react.dev — Common components (e.g. `<div>`)](https://react.dev/reference/react-dom/components/common) —
  confirms `role`, `aria-*`, and `tabIndex` are plain standard DOM props on
  every built-in element, and that `onClick` is just an event handler prop
  like any other.
- [react.dev — `<input>`](https://react.dev/reference/react-dom/components/input) —
  confirms the controlled-checkbox shape (`checked` + `onChange` reading
  `event.target.checked`).
- [testing-library.com — Priority](https://testing-library.com/docs/queries/about/#priority) —
  the query priority order this concept is built around.
- [ARIA APG — Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) —
  the `role="switch"` + `aria-checked` pattern used by `SubscribeToggleFixed`.
- [ARIA APG — Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) —
  for contrast with the native `<input type="checkbox">` used for terms
  acceptance.
