import { useState } from "react";
import { SearchBox } from "./SearchBox";

/**
 * Concept: Mocking basics
 *
 * Layout convention for every concept package (see
 * hooks/use-state-basics/src/App.tsx for the canonical reference):
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * Here the interactive demo is the real, debounced SearchBox (typing in it
 * triggers a real setTimeout-based debounce and a real, artificially
 * latent searchApi() call — nothing about the on-page demo is mocked).
 * The "what just happened" panel instead lets you flip between the two
 * ways this component is *tested*: with real timers/api (slow but
 * genuinely correct) vs. with vi.mock + vi.useFakeTimers (fast and
 * deterministic). See ./README.md for the full write-up.
 */

type TestId = "slow" | "mocked";

interface TestInfo {
  label: string;
  file: string;
  code: string;
  explanation: string;
  outcome: "slow" | "fast";
}

// Keep these snippets in sync with the real files under src/__tests__/ —
// they're display copies, not derived automatically, so what you read here
// is a faithful (if trimmed) picture of what actually runs in CI.
const TESTS: Record<TestId, TestInfo> = {
  slow: {
    label: "Real timers, real api",
    file: "src/__tests__/search-box.slow.test.tsx",
    code: `// No vi.mock at all — the real debounce timer and the real,
// artificially-latent searchApi() both run for real.
const user = userEvent.setup();
render(<SearchBox />);

await user.type(screen.getByLabelText(/search the catalog/i), "keyboard");

// Has to POLL: real time genuinely has to pass for the debounce
// timer and the simulated network call to resolve.
expect(
  await screen.findByText("Mechanical Keyboard", {}, { timeout: 2000 }),
).toBeInTheDocument();`,
    explanation:
      "Correct, and exercises the real debounce timer + real (simulated-latency) api end " +
      "to end — but every run genuinely pays the ~300ms debounce plus the api's ~400ms " +
      "latency in real wall-clock time, which is why findByText (a polling, async query) " +
      "is required here rather than a sync one.",
    outcome: "slow",
  },
  mocked: {
    label: "Mocked api, fake timers",
    file: "src/__tests__/search-box.mocked.test.tsx",
    code: `// The api module is mocked at the network boundary...
vi.mock("../api");
vi.mocked(searchApi).mockResolvedValue([{ id: "2", label: "Mechanical Keyboard" }]);

// ...and time itself is simulated.
vi.useFakeTimers();
render(<SearchBox />);

// fireEvent, not user-event: user-event's own internal waiting between
// simulated keystrokes doesn't reliably resolve once the clock is fake
// (even with its documented advanceTimers option) — fireEvent has no
// async waiting of its own, so the fake clock doesn't affect it.
fireEvent.change(screen.getByLabelText(/search the catalog/i), {
  target: { value: "keyboard" },
});

// Advance past the 300ms debounce window...
await vi.advanceTimersByTimeAsync(300);
// ...then flush again: searchApi()'s .then() callback (and the setState
// calls inside it) are created DURING that timer callback, one hop later
// than the microtasks the first flush already drained.
await vi.advanceTimersByTimeAsync(0);

// Everything has already flushed, so a plain sync query is correct here.
expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();`,
    explanation:
      "Deterministic and fast because both the network boundary (vi.mock) and the " +
      "passage of time (vi.useFakeTimers) are simulated instead of real — there's " +
      "nothing left to poll for once the fake clock has been advanced past the " +
      "debounce window, so a synchronous getByText is the right query.",
    outcome: "fast",
  },
};

