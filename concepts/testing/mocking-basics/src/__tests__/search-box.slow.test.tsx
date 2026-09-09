import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBox } from "../SearchBox";

// NAIVE APPROACH — real timers, real (simulated-latency) api module.
//
// This test is CORRECT: it exercises the actual 300ms debounce timer and
// the actual searchApi() setTimeout-wrapped promise, end to end, with
// nothing mocked. But it is slow — every run genuinely waits out the debounce
// plus the api's simulated network latency (~700ms of real wall-clock time
// here), and that cost multiplies across a whole suite once many components
// do similar async work. See search-box.mocked.test.tsx for the
// deterministic, near-instant alternative this motivates.
describe("SearchBox (real timers, real api)", () => {
  it("shows a matching result after typing", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);

    await user.type(screen.getByLabelText(/search the catalog/i), "keyboard");

    // findByText polls until the text appears or the timeout elapses — the
    // only correct way to wait here, since nothing is simulated: real time
    // has to actually pass for the debounce timer and the api call to
    // resolve. The explicit 2000ms timeout sits comfortably above the
    // ~300ms debounce + ~400ms simulated latency + userEvent's own typing
    // time, so the test doesn't flake under normal system load.
    expect(
      await screen.findByText("Mechanical Keyboard", {}, { timeout: 2000 }),
    ).toBeInTheDocument();
  });
});
