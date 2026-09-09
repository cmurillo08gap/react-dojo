# Concept: Testing async UI

**Category:** testing
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A component driven by a real async fetch has a state update that doesn't
  happen inside the click that triggers it — it happens later, when the
  fetch's promise settles, which is **outside** a test's synchronous call
  stack. A plain `getByText` right after the click can't see it yet.
- `findBy*` (`findByText`, etc.) is `getBy*` + polling: it retries until the
  element appears or a timeout elapses, which is what correctly waits for a
  promise-driven state update to commit.
- `waitForElementToBeRemoved` is the mirror-image utility — for asserting
  something (a loading indicator) is **gone**, not that something new
  appeared.
- The classic flaky-test mistake — asserting loaded content with a
  synchronous query immediately after triggering an async action, no
  `await` in sight — throws deterministically here (fetch hasn't resolved
  yet), but in a real suite with real network timing it can pass by
  accident just often enough to look "flaky" instead of consistently wrong.

The demo component, `UserProfile`, calls a `setTimeout`-wrapped `fetchUser()`
from a plain `useState`-driven click handler (deliberately not
`useActionState` or Suspense — that would hide the very problem `findBy*`
exists to solve) and moves through `idle → loading → success` or
`idle → loading → error`. The real test file,
[`src/__tests__/user-profile.test.tsx`](src/__tests__/user-profile.test.tsx),
mocks the `api` module boundary (`vi.mock("../api")`) so every test
controls exactly when and how `fetchUser` settles, and covers:

- the loading state, asserted synchronously right after the click (correct
  use of a sync query — nothing async has happened yet at that instant);
- the success path, via `await screen.findByText(...)`;
- the error path, the same shape as success but for a rejection;
- the loading indicator disappearing, via `waitForElementToBeRemoved`;
- the pitfall itself, wrapped in Vitest's `test.fails(...)` so the suite
  stays green while still proving, concretely, that skipping the `await`
  breaks the assertion.

Run it:

```bash
pnpm --filter concept-testing-async-ui dev
```

Open the printed local URL. Pick "Succeed" or "Fail" and click "Load user"
— the artificial 150ms delay makes the loading state something you can
actually watch happen, not just something to take on faith. The "What just
happened" panel shows the real test snippet that asserts whichever state
you just triggered.

Run the tests:

```bash
pnpm --filter concept-testing-async-ui test
```

## Key takeaways

- Reach for `findBy*` (not `getBy*`) the moment an assertion depends on a
  promise, timeout, or any other async transition having already settled —
  `getBy*` checks exactly once, `findBy*` polls.
- `waitForElementToBeRemoved` exists specifically for "this loading/error
  state should be gone now" — model that intent directly instead of
  polling for the absence of something with a generic `waitFor`.
- React batches updates from promises and timeouts the same way it batches
  updates from its own event handlers, but that batching still happens on
  its own schedule — not synchronously with the line of test code that
  kicked off the async work.
- Testing Library's `render`/`fireEvent` wrap synchronous work in React's
  `act()` for you; `findBy*`/`waitFor` additionally poll, re-wrapping each
  retry in an async `act()` — that combination is what lets a
  promise-driven update actually become observable to an `await`.

## Discussion / interview questions

1. Why does asserting the loading state right after the click correctly use
   a synchronous `getByText`, while asserting the success/error state right
   after the click needs `findByText` instead?
2. What's the practical difference between `await screen.findByText(x)` and
   `await waitFor(() => expect(screen.getByText(x)).toBeInTheDocument())` —
   and when would you actually reach for the more verbose `waitFor` form?
3. The `test.fails` test in this package throws deterministically because
   `fetchUser` is mocked. Why might the equivalent mistake against a _real_,
   unmocked network call sometimes pass instead of reliably fail — and why
   is that worse for a test suite than always failing?
4. `UserProfile` tracks `status` with plain `useState` rather than
   `useActionState`. What would change about how you'd test the loading
   state if the fetch were kicked off by a React 19 Action instead?

## Further reading

- [react.dev — `act`](https://react.dev/reference/react/act) — notes that
  "you could use a library like React Testing Library, whose helpers are
  wrapped with `act()`," which is why this package's tests never import
  `act` directly and still see committed async state before assertions run.
- [react.dev — Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates) —
  batching applies to updates from promises/timeouts/native handlers, not
  just updates inside React's own event handlers.
- [testing-library.com — Async Methods](https://testing-library.com/docs/dom-testing-library/api-async/) —
  `findBy*`, `waitFor`, and `waitForElementToBeRemoved` reference.
- [Vitest — `vi.mock`](https://vitest.dev/api/vi.html#vi-mock) and
  [`vi.importActual`](https://vitest.dev/api/vi.html#vi-importactual) — the
  partial-mock shape used to mock only `fetchUser` while keeping `api.ts`'s
  other exports (the `User` type, `GOOD_USER_ID`) real.
