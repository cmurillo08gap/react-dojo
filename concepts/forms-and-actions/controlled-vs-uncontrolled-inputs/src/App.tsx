import { useEffect, useRef, useState, type ChangeEvent } from "react";

/**
 * Concept: Controlled vs. uncontrolled inputs
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo has three parts, scoped specifically to <input> (the general
 * component-design version of this idea lives in
 * patterns/controlled-vs-uncontrolled-components, not here):
 *
 *   - A CONTROLLED input: value + onChange, backed by useState. React
 *     owns the value — every keystroke round-trips through state and a
 *     re-render, which the render counter makes visible.
 *   - An UNCONTROLLED input: defaultValue + a ref. The DOM owns the
 *     value after the initial render; typing never touches React state,
 *     so the render counter never moves for this field. Reading it back
 *     requires reaching into the DOM node via the ref (done here on blur
 *     and via an explicit button, standing in for "on submit").
 *   - The SWITCHING TRAP: a single input whose `value` prop is flipped
 *     between a real string and `undefined` at runtime. React can't tell
 *     whether such an input should be controlled or uncontrolled, and
 *     logs a real console warning the moment it changes — this demo
 *     patches console.error just long enough to catch that exact message
 *     and print it inline, instead of just describing it in prose.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

type ActionId = "controlled-change" | "uncontrolled-read" | "trap-flip";

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
  "controlled-change": {
    label: "Controlled input",
    code: `const [name, setName] = useState("");

<input
  value={name}
  onChange={(e) => setName(e.target.value)}
/>`,
    explanation:
      "Every keystroke fires onChange, which calls setName and triggers a re-render — React " +
      "now owns the input's value, and the DOM only ever shows whatever state says. That's why " +
      "the render counter above ticks up on every character typed here.",
    outcome: "correct",
  },
  "uncontrolled-read": {
    label: "Read uncontrolled value",
    code: `const nameRef = useRef<HTMLInputElement>(null);

<input ref={nameRef} defaultValue="Ada" />

function handleRead() {
  setLastRead(nameRef.current?.value ?? "");
}`,
    explanation:
      'defaultValue only seeds the DOM node\'s initial value — after that render, the browser ' +
      "owns it. Typing here never calls a setter and never re-renders the component (watch the " +
      "render counter: it doesn't move). The only way to find out what's currently in the field " +
      "is to reach into the DOM node through the ref, which is exactly what this button just did.",
    outcome: "correct",
  },
  "trap-flip": {
    label: "Flip controlled ↔ uncontrolled",
    code: `<input
  value={mode === "controlled" ? trapText : undefined}
  onChange={mode === "controlled" ? handleTrapChange : undefined}
/>`,
    explanation:
      "react.dev is explicit: \"An input cannot switch between being controlled or uncontrolled " +
      'over its lifetime." Flipping value between a real string and undefined on the SAME ' +
      "element does exactly that, and React logs a real console warning the instant it happens " +
      "— captured below instead of only living in devtools.",
    outcome: "buggy",
  },
};

export function App() {
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  // --- Controlled input: React owns the value via useState. -------------
  const [name, setName] = useState("");
  // Counts re-renders this controlled input causes — incremented directly
  // in its own onChange, a plain event handler, not read/written during
  // render (that would trip react-hooks/refs) or inside an effect (that
  // would trip react-hooks/set-state-in-effect). The uncontrolled input
  // below has no onChange at all, so nothing increments this when you type
  // into it — that absence *is* the demonstration.
  const [controlledUpdateCount, setControlledUpdateCount] = useState(0);

  function handleControlledChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    setControlledUpdateCount((c) => c + 1);
    setActiveId("controlled-change");
  }

  // --- Uncontrolled input: the DOM owns the value; a ref reads it. ------
  const nameRef = useRef<HTMLInputElement>(null);
  const [lastRead, setLastRead] = useState<string | null>(null);

  function handleReadUncontrolled() {
    setLastRead(nameRef.current?.value ?? "");
    setActiveId("uncontrolled-read");
  }

  // --- The switching trap: flip the SAME input between having a real ---
  // string `value` and `value={undefined}`. React can't tell whether an
  // input like this should be controlled or uncontrolled, and warns the
  // moment the prop changes shape.
  const [mode, setMode] = useState<"controlled" | "uncontrolled">("controlled");
  const [trapText, setTrapText] = useState("careful...");
  const [capturedWarning, setCapturedWarning] = useState<string | null>(null);

  function handleTrapChange(e: ChangeEvent<HTMLInputElement>) {
    setTrapText(e.target.value);
  }

  function flipMode() {
    setCapturedWarning(null);
    setMode((m) => (m === "controlled" ? "uncontrolled" : "controlled"));
    setActiveId("trap-flip");
  }

  // Patch console.error for the lifetime of this page so the real React
  // warning about switching an input between controlled/uncontrolled
  // shows up inline in the demo, not just in the devtools console. Only
  // messages mentioning "controlled" are captured; everything else still
  // passes through to the real console untouched.
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const message = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
      if (message.toLowerCase().includes("controlled")) {
        setCapturedWarning(message);
      }
      originalError(...args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Controlled vs. uncontrolled inputs</h1>
        <p>
          An <code>&lt;input&gt;</code> is <strong>uncontrolled</strong> by default — the DOM node
          keeps its own value, and React only ever reads it if you ask (via a ref). Passing a{" "}
          <code>value</code> prop makes it <strong>controlled</strong> — React now dictates what's
          on screen, and every controlled input needs an <code>onChange</code> that keeps state in
          sync. React refuses to let one input be both, or switch between the two, over its
          lifetime.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Controlled: value + onChange</h3>
          <pre>
            <code>{`<input
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
/>`}</code>
          </pre>
          <ul>
            <li>
              Passing a string <code>value</code> forces the input to always show exactly what
              state says — React "force[s] the input's value to match the state variable," per
              react.dev.
            </li>
            <li>
              Every controlled input needs an <code>onChange</code> handler that synchronously
              updates that state. Without one, the field renders but can't be typed into — react.dev
              flags <code>{`<input value={something} />`}</code> with no <code>onChange</code> as a
              bug (read-only field, console error).
            </li>
            <li>
              A controlled <code>value</code> should always be a string, never <code>null</code> or{" "}
              <code>undefined</code> — coerce with <code>{`value={someValue ?? ""}`}</code> if it
              might come from an API before it's loaded.
            </li>
          </ul>

          <h3 className="theory-subhead">Uncontrolled: defaultValue + a ref</h3>
          <pre>
            <code>{`const inputRef = useRef<HTMLInputElement>(null);

<input ref={inputRef} defaultValue="Initial text" />`}</code>
          </pre>
          <ul>
            <li>
              <code>defaultValue</code> only sets the value for the <em>first</em> render — "it does
              not control what the value should be right now," per react.dev. After that, the
              browser DOM owns it.
            </li>
            <li>
              To read the current value, attach a ref and reach into the DOM node (
              <code>inputRef.current.value</code>) — the same ref mechanism react.dev uses for
              imperative DOM access like <code>inputRef.current.focus()</code>.
            </li>
            <li>
              Typing doesn't call any React state setter, so it never triggers a re-render of the
              owning component — cheaper for large forms, at the cost of not being able to react to
              every keystroke (live validation, formatting, disabling a button, mirroring the value
              elsewhere).
            </li>
          </ul>

          <h3 className="theory-subhead">You can't switch, and can't be both</h3>
          <p>react.dev's caveats for &lt;input&gt; are direct on this:</p>
          <ul>
            <li>
              "An input can't be both controlled and uncontrolled at the same time."
            </li>
            <li>
              "An input cannot switch between being controlled or uncontrolled over its lifetime."
            </li>
            <li>
              If a text input receives a string <code>value</code> prop at all, it's treated as
              controlled — full stop, regardless of whether an <code>onChange</code> is present.
            </li>
          </ul>
          <p>
            Violate this and React logs "A component is changing an uncontrolled input to be
            controlled" (or the mirror-image "...controlled input to be uncontrolled") the instant
            the <code>value</code> prop flips between a real string and <code>undefined</code>. The
            demo's third input reproduces this warning for real — see below.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p className="demo-count">
            Controlled input re-renders: <strong>{controlledUpdateCount}</strong>
          </p>
          <p className="explain-placeholder" style={{ marginTop: "-0.5rem" }}>
            (Ticks up on every character typed into input 1 below — its <code>onChange</code>{" "}
            fires a <code>setState</code> call every keystroke. Typing into input 2 never touches
            this counter: it has no <code>onChange</code> at all.)
          </p>

          <h3 className="theory-subhead">1. Controlled</h3>
          <input
            value={name}
            onChange={handleControlledChange}
            placeholder="Type here — React owns this"
            aria-label="Controlled input"
          />
          <p className="demo-count">
            React state (<code>name</code>): <strong>{name === "" ? "(empty)" : `"${name}"`}</strong>
          </p>

          <h3 className="theory-subhead">2. Uncontrolled</h3>
          <input
            ref={nameRef}
            defaultValue="Ada"
            onBlur={handleReadUncontrolled}
            placeholder="Type here — the DOM owns this"
            aria-label="Uncontrolled input"
          />
          <div className="demo-buttons" style={{ marginTop: "0.5rem" }}>
            <button type="button" onClick={handleReadUncontrolled}>
              Read value (stand-in for submit)
            </button>
          </div>
          <p className="demo-count">
            Last value read via ref:{" "}
            <strong>{lastRead === null ? "(not read yet)" : `"${lastRead}"`}</strong>{" "}
            <span className="explain-placeholder">(also reads on blur — click away from the field)</span>
          </p>

          <h3 className="theory-subhead">3. The switching trap</h3>
          <input
            value={mode === "controlled" ? trapText : undefined}
            onChange={mode === "controlled" ? handleTrapChange : undefined}
            placeholder="Danger zone"
            aria-label="Controlled/uncontrolled switching trap input"
          />
          <div className="demo-buttons" style={{ marginTop: "0.5rem" }}>
            <button type="button" onClick={flipMode}>
              Flip to {mode === "controlled" ? "uncontrolled (value={undefined})" : "controlled (value=string)"}
            </button>
          </div>
          <p className="demo-count">
            Currently: <strong>{mode}</strong>
          </p>
          {capturedWarning && (
            <p className="explain-outcome buggy" role="alert">
              ⚠ console.error caught: {capturedWarning}
            </p>
          )}
          {!capturedWarning && (
            <p className="explain-placeholder">
              Click "Flip to..." above — React logs a real warning the moment this input's{" "}
              <code>value</code> prop changes between a string and <code>undefined</code>, captured
              here instead of only in devtools.
            </p>
          )}
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
              Type in an input or click a button above to see the exact code that ran and why it
              behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
