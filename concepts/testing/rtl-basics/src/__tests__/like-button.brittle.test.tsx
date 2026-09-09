import { test, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LikeButtonRefactored } from "../LikeButtonRefactored";

/**
 * `test.fails` is Vitest's inverse-assertion API (mirroring Jest's
 * `test.failing`): the test body is EXPECTED to throw. If it throws,
 * Vitest reports this test as passing; if it runs to completion without
 * throwing, Vitest reports it as failing. That's what keeps this whole
 * suite green while still concretely demonstrating a real brittleness
 * problem — the test only "passes" because the brittle query provably
 * breaks.
 *
 * This test queries by implementation detail — a CSS class name reached
 * via raw DOM traversal (`container.querySelector(".like-btn")`) — instead
 * of by accessible role/name, and dispatches a raw `fireEvent.click`
 * instead of a realistic `userEvent.click`. It renders
 * `LikeButtonRefactored`, which has the SAME accessible role, name, and
 * click behavior as `LikeButton` (see like-button.accessible.test.tsx,
 * which covers both) but was refactored to use the class name
 * "like-toggle" instead of "like-btn". Because this test hard-codes
 * ".like-btn", `querySelector` returns `null` here — the click below
 * throws, and the assertion after it never even runs.
 *
 * The danger this is meant to make concrete: this exact same query
 * (`container.querySelector(".like-btn")`) still works FINE against the
 * original `LikeButton` — nothing catches this brittleness until someone
 * does a purely cosmetic, behavior-preserving class-name refactor, at
 * which point a test written this way fails for a reason that has nothing
 * to do with whether the feature actually still works for a user.
 */
test.fails("clicking .like-btn likes it (brittle, implementation-detail query)", () => {
  const { container } = render(<LikeButtonRefactored />);

  // LikeButtonRefactored's button has className "like-toggle", not
  // "like-btn" — see its source. This query returns null.
  const button = container.querySelector(".like-btn");

  // fireEvent.click on a null element throws, so this test body never
  // reaches the assertion below — which is exactly the point: the query
  // itself is the brittle part, and it fails before behavior is even
  // exercised.
  fireEvent.click(button as Element);

  expect(button).toHaveTextContent("Like (1)");
});
