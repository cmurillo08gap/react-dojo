import { useState } from "react";
import { LikeButton } from "./LikeButton";
import { LikeButtonRefactored } from "./LikeButtonRefactored";

/**
 * Concept: RTL basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * See ./README.md for the full write-up and discussion questions.
 *
 * This package proves its point with two REAL components
 * (LikeButton / LikeButtonRefactored) and two REAL test files
 * (src/__tests__/*.test.tsx) rather than only narrating the contrast —
 * see those files for the actual, executable proof. This page lets a
 * learner flip between the two implementations and see with their own
 * eyes that nothing about them differs to a user.
 */

type ImplId = "A" | "B";

interface ImplInfo {
  label: string;
  Component: typeof LikeButton;
  description: string;
}

const IMPLS: Record<ImplId, ImplInfo> = {
  A: {
    label: "Implementation A — LikeButton",
    Component: LikeButton,
    description: 'A single <button className="like-btn">, icon and label as one text node.',
  },
  B: {
    label: "Implementation B — LikeButtonRefactored",
    Component: LikeButtonRefactored,
    description:
      'The "after a styling refactor" version: <button className="like-toggle"> wrapping ' +
      "separate icon/label <span>s. Same role, same accessible name, same click behavior.",
  },
};

// Keep these two snippets in sync with the real test files — they're display
// copies, not derived automatically, so the reader sees exactly what the
// actual tests do without any build-time magic:
//   - src/__tests__/like-button.accessible.test.tsx
//   - src/__tests__/like-button.brittle.test.tsx
const ACCESSIBLE_SNIPPET = `test("likes on click", async () => {
  const user = userEvent.setup();
  render(<Component />); // LikeButton OR LikeButtonRefactored
  const button = screen.getByRole("button", { name: /like/i });

  await user.click(button);

  expect(screen.getByRole("button", { name: /like/i }))
    .toHaveTextContent(/like \\(1\\)/i);
});`;

const BRITTLE_SNIPPET = `test("likes on click", () => {
  const { container } = render(<Component />);
  const button = container.querySelector(".like-btn"); // <- hard-codes a class name

  fireEvent.click(button);

  expect(button).toHaveTextContent("Like (1)");
});`;

interface ImplVerdict {
  label: string;
  explanation: string;
  accessibleOutcome: "correct";
  brittleOutcome: "correct" | "buggy";
}

const VERDICTS: Record<ImplId, ImplVerdict> = {
  A: {
    label: IMPLS.A.label,
    explanation:
      'LikeButton\'s <button> actually has class "like-btn", so container.querySelector(".like-btn") ' +
      "finds it — the brittle test happens to pass here too. Both tests are green, but for different " +
      "reasons: the accessible test passes because the button behaves correctly; the brittle test " +
      "passes only because it happens to know today's class name.",
    accessibleOutcome: "correct",
    brittleOutcome: "correct",
  },
  B: {
    label: IMPLS.B.label,
    explanation:
      'LikeButtonRefactored renamed the class to "like-toggle" as part of a purely cosmetic markup ' +
      'refactor. container.querySelector(".like-btn") now returns null, so the brittle test\'s click ' +
      "throws before it can assert anything — a false failure with no connection to whether the " +
      "feature works. The accessible test, unchanged, still finds the button by role + name and " +
      "still passes: it never cared about the class name in the first place.",
    accessibleOutcome: "correct",
    brittleOutcome: "buggy",
  },
};

export function App() {
  const [impl, setImpl] = useState<ImplId>("A");
  const [activeId, setActiveId] = useState<ImplId | null>(null);

  function selectImpl(id: ImplId) {
    setImpl(id);
    setActiveId(id);
  }

  const ActiveComponent = IMPLS[impl].Component;
  const verdict = activeId ? VERDICTS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>RTL basics</h1>
        <p>
          React Testing Library's <code>render</code> + <code>screen</code> +{" "}
          <code>user-event</code> let a test query and interact with a component the way a user
          actually would. A test coupled to implementation details instead — CSS class names, raw
          DOM structure — breaks the moment someone refactors markup, even when the feature still
          works perfectly.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">The core APIs</h3>
          <ul>
            <li>
              <code>render(&lt;Component /&gt;)</code> mounts a component into a detached DOM
              container attached to <code>document.body</code>.
            </li>
            <li>
              <code>screen</code> exposes queries (<code>getByRole</code>, <code>getByText</code>,
              …) scoped to that whole document, so you don't have to thread a <code>container</code>{" "}
              reference through every assertion.
            </li>
            <li>
              <code>@testing-library/user-event</code>'s <code>userEvent.click</code> dispatches the
              fuller sequence a real browser click produces (pointer/mouse events, focus, then
              click) — closer to a real user than <code>fireEvent.click</code>, which fires a single
              synthetic event directly.
            </li>
          </ul>

          <h3 className="theory-subhead">Query by role + name, not by class</h3>
          <p>
            Testing Library's guiding principle:{" "}
            <em>
              "The more your tests resemble the way your software is used, the more confidence they
              can give you."
            </em>{" "}
            A learner (or screen reader) doesn't see CSS class names — they see a{" "}
            <strong>button labeled "Like"</strong>.{" "}
            <code>
              getByRole("button", {"{"} name: /like/i {"}"})
            </code>{" "}
            queries exactly that, and stays valid across any markup refactor that preserves the
            button's role and visible label.
          </p>

          <h3 className="theory-subhead">Why the brittle version still "works" today</h3>
          <p>
            A <code>container.querySelector(".like-btn")</code> query passes right now, because
            right now that class name exists. It says nothing about whether the class name is
            meaningful to a user — and nothing stops a future refactor from renaming it, at which
            point the test fails for a reason that has nothing to do with whether the component
            still behaves correctly. The demo and tests in this package make that concrete with two
            components that are behaviorally and visually identical but structurally different —
            flip the toggle below.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p>
            Both implementations below look and behave identically to a user — click the Like button
            under each, then switch between them. Only their internal markup/class names differ (see
            src/LikeButton.tsx vs. src/LikeButtonRefactored.tsx).
          </p>
          <div className="demo-toggles">
            {(Object.keys(IMPLS) as ImplId[]).map((id) => (
              <button key={id} onClick={() => selectImpl(id)} data-active={impl === id}>
                {IMPLS[id].label}
              </button>
            ))}
          </div>

          <div className="impl-columns">
            <div className="impl-column">
              <h3>Currently rendering</h3>
              <ActiveComponent />
              <p className="debug-readout">{IMPLS[impl].description}</p>
            </div>
          </div>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {verdict ? (
            <div className="explain-body">
              <p>{verdict.explanation}</p>
              <div className="snippet-columns">
                <div className="snippet-column">
                  <h3 className={`explain-outcome ${verdict.accessibleOutcome}`}>
                    ✓ Accessible query — always passes
                  </h3>
                  <pre>
                    <code>{ACCESSIBLE_SNIPPET}</code>
                  </pre>
                </div>
                <div className="snippet-column">
                  <h3 className={`explain-outcome ${verdict.brittleOutcome}`}>
                    {verdict.brittleOutcome === "buggy"
                      ? "⚠ Brittle query — fails here"
                      : "✓ Brittle query — passes here (by luck)"}
                  </h3>
                  <pre>
                    <code>{BRITTLE_SNIPPET}</code>
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <p className="explain-placeholder">
              Pick an implementation above to see the two competing test snippets and which one
              would keep passing against it.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
