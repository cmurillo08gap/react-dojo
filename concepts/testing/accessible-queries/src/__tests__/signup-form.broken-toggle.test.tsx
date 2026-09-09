import { describe, it, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "../SignupForm";

// Uses the BROKEN subscribe toggle: a plain <div onClick> with no role, no
// tabIndex, and (for query purposes) no accessible name.
describe("SignupForm (broken subscribe toggle)", () => {
  // Vitest's inverse-assertion API: `test.fails` passes only if the body
  // throws. It does here — getByRole throws a "unable to find role" error
  // because the <div> has no role at all, so it never shows up in the
  // accessibility tree as a switch (or a checkbox).
  //
  // This is the whole point of an accessible query: it doesn't just check
  // that *some* DOM node for "subscribe" exists — it checks that a real
  // user, or a screen reader, could actually find and operate it. The query
  // itself is what catches this accessibility bug, before a human tester
  // (or an actual assistive-tech user) would have to.
  test.fails("getByRole cannot find the broken toggle, because it has no accessible role", () => {
    render(<SignupForm variant="broken" onSubmit={vi.fn()} />);
    screen.getByRole("switch", { name: /subscribe/i });
  });

  // The pragmatic fallback: data-testid DOES find the broken toggle, since
  // that's the only handle available on it right now, and clicking it still
  // works (its own onClick handler still fires).
  //
  // Reaching for data-testid here isn't wrong as a way to *unblock* this
  // test — but its necessity is itself a signal of a real accessibility
  // bug in the component, not a limitation of the test. The right fix is
  // to render `SubscribeToggleFixed` instead, not to stop at the test id
  // and move on.
  it("can still be found and clicked via data-testid, as a last resort", async () => {
    const user = userEvent.setup();
    render(<SignupForm variant="broken" onSubmit={vi.fn()} />);

    const toggle = screen.getByTestId("subscribe-toggle");
    expect(toggle).toHaveAttribute("data-checked", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("data-checked", "true");
  });
});
