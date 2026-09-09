# Concept: Mocking basics

**Category:** testing
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A test that exercises real timers and a realistically-latent network call
  is genuinely **correct** — but it's slow, and that cost multiplies across
  a whole suite once many components do similar async work.
- Mocking at the **module boundary** (`vi.mock("../api")`) replaces the
  network call with a stub you control via
  `vi.mocked(searchApi).mockResolvedValue(...)` — no real request, no real
  delay.
- Mocking the **clock** (`vi.useFakeTimers()` +
  `vi.advanceTimersByTimeAsync(ms)`) replaces native `setTimeout` with a
  fake one you advance manually — the **async** variant matters specifically
  because it also flushes one round of pending microtasks after the timer
  fires. That's not always quite enough on its own: a `.then()` callback
  created _during_ that timer callback (like `searchApi()`'s here) is one
  microtask hop later still, so this package's mocked test calls
  `advanceTimersByTimeAsync` a second time, with a `0` delay, to drain that
  trailing hop instead of guessing a slightly larger single delay.
- `@testing-library/user-event` is normally the better default over
  `fireEvent` (see the `rtl-basics` concept for why) — but its own internal
  waiting between simulated keystrokes doesn't reliably resolve once
  `vi.useFakeTimers()` is active, even with its documented `advanceTimers`
  setup option. The mocked test below reaches for plain `fireEvent.change`
  instead specifically to sidestep that: it has no async waiting of its
  own, so a fake clock doesn't affect it at all. That's a deliberate,
  narrow trade-off for this one test — not a general reason to prefer
  `fireEvent` elsewhere.

The demo component, `SearchBox`, debounces a search input with `useEffect`

- `setTimeout` before calling `searchApi()` (itself an artificially-latent
  `setTimeout`-wrapped promise standing in for a real network call). Two real
  test files prove the contrast:

* [`src/__tests__/search-box.slow.test.tsx`](src/__tests__/search-box.slow.test.tsx) —
  real timers, real (simulated-latency) `api` module, driven with
  `user-event`. Correct, but pays out ~700ms of real wall-clock time per
  run.
* [`src/__tests__/search-box.mocked.test.tsx`](src/__tests__/search-box.mocked.test.tsx) —
  `vi.mock("../api")` + `vi.useFakeTimers()`, driven with `fireEvent`. Same
  behavior asserted, near-instant and deterministic.

Run it:

```bash
pnpm --filter concept-mocking-basics dev
```

Open the printed local URL. The interactive `SearchBox` demo runs for real
— nothing about the on-page component is mocked, only its _tests_ are. Use
the "What just happened" panel to flip between the two test files and
compare their code and their cost.

Run the tests:

```bash
pnpm --filter concept-mocking-basics test
```

Both pass. Watch the difference in wall-clock time between the two test
files if you run `pnpm --filter concept-mocking-basics test -- --reporter=verbose`.

## Key takeaways

- A real-timers/real-boundary test isn't wrong — it's the strongest possible
  evidence the feature works end to end. The question is whether every test
  in a suite needs to pay that cost, or whether the module/timer boundary
  can be mocked once correctness is established.
- `vi.mock("../api")` (no factory) automocks the module — every exported
  function becomes a `vi.fn()` you then configure per test with
  `vi.mocked(fn).mockResolvedValue(...)` / `.mockRejectedValue(...)`.
- Prefer `vi.advanceTimersByTimeAsync` over `vi.advanceTimersByTime`
  whenever a timer callback does anything async (a `.then()`, an `await`) —
  the sync version only fires the callback, it doesn't wait for what that
  callback kicks off. Even the async version may need calling more than
  once if the resulting promise chain is more than one hop deep.
- `user-event` and `vi.useFakeTimers()` don't always combine cleanly —
  `fireEvent` is a reasonable, narrow escape hatch specifically for a test
  under fake timers, not a general substitute for `user-event`.
- Always pair `vi.useFakeTimers()` with a matching `vi.useRealTimers()`
  cleanup (an `afterEach` in this package) — fake timers left active leak
  into whichever test file Vitest happens to run next in the same worker.

## Discussion / interview questions

1. Why does `search-box.mocked.test.tsx` use a plain synchronous
   `getByText` for its final assertion while `search-box.slow.test.tsx`
   needs `findByText`? What would break if you swapped them?
2. What specifically goes wrong if you call
   `vi.advanceTimersByTime(300)` (the sync version) instead of
   `await vi.advanceTimersByTimeAsync(300)` in the mocked test?
3. Why does the mocked test call `advanceTimersByTimeAsync` twice (once
   for the 300ms debounce, once more with a `0` delay) instead of once?
4. `search-box.mocked.test.tsx` uses `fireEvent.change` instead of
   `user-event`, while `search-box.slow.test.tsx` uses `user-event`. What
   would you check first if a teammate asked "why not use `user-event`
   everywhere for consistency?"
5. `SearchBox`'s `useEffect` cleanup clears the previous keystroke's pending
   timer before scheduling a new one. Why does that matter for correctness
   even in a version of this test that doesn't mock anything at all?

## Further reading

- [react.dev — `useEffect`](https://react.dev/reference/react/useEffect) —
  confirms React always runs an effect's previous cleanup before re-running
  it for changed dependencies, which is what makes the debounce's
  cancel-then-reschedule behavior work.
- [react.dev — `act`](https://react.dev/reference/react/act) — Testing
  Library's `render` and `fireEvent` wrap pending React updates in `act()`
  for you, which is what makes state committed by
  `vi.advanceTimersByTimeAsync`'s flushed microtasks visible to the very
  next assertion.
- [Vitest — Mocking: Timers](https://vitest.dev/guide/mocking.html#timers) —
  `vi.useFakeTimers`, `vi.advanceTimersByTime` vs.
  `vi.advanceTimersByTimeAsync`.
- [Vitest — `vi.mock`](https://vitest.dev/api/vi.html#vi-mock) — module
  mocking and automocking semantics.
- [testing-library.com — user-event options: `advanceTimers`](https://testing-library.com/docs/user-event/options/) —
  documents the `advanceTimers` setup option for combining `user-event`
  with fake timers, and explicitly recommends it over `{ delay: null }` —
  the option this package's own tests found wasn't enough to avoid a hang
  in this combination of versions, motivating the `fireEvent` fallback.
