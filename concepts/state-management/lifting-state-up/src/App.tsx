import { useState } from "react";

/**
 * Concept: lifting state up
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
 */

type ActionId =
  | "buggy-celsius"
  | "buggy-fahrenheit"
  | "reset-buggy"
  | "fixed-celsius"
  | "fixed-fahrenheit"
  | "reset-fixed";

interface ActionInfo {
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// 20°C / 68°F is the same temperature — both demos start in sync so the
// drift in the buggy one is caused entirely by editing, not by mismatched
// starting values.
const INITIAL_CELSIUS = 20;
const INITIAL_FAHRENHEIT = 68;

function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Keep these snippets in sync with the actual components/handlers below —
// they're display copies, not derived automatically, so the reader sees
// exactly what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  "buggy-celsius": {
    code: `function BuggyCelsiusEditor() {
  const [celsius, setCelsius] = useState(20);
  // Only this component's own state changes — the sibling
  // Fahrenheit editor has no reference to it at all.
  return <input value={celsius} onChange={(e) => setCelsius(Number(e.target.value))} />;
}`,
    explanation:
      "The Celsius editor updated its own private useState. The Fahrenheit editor rendered " +
      "next to it can't see this value, so it keeps showing whatever it last had — the two " +
      "siblings are now describing two different temperatures.",
    outcome: "buggy",
  },
  "buggy-fahrenheit": {
    code: `function BuggyFahrenheitEditor() {
  const [fahrenheit, setFahrenheit] = useState(68);
  // Same problem, mirrored: this state is invisible to
  // the Celsius editor.
  return <input value={fahrenheit} onChange={(e) => setFahrenheit(Number(e.target.value))} />;
}`,
    explanation:
      "The Fahrenheit editor updated its own private useState. Nothing connects it back to the " +
      "Celsius editor's state, so whatever the Celsius field shows is now stale.",
    outcome: "buggy",
  },
  "reset-buggy": {
    code: `// Remounting both editors (via a changed key) re-creates
// them from the same starting numbers — they agree again,
// but only by coincidence of the initial values.
setBuggyResetKey((k) => k + 1);`,
    explanation:
      "Resetting re-mounts both independent editors with the same starting numbers, so they " +
      "look in sync again. That's a coincidence of this demo's initial values, not a guarantee " +
      "— the very next edit to either field breaks it again.",
  },
  "fixed-celsius": {
    code: `<FixedCelsiusEditor celsius={celsius} onChange={setCelsius} />

function FixedCelsiusEditor({ celsius, onChange }) {
  return <input value={celsius} onChange={(e) => onChange(Number(e.target.value))} />;
}`,
    explanation:
      "The Celsius editor has no state of its own — it reports the new value up to the " +
      "parent's setCelsius. Because the Fahrenheit editor reads from that same parent state, " +
      "it re-renders with the converted value immediately.",
    outcome: "correct",
  },
  "fixed-fahrenheit": {
    code: `<FixedFahrenheitEditor celsius={celsius} onChange={setCelsius} />

function FixedFahrenheitEditor({ celsius, onChange }) {
  const fahrenheit = celsiusToFahrenheit(celsius);
  return (
    <input
      value={round1(fahrenheit)}
      onChange={(e) => onChange(fahrenheitToCelsius(Number(e.target.value)))}
    />
  );
}`,
    explanation:
      "The Fahrenheit editor derives its display value from the shared celsius prop and " +
      "converts an edit back to Celsius before handing it to the parent. Either editor can " +
      "drive the shared state; both always render the same underlying temperature.",
    outcome: "correct",
  },
  "reset-fixed": {
    code: `setCelsius(INITIAL_CELSIUS);`,
    explanation:
      "There's only one number to reset. Both editors derive from it, so they're guaranteed to " +
      "agree again — not just coincidentally, the way the buggy version does.",
  },
};

interface BuggyCelsiusEditorProps {
  onEdit: (celsius: number) => void;
}

function BuggyCelsiusEditor({ onEdit }: BuggyCelsiusEditorProps) {
  // Its own local state — the whole point of the bug: no sibling, and no
  // parent, can see or influence this value.
  const [celsius, setCelsius] = useState(INITIAL_CELSIUS);

  return (
    <label className="editor">
      <span>Celsius editor (own state)</span>
      <input
        type="number"
        step="any"
        value={celsius}
        onChange={(e) => {
          const next = Number(e.target.value);
          setCelsius(next);
          onEdit(next);
        }}
      />
      <small>{celsius}°C</small>
    </label>
  );
}

interface BuggyFahrenheitEditorProps {
  onEdit: (fahrenheit: number) => void;
}

function BuggyFahrenheitEditor({ onEdit }: BuggyFahrenheitEditorProps) {
  const [fahrenheit, setFahrenheit] = useState(INITIAL_FAHRENHEIT);

  return (
    <label className="editor">
      <span>Fahrenheit editor (own state)</span>
      <input
        type="number"
        step="any"
        value={fahrenheit}
        onChange={(e) => {
          const next = Number(e.target.value);
          setFahrenheit(next);
          onEdit(next);
        }}
      />
      <small>{fahrenheit}°F</small>
    </label>
  );
}

interface FixedEditorProps {
  celsius: number;
  onChange: (celsius: number) => void;
}

