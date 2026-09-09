import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBox } from "../SearchBox";
import { searchApi } from "../api";

// Mock the network boundary — the api module itself, not fetch/XHR
// internals — so searchApi() resolves with a fixed fixture instead of
// running the real ~400ms simulated-latency implementation.
vi.mock("../api");

afterEach(() => {
  // Leaving fake timers active would leak into every other test file run
  // afterward in the same process.
  vi.useRealTimers();
});

// FAST/DETERMINISTIC APPROACH — mock the api module AND fake the timers.
//
// Both the network boundary (vi.mock) and the passage of time
// (vi.useFakeTimers) are simulated here, so this test resolves
// near-instantly and gives the exact same result on every run — no
// dependence on real system timing at all — unlike search-box.slow.test.tsx.
//
// This uses `fireEvent.change`, not `@testing-library/user-event`, to
// type into the input. That's a deliberate trade-off, not the usual
// preference (see the rtl-basics concept for why user-event is normally
// the better default): user-event's own internal waiting between
// simulated keystrokes doesn't reliably resolve once `vi.useFakeTimers()`
// is active, even with its documented `advanceTimers` escape hatch — it
// hung indefinitely in this exact combination of versions. `fireEvent` has
// no async waiting of its own, so it isn't affected by the clock being
// fake at all. Reach for `fireEvent` specifically when fake timers make
// user-event impractical — not as a general substitute for it.
describe("SearchBox (mocked api, fake timers)", () => {
  it("shows a matching result after typing", async () => {
    vi.mocked(searchApi).mockResolvedValue([{ id: "2", label: "Mechanical Keyboard" }]);

    vi.useFakeTimers();

    render(<SearchBox />);
    fireEvent.change(screen.getByLabelText(/search the catalog/i), {
      target: { value: "keyboard" },
    });

    // Advance past the 300ms debounce window. The ASYNC variant matters:
    // it also flushes pending microtasks, so the mocked searchApi()
    // promise settles and the resulting setState calls commit — the plain
    // sync advanceTimersByTime would fire the setTimeout callback but NOT
    // wait for the promise it kicks off to resolve.
    await vi.advanceTimersByTimeAsync(300);
    // One flush pass only drains microtasks that existed BEFORE the timer
    // fired — searchApi()'s .then() callback is itself created *during*
    // that timer callback, and its own setState calls are one more hop
    // after that. A second, zero-length flush drains that trailing chain
    // instead of guessing a slightly-larger single delay.
    await vi.advanceTimersByTimeAsync(0);

    // By this point everything has already flushed — unlike test #1, which
    // genuinely has to wait for real time to pass and therefore needs the
    // async, polling findByText — so a plain synchronous query is correct
    // and appropriate here.
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
  });
});
