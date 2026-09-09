import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LikeButton } from "../LikeButton";
import { LikeButtonRefactored } from "../LikeButtonRefactored";

/**
 * These tests query and interact the way a user (or a screen reader)
 * actually would: by accessible role + name
 * (`getByRole("button", { name: /like/i })`) and by simulating real
 * interaction (`userEvent.click`, which — unlike a raw `fireEvent.click` —
 * dispatches the fuller event sequence a browser produces for an actual
 * click: pointer/mouse events, focus, then click).
 *
 * The whole point of parameterizing over BOTH components: this exact test
 * body passes against BOTH implementations below, because neither
 * implementation's role, accessible name, or click behavior differs — only
 * their internal markup and class names do (see LikeButtonRefactored's
 * doc comment). A query written against role/name can never be broken by a
 * refactor like that, which is exactly why it's the recommended default —
 * see testing-library.com's guiding principle: "The more your tests
 * resemble the way your software is used, the more confidence they can
 * give you."
 */
describe.each([
  { name: "LikeButton (original)", Component: LikeButton },
  {
    name: "LikeButtonRefactored (same behavior, different markup)",
    Component: LikeButtonRefactored,
  },
])("$name — accessible role/name query", ({ Component }) => {
  it("starts unliked, with no count shown", () => {
    render(<Component />);

    const button = screen.getByRole("button", { name: /like/i });

    expect(button).not.toHaveTextContent(/\(\d+\)/);
  });

  it("likes on click, showing a count of 1", async () => {
    const user = userEvent.setup();
    render(<Component />);
    const button = screen.getByRole("button", { name: /like/i });

    await user.click(button);

    // Re-query: the accessible name itself changed ("Like" -> "Like (1)"),
    // but the role + a loose name pattern still finds the same element.
    expect(screen.getByRole("button", { name: /like/i })).toHaveTextContent(/like \(1\)/i);
  });

  it("un-likes on a second click, without resetting the count", async () => {
    const user = userEvent.setup();
    render(<Component />);
    const button = screen.getByRole("button", { name: /like/i });

    await user.click(button); // like -> count is now 1
    await user.click(button); // unlike -> count is preserved, just hidden

    expect(screen.getByRole("button", { name: /like/i })).not.toHaveTextContent(/\(\d+\)/);
  });

  it("increments the count again on the next like", async () => {
    const user = userEvent.setup();
    render(<Component />);
    const button = screen.getByRole("button", { name: /like/i });

    await user.click(button); // like -> (1)
    await user.click(button); // unlike
    await user.click(button); // like -> (2)

    expect(screen.getByRole("button", { name: /like/i })).toHaveTextContent(/like \(2\)/i);
  });
});
