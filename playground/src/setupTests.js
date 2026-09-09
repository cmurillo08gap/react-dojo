// Extends Vitest's `expect` with DOM-aware matchers (toBeInTheDocument,
// toHaveTextContent, etc.) used across this package's tests.
import "@testing-library/jest-dom/vitest";

// This repo's vitest config doesn't set `test.globals: true`, so Testing
// Library's own auto-cleanup (which only fires when it detects a *global*
// `afterEach`) never kicks in — without this, DOM nodes from one test would
// still be mounted when the next test's `render()` runs, breaking any query
// that expects a single match. Register it manually.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
