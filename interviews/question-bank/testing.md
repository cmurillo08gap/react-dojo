# Question bank: Testing

Tags: `rtl` `vitest` `mocking` `accessibility`

---

### Why does React Testing Library push you toward querying by role/label instead of class names or component internals? What actually breaks when a test is coupled to implementation details?

- **Difficulty:** easy/medium
- **Discussion points:** RTL's guiding principle is testing the way a user
  actually interacts with the UI — by role, label, visible text — rather
  than by structure that's an implementation detail (a class name, a
  specific DOM nesting). A test coupled to those details breaks on a
  harmless refactor (renamed class, restructured markup) even though the
  user-facing behavior didn't change — a false failure that erodes trust
  in the suite.
- **Follow-ups:**
  - Show a concrete refactor that would break a `container.querySelector`
    -based test but not an equivalent `getByRole`-based one, for the same
    unchanged behavior.

---

### How do you test a component with loading/success/error states from an async fetch, without a flaky test?

- **Difficulty:** medium
- **Discussion points:** `findBy*` queries (async, retry-until-found or
  timeout) for content that appears after the fetch resolves, vs. plain
  `getBy*` (sync, throws immediately if not yet present) for what should
  already be there; `waitFor`/`waitForElementToBeRemoved` for a loading
  indicator disappearing. The flaky-test pitfall: asserting on
  post-fetch content with a sync query before the update has actually
  landed — the fix is awaiting the right async query, not adding an
  arbitrary sleep.
- **Follow-ups:**
  - Why does the sync-query version sometimes pass locally but flake in
    CI?

---

### When do you mock at the module boundary (`vi.mock`) vs. use real timers vs. fake timers, and how does that play out for testing a debounced search box?

- **Difficulty:** medium
- **Discussion points:** a real-timers, real-module test genuinely pays
  out the debounce delay and needs `findBy*` to wait for it — slower but
  closer to reality. Mocking the module boundary (the API call) plus
  `vi.useFakeTimers()` + advancing time programmatically
  (`vi.advanceTimersByTimeAsync`) resolves near-instantly and can use
  plain sync queries once time is advanced — faster and more
  deterministic, at the cost of not exercising the real timing/network
  path at all.
- **Follow-ups:**
  - What's a case where you'd deliberately keep the slower, real-timers
    version around even after adding a fast mocked one?

---

### `getByRole`/`getByLabelText` vs. `data-testid` — when is `data-testid` actually the right call, and what does defaulting to it hide?

- **Difficulty:** easy/medium
- **Discussion points:** accessible queries double-check the UI is
  actually usable (has the right role, an accessible name) as a side
  effect of being testable at all; `data-testid` bypasses that check
  entirely, so a component with no real accessible role/name can still
  pass its tests. `data-testid` is a reasonable last resort for something
  with genuinely no accessible role/text (a decorative element, a purely
  visual state hook), not a default reached for out of convenience.
- **Follow-ups:**
  - If `getByRole` can't find an element at all, what's more likely wrong
    — the test, or the component's actual accessibility?

---

### What's the difference in guarantee between "this test passes" and "this component is accessible"?

- **Difficulty:** medium
- **Discussion points:** an accessible-query-based test passing proves the
  element in question has the role/name/state the test asked for — it
  doesn't prove the whole component is usable with a screen reader,
  keyboard-only, or otherwise meets WCAG more broadly (focus order, color
  contrast, announced state changes aren't covered by a single
  `getByRole` assertion). It's a strong, cheap signal, not a substitute for
  actual accessibility review/tooling (axe, manual screen-reader testing).
- **Follow-ups:**
  - What would you add beyond RTL's accessible queries to get more actual
    accessibility coverage?
