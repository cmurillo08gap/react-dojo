# Concept: RTL basics

**Category:** testing
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- `render` + `screen` + `@testing-library/user-event` let a test query and
  interact with a component the way a user actually would, instead of
  reaching into React's rendered output as raw DOM.
- Querying by **accessible role + name** (`screen.getByRole("button", { name:
/like/i })`) survives a markup refactor that changes class names or DOM
  nesting but keeps the same role and visible label — because that's exactly
  what a real user (or assistive technology) perceives.
- Querying by **implementation detail** (a CSS class name via
  `container.querySelector`) is coupled to code structure that has nothing to
  do with user-facing behavior, and breaks the moment someone renames a
  class for purely cosmetic reasons.
- `userEvent.click` dispatches the fuller sequence of events a real browser
  produces for a click (pointer/mouse events, focus, then click); `fireEvent`
  fires one specific synthetic DOM event directly, skipping everything a
  browser would normally fire around it.

This package makes the contrast **provably real**, not just narrated: two
components, [`LikeButton`](src/LikeButton.tsx) and
[`LikeButtonRefactored`](src/LikeButtonRefactored.tsx), are behaviorally and
visually identical to a user but have different internal DOM/class
structure — a realistic "a teammate restyled this" refactor. Two real test
files prove the point:

- [`src/__tests__/like-button.accessible.test.tsx`](src/__tests__/like-button.accessible.test.tsx) —
  the same accessible-role-based test passes against **both** components.
- [`src/__tests__/like-button.brittle.test.tsx`](src/__tests__/like-button.brittle.test.tsx) —
  a `container.querySelector(".like-btn")`-based test against
  `LikeButtonRefactored`, wrapped in Vitest's `test.fails(...)` because the
  query returns `null` and the test throws. The suite stays green precisely
  because the assertion is proven to fail — a live demonstration, not a
  claim.

Run it:

```bash
pnpm --filter concept-rtl-basics dev
```

Open the printed local URL. The page shows a theory panel, an interactive
demo where you can flip between "Implementation A" and "Implementation B"
and click the Like button under each (notice nothing about what you see or
can do changes), and a "What just happened" panel showing both competing
test snippets and which one would keep passing against whichever
implementation is currently selected.

Run the tests:

```bash
pnpm --filter concept-rtl-basics test
```

Both test files pass — `like-button.brittle.test.tsx`'s single test passes
_because_ its assertion fails (that's what `test.fails` means), which is the
whole demonstration.

## Key takeaways

- Prefer `screen.getByRole(role, { name })` (or other user-facing queries:
  `getByLabelText`, `getByPlaceholderText`, `getByText`) over
  `container.querySelector(...)` — the latter is a last resort for cases
  Testing Library's own queries can't reach.
- A test that queries by role/name and interacts via `userEvent` documents
  what a user can actually do and see; a test that queries by class name or
  DOM structure documents how the component happens to be implemented today.
- `test.fails` (Vitest) / `test.failing` (Jest) is for **proving a known
  failure mode stays reproducible** — not a general substitute for fixing or
  removing a broken test. Reach for it rarely and comment why.
- The brittle query isn't wrong on day one — `LikeButton`'s
  `container.querySelector(".like-btn")` genuinely finds the button. The
  danger is that it keeps working right up until a behavior-preserving
  refactor breaks it for a reason unrelated to correctness.

## Discussion / interview questions

1. Why does `screen.getByRole("button", { name: /like/i })` keep working
   against `LikeButtonRefactored` even though its accessible name at any
   given moment is exactly `"Like"` or `"Like (n)"`, never the string
   `"like"`?
2. What does `test.fails` actually assert, and how is that different from a
   test that's merely skipped (`test.skip`) or expected to be fixed later
   (`test.todo`)?
3. `userEvent.click` is asynchronous (`await user.click(...)`) while
   `fireEvent.click` is not. What does that difference tell you about what
   each one is actually simulating?
4. `LikeButton` and `LikeButtonRefactored` have different `container` DOM
   structure but the same accessible tree. Besides `querySelector`, name
   another kind of test assertion that would break on this refactor even
   though a user notices nothing.

## Further reading

- [react.dev — `<StrictMode>`](https://react.dev/reference/react/StrictMode) —
  confirms Strict Mode's double-render/double-effect behavior is opt-in via
  wrapping a tree in `<StrictMode>`; React Testing Library's `render` does
  **not** add this wrapper for you unless you pass one via its `wrapper`
  option, so a component's effects and renders run their normal
  (non-double-invoked) number of times under a plain `render()` call.
- [react.dev — `act`](https://react.dev/reference/react/act) — explicitly
  notes that "you could use a library like React Testing Library, whose
  helpers are wrapped with `act()`" — which is why this package's tests call
  `render`, `fireEvent`, and `userEvent`'s methods directly, without ever
  importing `act` themselves, and still see committed state before their
  assertions run.
- [testing-library.com — Guiding Principles](https://testing-library.com/docs/guiding-principles/) —
  "The more your tests resemble the way your software is used, the more
  confidence they can give you."
- [testing-library.com — `user-event` vs. `fireEvent`](https://testing-library.com/docs/user-event/intro/#differences-from-fireevent) —
  `fireEvent` dispatches a single DOM event exactly as scripted; `user-event`
  simulates the full interaction a browser fires for that action.
