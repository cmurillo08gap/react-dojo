import { useState } from "react";

/**
 * Concept: useState basics
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

type ActionId = "increment" | "unsafe" | "safe" | "reset";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  increment: {
    label: "+1",
    code: `function increment() {
  setCount((c) => c + 1);
}`,
    explanation:
      "The updater-function form reads the latest state directly, so this is safe " +
      "no matter how many times it's queued in the same event handler.",
  },
  unsafe: {
    label: "+2 (stale closure bug)",
    code: `function incrementTwiceUnsafely() {
  // Both calls close over the SAME "count" value captured when this
  // handler was created for this render — the second call doesn't see
  // the first call's update.
  setCount(count + 1);
  setCount(count + 1);
}`,
    explanation:
      'Only +1 happens, not +2. Both setCount calls capture the same "count" from this ' +
      "render's closure, so the second call overwrites the first with the same value " +
      "instead of building on it.",
    outcome: "buggy",
  },
  safe: {
    label: "+2 (updater fn, correct)",
    code: `function incrementTwiceSafely() {
  setCount((c) => c + 1);
  setCount((c) => c + 1);
}`,
    explanation:
      "Each updater function receives the pending state from the previous queued update, " +
      "not the stale closed-over value — so both calls apply and the count goes up by 2.",
    outcome: "correct",
  },
  reset: {
    label: "reset",
    code: `setCount(0);`,
    explanation:
      "Resetting to a fixed value doesn't depend on the previous state at all, so a plain " +
      "value (not an updater function) is the right, simplest choice here.",
  },
};

export function App() {
  const [count, setCount] = useState(0);
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  function run(id: ActionId) {
    setActiveId(id);
    switch (id) {
      case "increment":
        setCount((c) => c + 1);
        break;
      case "unsafe":
        // Intentional bug — see ACTIONS.unsafe for why this only adds 1, not 2.
        setCount(count + 1);
        setCount(count + 1);
        break;
      case "safe":
        setCount((c) => c + 1);
        setCount((c) => c + 1);
        break;
      case "reset":
        setCount(0);
        break;
    }
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useState basics</h1>
        <p>
          State is local to the component instance and persists across re-renders. The{" "}
          <strong>updater function</strong> form of the setter reads the latest state, which
          matters whenever a handler queues more than one update in the same pass.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Declaring state</h3>
          <p>
            <code>useState</code> is a hook <strong>built into React</strong> (imported from{" "}
            <code>"react"</code>) that gives a function component its own local state.
          </p>
          <pre>
            <code>const [count, setCount] = useState(0);</code>
          </pre>
          <ul>
            <li>
              <code>useState(0)</code> — call it with the state's initial value; <code>0</code>{" "}
              here.
            </li>
            <li>
              <code>count</code> — the current value for <em>this</em> render, read like a normal
              variable.
            </li>
            <li>
              <code>setCount</code> — the paired function that requests a re-render with a new
              value.
            </li>
            <li>
              The <code>[count, setCount]</code> names are array destructuring — the hook always
              returns a two-item <code>[value, setter]</code> tuple, so you're free to name the
              pair whatever fits (<code>[isOpen, setIsOpen]</code>, etc.).
            </li>
          </ul>

          <h3 className="theory-subhead">Key rules</h3>
          <ul>
            <li>
              Prefer <code>setCount(c ={">"} c + 1)</code> whenever the next state depends on the
              previous state.
            </li>
            <li>
              <code>useState</code>'s setter identity is stable across renders — safe to omit
              from a dependency array.
            </li>
            <li>
              React <strong>batches</strong> state updates queued in the same event handler into
              a single re-render.
            </li>
            <li>
              A value-form call (<code>setCount(count + 1)</code>) closes over whatever{" "}
              <code>count</code> was when the handler was created for this render.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p className="demo-count">
            Count: <strong>{count}</strong>
          </p>
          <div className="demo-buttons">
            {(Object.keys(ACTIONS) as ActionId[]).map((id) => (
              <button key={id} onClick={() => run(id)} data-active={activeId === id}>
                {ACTIONS[id].label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                {active.outcome && (
                  <span className={`explain-outcome ${active.outcome}`}>
                    {active.outcome === "buggy" ? "⚠ Buggy: " : "✓ Correct: "}
                  </span>
                )}
                {active.explanation}
              </p>
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
