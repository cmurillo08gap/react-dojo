import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

// A starter test for the starter component — replace both once you're
// working on your own code. This is here to show the pattern: query by
// accessible role/name and drive interaction with userEvent, the same way
// challenges/ and concepts/testing/ expect tests to be written.
describe("App", () => {
  it("renders the hello-world heading", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /hello, world/i })).toBeInTheDocument();
  });

  it("starts the click counter at 0", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /clicked 0 times/i })).toBeInTheDocument();
  });

  it("increments the count on click", async () => {
    const user = userEvent.setup();
    render(<App />);
    const button = screen.getByRole("button", { name: /clicked 0 times/i });

    await user.click(button);

    expect(screen.getByRole("button", { name: /clicked 1 times/i })).toBeInTheDocument();
  });
});