function FixedCelsiusEditor({ celsius, onChange }: FixedEditorProps) {
  return (
    <label className="editor">
      <span>Celsius editor (props from parent)</span>
      <input
        type="number"
        step="any"
        value={celsius}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <small>{celsius}°C</small>
    </label>
  );
}

function FixedFahrenheitEditor({ celsius, onChange }: FixedEditorProps) {
  const fahrenheit = celsiusToFahrenheit(celsius);

  return (
    <label className="editor">
      <span>Fahrenheit editor (props from parent)</span>
      <input
        type="number"
        step="any"
        value={round1(fahrenheit)}
        onChange={(e) => onChange(fahrenheitToCelsius(Number(e.target.value)))}
      />
      <small>{round1(fahrenheit)}°F</small>
    </label>
  );
}

export function App() {
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  // --- Buggy demo -----------------------------------------------------
  // Each sibling editor above owns its own useState. These two mirror
  // values exist ONLY so this parent can render the "in sync?" banner —
  // they are never passed back down into either editor. That's exactly
  // the bug: neither editor is fed by the other, or by any parent.
  const [buggyCelsiusMirror, setBuggyCelsiusMirror] = useState(INITIAL_CELSIUS);
  const [buggyFahrenheitMirror, setBuggyFahrenheitMirror] = useState(INITIAL_FAHRENHEIT);
  const [buggyResetKey, setBuggyResetKey] = useState(0);

  // --- Fixed demo -------------------------------------------------------
  // Single source of truth, lifted to this common parent and handed down
  // to both siblings as props.
  const [celsius, setCelsius] = useState(INITIAL_CELSIUS);

  function resetBuggy() {
    setBuggyResetKey((k) => k + 1);
    setBuggyCelsiusMirror(INITIAL_CELSIUS);
    setBuggyFahrenheitMirror(INITIAL_FAHRENHEIT);
    setActiveId("reset-buggy");
  }

  function resetFixed() {
    setCelsius(INITIAL_CELSIUS);
    setActiveId("reset-fixed");
  }

  const buggyExpectedFahrenheit = celsiusToFahrenheit(buggyCelsiusMirror);
  const buggyInSync = Math.abs(buggyExpectedFahrenheit - buggyFahrenheitMirror) < 0.05;

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Lifting state up</h1>
        <p>
          Two sibling components that both need to reflect the same logical value can't stay in
          sync by each holding their own <code>useState</code> — the fix is to move that state up
          to their closest common parent and hand it back down as props.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">The problem</h3>
          <p>
            When two components need to show or edit the <em>same</em> logical value, giving each
            one its own <code>useState</code> creates two independent values that only happen to
            start out equal — nothing keeps them equal afterward.
          </p>

          <h3 className="theory-subhead">Lifting state up, in three steps</h3>
          <ul>
            <li>
              <strong>Remove</strong> the state from both child components.
            </li>
            <li>
              <strong>Pass</strong> the value down from their closest common parent as a prop.
            </li>
            <li>
              <strong>Add</strong> the state to that common parent, together with a callback prop
              each child calls to request a change.
            </li>
          </ul>

          <h3 className="theory-subhead">Single source of truth</h3>
          <p>
            The common parent becomes the <strong>one owner</strong> of the value — both children
            become <em>controlled</em>: they render whatever the parent tells them to, and ask the
            parent to change it instead of changing it themselves.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p className="demo-hint">
            Edit either field in a column, then check the banner under it. Both columns start in
            sync at 20°C / 68°F.
          </p>

          <div className="compare">
            <div className="compare-col buggy">
              <h3>
                Buggy — two <code>useState</code>s <span className="explain-outcome buggy">⚠</span>
              </h3>
              <BuggyCelsiusEditor
                key={`buggy-c-${buggyResetKey}`}
                onEdit={(next) => {
                  setBuggyCelsiusMirror(next);
                  setActiveId("buggy-celsius");
                }}
              />
              <BuggyFahrenheitEditor
                key={`buggy-f-${buggyResetKey}`}
                onEdit={(next) => {
                  setBuggyFahrenheitMirror(next);
                  setActiveId("buggy-fahrenheit");
                }}
              />
              <p className="sync-banner" data-state={buggyInSync ? "ok" : "warn"}>
                {buggyInSync
                  ? `✓ In sync — ${buggyCelsiusMirror}°C ≈ ${round1(buggyExpectedFahrenheit)}°F`
                  : `⚠ Out of sync — Celsius implies ${round1(buggyExpectedFahrenheit)}°F, but ` +
                    `Fahrenheit independently shows ${buggyFahrenheitMirror}°F`}
              </p>
              <button onClick={resetBuggy} data-active={activeId === "reset-buggy"}>
                Reset
              </button>
            </div>

            <div className="compare-col correct">
              <h3>
                Fixed — lifted state <span className="explain-outcome correct">✓</span>
              </h3>
              <FixedCelsiusEditor
                celsius={celsius}
                onChange={(next) => {
                  setCelsius(next);
                  setActiveId("fixed-celsius");
                }}
              />
              <FixedFahrenheitEditor
                celsius={celsius}
                onChange={(next) => {
                  setCelsius(next);
                  setActiveId("fixed-fahrenheit");
                }}
              />
              <p className="sync-banner" data-state="ok">
                ✓ Always in sync — both editors read from the same parent state
              </p>
              <button onClick={resetFixed} data-active={activeId === "reset-fixed"}>
                Reset
              </button>
            </div>
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
              Edit a field or click a Reset button above to see the exact code that ran and why it
              behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
