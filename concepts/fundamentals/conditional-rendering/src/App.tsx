import { useState } from "react";

/**
 * Concept: conditional rendering
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last button pressed,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

type ActionId = "dec" | "inc" | "reset";

interface ActionInfo {
  code: string;
  explanation: string;
}

// Keep this snippet in sync with the actual JSX below — it's a display
// copy, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const CODE = `// 🐛 renders the literal number 0 when count is 0 — "0" is
// falsy, so the && short-circuits, but its LEFT value (0, not
// false/undefined) is what gets rendered.
{count && <span className="badge">{count} unread</span>}

// ✅ the left side always evaluates to a real boolean.
{count > 0 && <span className="badge">{count} unread</span>}`;

export function App() {
  const [count, setCount] = useState(0);
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  function run(id: ActionId) {
    setActiveId(id);
    switch (id) {
      case "dec":
        setCount((c) => Math.max(0, c - 1));
        break;
      case "inc":
        setCount((c) => c + 1);
        break;
      case "reset":
        setCount(0);
        break;
    }
  }

  const active: ActionInfo | null = activeId
    ? {
        code: CODE,
        explanation:
          count === 0
            ? '⚠ count is now 0. Look at the "&& count" panel below — instead of rendering ' +
              'nothing, it shows a stray "0" on the page, because 0 && <Badge/> evaluates to ' +
              "0 (a falsy but perfectly renderable value), not to false or undefined."
            : `✓ count is now ${count}. Both panels agree again — the bug in "&& count" only ` +
              "shows up at exactly 0.",
      }
    : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Conditional rendering</h1>
        <p>
          JSX renders whatever an expression evaluates to — including values you probably didn't
          mean to show. <code>{"{someValue && <X />}"}</code> is the classic trap: it looks like a
          boolean check, but it isn't one.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Three ways to conditionally render</h3>
          <ul>
            <li>
              <code>{"{cond && <A />}"}</code> — render <code>{"<A />"}</code> or nothing.
            </li>
            <li>
              <code>{"{cond ? <A /> : <B />}"}</code> — render one of two things.
            </li>
            <li>
              An early <code>{"return null"}</code> (or a fallback element) at the top of a
              component — render nothing (or a fallback) for the whole component.
            </li>
          </ul>

          <h3 className="theory-subhead">The `&&` trap</h3>
          <p>
            <code>{"cond && <X />"}</code> short-circuits to <code>cond</code> itself when{" "}
            <code>cond</code> is falsy — not to <code>false</code>. React renders <code>false</code>
            , <code>null</code>, and <code>undefined</code> as nothing, but <code>0</code> and{" "}
            <code>""</code> are falsy values it happily renders as text.
          </p>
          <ul>
            <li>
              <code>{"{0 && <Badge/>}"}</code> renders the text "0".
            </li>
            <li>
              <code>{"{count > 0 && <Badge/>}"}</code> is always a real boolean on the left, so it's
              safe.
            </li>
            <li>
              A ternary with an explicit <code>null</code> branch sidesteps the trap entirely:{" "}
              <code>{"{count > 0 ? <Badge/> : null}"}</code>.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p className="demo-count">
            Count: <strong>{count}</strong>
          </p>

          <div className="compare">
            <div className="compare-col buggy">
              <h3>
                {"{count && <Badge/>}"} <span className="explain-outcome buggy">⚠</span>
              </h3>
              <div className="badge-slot">
                {count && <span className="badge">{count} unread</span>}
              </div>
            </div>
            <div className="compare-col correct">
              <h3>
                {"{count > 0 && <Badge/>}"} <span className="explain-outcome correct">✓</span>
              </h3>
              <div className="badge-slot">
                {count > 0 && <span className="badge">{count} unread</span>}
              </div>
            </div>
          </div>

          <div className="demo-buttons">
            <button onClick={() => run("dec")} data-active={activeId === "dec"}>
              −1
            </button>
            <button onClick={() => run("inc")} data-active={activeId === "inc"}>
              +1
            </button>
            <button onClick={() => run("reset")} data-active={activeId === "reset"}>
              reset
            </button>
          </div>
          <p className="demo-hint">Drive the count down to exactly 0 and compare the two slots.</p>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>{active.explanation}</p>
              <pre>
                <code>{active.code}</code>
              </pre>
            </div>
          ) : (
            <p className="explain-placeholder">
              Click a button above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
