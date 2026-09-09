import { useState } from "react";
import { SignupForm, type SignupFormValues } from "./SignupForm";

/**
 * Concept: Accessible queries
 *
 * Layout convention for every concept package (see hooks/use-state-basics
 * for the reference):
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to whichever implementation is
 *      selected, showing the exact test-query snippets that apply to it
 *      and why they behave that way.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

type Variant = "broken" | "fixed";

interface VariantInfo {
  label: string;
  code: string;
  explanation: string;
  outcome: "buggy" | "correct";
}

// Keep these snippets in sync with the real test files
// (src/__tests__/signup-form.broken-toggle.test.tsx and
// signup-form.accessible.test.tsx) — they're display copies, not derived
// automatically, so the reader sees exactly what the tests do without any
// build-time magic.
const VARIANTS: Record<Variant, VariantInfo> = {
  broken: {
    label: "Broken",
    code: `// signup-form.broken-toggle.test.tsx

// This throws — test.fails asserts that it does.
test.fails("getByRole cannot find the broken toggle...", () => {
  render(<SignupForm variant="broken" onSubmit={vi.fn()} />);
  screen.getByRole("switch", { name: /subscribe/i });
});

// The pragmatic fallback: it IS findable this way...
it("can still be found via data-testid, as a last resort", async () => {
  render(<SignupForm variant="broken" onSubmit={vi.fn()} />);
  const toggle = screen.getByTestId("subscribe-toggle");
  await userEvent.click(toggle); // ...but this proves nothing about a11y.
});`,
    explanation:
      'The <div onClick> has no role, so getByRole("switch", ...) finds nothing — ' +
      "that thrown error is exactly what test.fails expects, so the test passes by " +
      "failing. getByTestId still finds the div (it's the only handle available), " +
      "and clicking it still works — but needing a test id here is itself the signal " +
      "of a real bug: no role, so no keyboard access and nothing for a screen reader " +
      "to announce.",
    outcome: "buggy",
  },
  fixed: {
    label: "Fixed",
    code: `// signup-form.accessible.test.tsx

const subscribe = screen.getByRole("switch", { name: /subscribe/i });
await userEvent.click(subscribe);
expect(subscribe).toHaveAttribute("aria-checked", "true");`,
    explanation:
      'role="switch" plus an accessible name (its own visible text) means ' +
      "getByRole finds it directly — no test id needed. That query proves the same " +
      "thing a screen reader user's assistive tech relies on: a real role and name, " +
      "not just a DOM node that happens to be present.",
    outcome: "correct",
  },
};

export function App() {
  const [variant, setVariant] = useState<Variant>("broken");
  const [lastSubmitted, setLastSubmitted] = useState<SignupFormValues | null>(null);

  const active = VARIANTS[variant];

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Accessible queries</h1>
        <p>
          <code>getByRole</code>/<code>getByLabelText</code> and friends don't just check that a
          node exists in the DOM — they check that a real user, or assistive technology, could
          actually find and operate it. <code>data-testid</code> is a last resort precisely because
          it skips that check.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Query priority</h3>
          <p>
            Testing Library's own docs rank queries by how closely they match how a user finds
            things, most to least recommended:
          </p>
          <ul>
            <li>
              <code>getByRole</code> — the accessibility tree's role + accessible name; works for
              almost anything interactive.
            </li>
            <li>
              <code>getByLabelText</code> — a form field found the same way a{" "}
              <code>&lt;label htmlFor&gt;</code> click target or a screen reader would find it.
            </li>
            <li>
              <code>getByPlaceholderText</code>, <code>getByText</code>,{" "}
              <code>getByDisplayValue</code> — reasonable, but weaker signals than a role or a
              label.
            </li>
            <li>
              <code>getByTestId</code> — <strong>last resort</strong>: it finds a DOM node
              regardless of whether a real user could ever find or operate it.
            </li>
          </ul>

          <h3 className="theory-subhead">Any element accepts role, aria-*, tabIndex</h3>
          <p>
            React doesn't treat <code>role</code>, <code>aria-*</code>, or <code>tabIndex</code>{" "}
            specially — they're plain DOM props available on <em>every</em> built-in element,
            exactly as in HTML. Adding <code>onClick</code> to a <code>&lt;div&gt;</code> makes it
            respond to a mouse click, but React does nothing else on its behalf: no implicit role,
            no keyboard handling, no entry in the tab order. Those have to be added explicitly (or,
            simpler, by using a real <code>&lt;button&gt;</code>, which gets them for free).
          </p>

          <h3 className="theory-subhead">Controlled checkboxes</h3>
          <p>
            A checkbox is controlled with <code>checked</code> (a boolean) plus an{" "}
            <code>onChange</code> that reads <code>event.target.checked</code> — the same
            controlled-input shape as a text input, just with a different prop and a different field
            on the event.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-toggles">
            {(Object.keys(VARIANTS) as Variant[]).map((id) => (
              <button key={id} data-active={variant === id} onClick={() => setVariant(id)}>
                {VARIANTS[id].label}
              </button>
            ))}
          </div>

          <p className="tab-hint">
            Try tabbing to the "Subscribe to newsletter" control with your keyboard —{" "}
            {variant === "broken"
              ? "the div receives no focus at all; Tab skips straight over it."
              : "the button receives a visible focus outline and toggles with Space/Enter."}
          </p>

          <SignupForm key={variant} variant={variant} onSubmit={setLastSubmitted} />

          {lastSubmitted && (
            <p className="debug-readout">Last submit: {JSON.stringify(lastSubmitted)}</p>
          )}
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          <div className="explain-body">
            <p>
              <span className={`explain-outcome ${active.outcome}`}>
                {active.outcome === "buggy" ? "⚠ Broken: " : "✓ Fixed: "}
              </span>
              {active.explanation}
            </p>
            <pre>
              <code>{active.code}</code>
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