export function App() {
  const [activeId, setActiveId] = useState<TestId | null>(null);

  const active = activeId ? TESTS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Mocking basics</h1>
        <p>
          A test that hits a real network call and real timers is slow and, over a whole suite,
          expensive — but it's genuinely correct. Mocking the module and the clock at the boundary (
          <code>vi.mock</code>, <code>vi.useFakeTimers</code>) keeps the test correct while making
          it deterministic and near-instant. Both styles below are real tests that run on every
          commit — the point is when to reach for each.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Why mock at all</h3>
          <p>
            <code>SearchBox</code> debounces with <code>useEffect</code> + <code>setTimeout</code>{" "}
            before calling <code>searchApi()</code>, which itself wraps a <code>setTimeout</code> to
            simulate real network latency. Testing that flow with real timers works, but it's slow
            by construction — and slow tests either get skipped or make the whole suite unpleasant
            to run.
          </p>
          <ul>
            <li>
              <strong>Mock the module</strong> (<code>vi.mock("../api")</code>) to replace{" "}
              <code>searchApi</code> with a stub you control via{" "}
              <code>vi.mocked(searchApi).mockResolvedValue(...)</code> — no real request, no real
              delay.
            </li>
            <li>
              <strong>Mock the clock</strong> (<code>vi.useFakeTimers()</code>) to replace native{" "}
              <code>setTimeout</code>/<code>setInterval</code> with a fake clock you advance
              manually via <code>vi.advanceTimersByTimeAsync(ms)</code> — the async variant also
              flushes pending microtasks (like an already-mocked promise's <code>.then()</code>),
              which the sync <code>advanceTimersByTime</code> does not.
            </li>
          </ul>

          <h3 className="theory-subhead">The useEffect cleanup this relies on</h3>
          <p>
            Per React's <code>useEffect</code> reference: after a commit with changed dependencies,
            React first runs the previous cleanup function, then runs the new setup. So each
            keystroke's effect run cancels the previous keystroke's pending timer before scheduling
            its own — only the last keystroke in a burst survives to actually call{" "}
            <code>searchApi</code>.
          </p>

          <h3 className="theory-subhead">Why the fake-timer test still needs care</h3>
          <ul>
            <li>
              <code>@testing-library/user-event</code> normally simulates typing more realistically
              than <code>fireEvent</code> (see the <code>rtl-basics</code> concept for why that's
              usually the better default) — but its own internal waiting between simulated
              keystrokes doesn't reliably resolve once <code>vi.useFakeTimers()</code> is active,
              even with its documented <code>advanceTimers</code> option. The mocked test below
              reaches for plain <code>fireEvent.change</code> instead specifically to sidestep that:
              it has no async waiting of its own, so a fake clock doesn't affect it at all.
            </li>
            <li>
              Testing Library wraps <code>render</code> and <code>fireEvent</code> in React's{" "}
              <code>act()</code> automatically, applying pending state updates before the next line
              of the test runs. <code>vi.advanceTimersByTimeAsync</code> flushes one round of
              pending microtasks after the timer fires — but <code>searchApi()</code>'s{" "}
              <code>.then()</code> callback (and the state updates inside it) are only created{" "}
              <em>during</em> that timer callback, one hop later. A second, zero-length{" "}
              <code>advanceTimersByTimeAsync(0)</code> drains that trailing hop instead of guessing
              a slightly larger single delay.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p>
            This <code>SearchBox</code> is the real component under test — typing in it runs the
            real debounce timer and the real (artificially latent) <code>searchApi()</code>. Nothing
            here is mocked; only the <em>tests</em> for this component differ in that.
          </p>
          <SearchBox />
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          <p className="test-toggle-note">
            Pick a test file to inspect — both run on every commit in CI:
          </p>
          <div className="demo-buttons">
            {(Object.keys(TESTS) as TestId[]).map((id) => (
              <button key={id} onClick={() => setActiveId(id)} data-active={activeId === id}>
                {TESTS[id].label}
              </button>
            ))}
          </div>

          {active ? (
            <div className="explain-body">
              <p>
                <code>{active.file}</code>
              </p>
              <p>
                <span className={`explain-outcome ${active.outcome}`}>
                  {active.outcome === "slow"
                    ? "~700ms real wall-clock time: "
                    : "~milliseconds, deterministic: "}
                </span>
                {active.explanation}
              </p>
              <pre>
                <code>{active.code}</code>
              </pre>
            </div>
          ) : (
            <p className="explain-placeholder">
              Click a test above to see the exact code that runs and why it behaves that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
