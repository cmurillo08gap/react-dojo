import { describe, it, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "../SignupForm";

// Uses the FIXED subscribe toggle throughout — every control here has a
// real accessible role/name, so every query below is a `getBy*` query, not
// a `data-testid` fallback. See signup-form.broken-toggle.test.tsx for the
// contrast.
describe("SignupForm (fixed subscribe toggle)", () => {
  it("finds every control by its accessible role/label and submits what a user entered", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SignupForm variant="fixed" onSubmit={onSubmit} />);

    // Text input, associated to its label via <label htmlFor>.
    const email = screen.getByLabelText(/email/i);
    // A real <input type="checkbox"> with a <label htmlFor>.
    const terms = screen.getByRole("checkbox", { name: /terms/i });
    // The fixed toggle: role="switch" + its own text as the accessible name.
    const subscribe = screen.getByRole("switch", { name: /subscribe/i });
    const submit = screen.getByRole("button", { name: /sign up/i });

    await user.type(email, "learner@example.com");
    await user.click(terms);
    await user.click(subscribe);
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      email: "learner@example.com",
      agreedToTerms: true,
      subscribed: true,
    });
  });

  test("the fixed switch reports its state via aria-checked", async () => {
    const user = userEvent.setup();
    render(<SignupForm variant="fixed" onSubmit={vi.fn()} />);

    const subscribe = screen.getByRole("switch", { name: /subscribe/i });
    expect(subscribe).toHaveAttribute("aria-checked", "false");

    await user.click(subscribe);
    expect(subscribe).toHaveAttribute("aria-checked", "true");
  });
});
