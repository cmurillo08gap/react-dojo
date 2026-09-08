import { useRef, useState } from "react";

/**
 * Concept: rendering lists & keys
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

interface Item {
  id: number;
  label: string;
}

const INITIAL_ITEMS: Item[] = [
  { id: 1, label: "Buy milk" },
  { id: 2, label: "Walk the dog" },
  { id: 3, label: "Write code" },
];

type ActionId = "insert" | "reset";

interface ActionInfo {
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual JSX below — they're display
// copies, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  insert: {
    code: `// 🐛 keyed by index
{items.map((item, index) => (
  <li key={index}><input defaultValue={item.label} /></li>
))}

// ✅ keyed by id
{items.map((item) => (
  <li key={item.id}><input defaultValue={item.label} /></li>
))}`,
    explanation:
      "A new item was inserted at the top. In the index-keyed list, React matches DOM nodes " +
      'by position, not identity — the <input> that used to be "item 0" is still "item 0", so ' +
      "it keeps its old uncontrolled text even though the label next to it now describes a " +
      "different, newer item. In the id-keyed list, each item's key travels with it, so React " +
      "creates a fresh input for the new item and correctly reuses (and repositions) the " +
      "existing ones — every input's text still matches its own label.",
    outcome: "buggy",
  },
  reset: {
    code: `setItems(INITIAL_ITEMS);`,
    explanation:
      "The list is back to its original three items in both columns, so their inputs and " +
      "labels agree again — insert a new item above to reproduce the mismatch.",
  },
};

export function App() {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [activeId, setActiveId] = useState<ActionId | null>(null);
  const nextId = useRef(4);

  function insertAtTop() {
    setItems((current) => [{ id: nextId.current++, label: "🆕 Freshly inserted" }, ...current]);
    setActiveId("insert");
  }

  function reset() {
    setItems(INITIAL_ITEMS);
    setActiveId("reset");
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Rendering lists & keys</h1>
        <p>
          <code>key</code> tells React which array item a rendered element <em>is</em>, across
          re-renders — not where it happens to sit. Get it wrong and React reuses the wrong DOM node
          for the wrong piece of data.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Rendering an array</h3>
          <p>
            <code>{"array.map(item => <li key={item.id}>{item.label}</li>)"}</code> is the standard
            way to turn data into elements. React needs a <code>key</code> on each item in a dynamic
            list to track identity across re-renders — it warns in the console when one's missing.
          </p>

          <h3 className="theory-subhead">What key is for</h3>
          <ul>
            <li>
              React's reconciler matches new elements to old ones <strong>by key</strong> at each
              position, not by index in the array. A stable key lets it reuse the right DOM node
              (and the right component instance, with its state) when the list is reordered,
              filtered, or has items inserted/removed.
            </li>
            <li>
              The array index is <em>only</em> safe as a key when the list is static — never
              reordered, filtered, or added to/removed from in the middle.
            </li>
            <li>
              Reach for a stable, unique id from your data (a database id, a generated uuid) — never{" "}
              <code>Math.random()</code> in the render (a new key every render defeats the purpose
              entirely).
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p className="demo-hint">
            Try editing the text in one of the inputs below, then insert a new item and watch which
            input the text "sticks" to.
          </p>
          <div className="compare">
            <div className="compare-col buggy">
              <h3>
                Keyed by index <span className="explain-outcome buggy">⚠</span>
              </h3>
              <ul className="item-list">
                {items.map((item, index) => (
                  <li key={index}>
                    <span className="list-label">{item.label}</span>
                    <input defaultValue={item.label} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="compare-col correct">
              <h3>
                Keyed by id <span className="explain-outcome correct">✓</span>
              </h3>
              <ul className="item-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <span className="list-label">{item.label}</span>
                    <input defaultValue={item.label} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="demo-buttons">
            <button onClick={insertAtTop} data-active={activeId === "insert"}>
              Insert new item at top
            </button>
            <button onClick={reset} data-active={activeId === "reset"}>
              Reset
            </button>
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
              Insert a new item above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
