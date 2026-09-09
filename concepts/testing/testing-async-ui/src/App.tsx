import { useState } from "react";
import { UserProfile, type Status } from "./UserProfile";

/**
 * Concept: Testing async UI
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the component's current
 *      fetch status, showing the real test snippet that asserts that exact
 *      state transition, plus why it needs to be written that way.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

interface StatusInfo {
  label: string;
  code: string;
  explanation: string;
}

// Keep these snippets in sync with src/__tests__/user-profile.test.tsx —
// they're display copies, not derived automatically, so the reader sees
// exactly what the real test does without any build-time magic.
const STATUS_INFO: Partial<Record<Status, StatusInfo>> = {
  loading: {
    label: "loading",
    code: `fireEvent.click(screen.getByRole("button", { name: /load user/i }));

// Synchronous query — correct here, because this asserts the state
// *before* the mocked promise has resolved, not after.
expect(screen.getByText(/loading/i)).toBeInTheDocument();`,
    explanation:
      "The click is synchronous, but the fetch it kicks off isn't — right after the click, " +
      "before any promise has had a chance to resolve, the component is provably in the " +
      "“loading” state. A plain, synchronous getByText is the right query here " +
      "precisely because nothing async has happened yet.",
  },
  success: {
    label: "loading → success",
    code: `fireEvent.click(screen.getByRole("button", { name: /load user/i }));

// findBy* = getBy* + waitFor: it polls until the text shows up (or times
// out), which is what correctly waits for the state update the resolved
// promise triggers.
expect(await screen.findByText(user.name)).toBeInTheDocument();`,
    explanation:
      "fetchUser() resolved, so the component moved loading → success. The resolved " +
      "promise's .then/await continuation runs as a microtask outside the test's synchronous " +
      "call stack, so the state update it queues needs an explicit await to be visible to " +
      "assertions — findByText's built-in polling (wrapped in act internally by Testing " +
      "Library) is what supplies that.",
  },
  error: {
    label: "loading → error",
    code: `fireEvent.click(screen.getByRole("button", { name: /load user/i }));

expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();`,
    explanation:
      "Same shape as the success case, but fetchUser() rejected: the catch branch sets " +
      "status to “error” instead. Still async, so it still needs findByText, not a " +
      "sync getByText — the rejection's handler runs on a later microtask too.",
  },
};

export function App() {
  const [status, setStatus] = useState<Status>("idle");
  const info = STATUS_INFO[status] ?? null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Testing async UI</h1>
        <p>
          A component with loading/error/success states driven by a real async fetch, and the
          Testing Library queries (<code>findBy*</code>, <code>waitFor</code>,{" "}
          <code>waitForElementToBeRemoved</code>) that correctly wait for each state to land —
          versus the flaky "forgot to await" mistake that looks like it works until it doesn't.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Why sync queries aren't enough here</h3>
          <p>
            <code>UserProfile</code> below calls <code>fetchUser()</code> from a plain{" "}
            <code>useState</code>-driven click handler. The state update that shows the loaded name
            or the error message doesn't happen inside the click itself — it happens later, when the
            fetch's promise settles, which is <strong>outside</strong> the test's synchronous call
            stack.
          </p>
          <ul>
            <li>
              React only guarantees a state update is reflected in the DOM once it has been{" "}
              <em>committed</em>. A promise resolving doesn't commit synchronously with the line of
              test code that triggered it.
            </li>
            <li>
              React (18+) batches updates from promises, timeouts, and native handlers the same way
              it batches updates inside its own event handlers — but batching still happens on its
              own schedule, not the instant the promise resolves.
            </li>
            <li>
              Testing Library's <code>render</code>/<code>fireEvent</code> wrap synchronous work in
              React's <code>act()</code> for you; its async utilities — <code>findBy*</code> and{" "}
              <code>waitFor</code>/<code>waitForElementToBeRemoved</code> — additionally poll and
              wrap each retry in an async <code>act()</code>, which is what lets a promise-driven
              update actually be observed.
            </li>
          </ul>

          <h3 className="theory-subhead">The pitfall</h3>
          <p>
            Asserting loaded content with a plain <code>getByText</code>{" "}
            <strong>immediately</strong> after the click — no <code>await</code> in sight — throws,
            because the component is still in the "loading" state at that instant. The test suite
            below includes exactly this mistake, wrapped in <code>test.fails(...)</code> so the
            suite stays green while still making the failure concrete and inspectable.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <UserProfile onStatusChange={setStatus} />
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {info ? (
            <div className="explain-body">
              <p>
                <span className="explain-status">{info.label}</span> {info.explanation}
              </p>
              <p className="muted">The matching assertion from the real test file:</p>
              <pre>
                <code>{info.code}</code>
              </pre>
            </div>
          ) : (
            <p className="explain-placeholder">
              Click "Load user" above to see the loading state, then the assertion that catches it.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
