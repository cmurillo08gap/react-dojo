import { useRef, useState } from "react";

/**
 * Concept: useRef basics
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

type ActionId = "ref" | "state" | "rerender" | "reset" | "focus";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "hidden" | "visible" | "revealed" | "imperative";
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  ref: {
    label: "+1 (ref)",
    code: `function incrementRef() {
  // Mutates the ref object directly. React is never told this happened,
  // so no re-render is scheduled — the number on screen doesn't move.
  refCount.current += 1;
}`,
    explanation:
      "refCount.current just went up, but nothing re-rendered, so the number shown for the " +
      "ref counter is still whatever it was at the last render — not what it truly holds now.",
    outcome: "hidden",
  },
  state: {
    label: "+1 (state)",
    code: `function incrementState() {
  setStateCount((c) => c + 1);
}`,
    explanation:
      "setStateCount schedules a re-render, so React calls the component again right away and " +
      "the new value shows up immediately.",
    outcome: "visible",
  },
  rerender: {
    label: "Reveal ref value",
    code: `function revealRefValue() {
  // Reading ref.current directly during render is unsafe in React (it can
  // tear under concurrent rendering), so the *only* safe way to display a
  // ref's value is to copy it into state from inside an event handler —
  // never from the render body itself. This handler does exactly that,
  // then separately bumps unrelated state to prove the copy, not the
  // mutation, is what causes the number to update.
  setRevealedRefCount(refCount.current);
  setRenderNonce((n) => n + 1);
}`,
    explanation:
      "refCount.current itself didn't change because of this click — the click just read its " +
      "current value (safe here, inside an event handler) and copied it into state, which is " +
      "the only way a ref's value may safely reach the screen.",
    outcome: "revealed",
  },
  reset: {
    label: "Reset both",
    code: `function resetBoth() {
  refCount.current = 0;
  setStateCount(0);
  setRevealedRefCount(0);
}`,
    explanation:
      "Resetting the ref's .current is a silent mutation — it won't show on screen until " +
      "something explicitly copies it into state again. Resetting state schedules a " +
      "re-render right away, same asymmetry as incrementing.",
  },
  focus: {
    label: "Focus input",
    code: `function focusInput() {
  inputRef.current?.focus();
  inputRef.current?.select();
}`,
    explanation:
      "This reaches straight into the DOM node the ref points at and calls its imperative " +
      "focus()/select() methods — no state, no re-render, just direct DOM control.",
    outcome: "imperative",
  },
};

export function App() {
  const refCount = useRef(0);
  const [stateCount, setStateCount] = useState(0);
  // The ref's value as last explicitly copied into state — never read
  // directly from refCount.current during render (see the "rerender"
  // action and the Theory panel's "When to reach for it" rule).
  const [revealedRefCount, setRevealedRefCount] = useState(0);
  const [renderNonce, setRenderNonce] = useState(0);
  const [activeId, setActiveId] = useState<ActionId | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function run(id: ActionId) {
    setActiveId(id);
    switch (id) {
      case "ref":
        // Intentional: mutating .current alone never schedules a re-render.
        refCount.current += 1;
        break;
      case "state":
        setStateCount((c) => c + 1);
        break;
      case "rerender":
        // Safe: reading refCount.current here happens in an event handler,
        // not during render.
        setRevealedRefCount(refCount.current);
        setRenderNonce((n) => n + 1);
        break;
      case "reset":
        refCount.current = 0;
        setStateCount(0);
        setRevealedRefCount(0);
        break;
      case "focus":
        inputRef.current?.focus();
        inputRef.current?.select();
        break;
    }
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useRef basics</h1>
        <p>
          <code>useRef</code> gives you a mutable box — <code>{"{ current: ... }"}</code> — that
          survives re-renders but never causes one on its own. That makes it the right tool for
          values the UI doesn't need to reflect, and for reaching into the DOM directly.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">A mutable box that outlives renders</h3>
          <pre>
            <code>
              {"const ref = useRef(initialValue);\n// ref.current === initialValue on first render"}
            </code>
          </pre>
          <ul>
            <li>
              <code>useRef(initialValue)</code> returns an object with a single <code>current</code>{" "}
              property, initialized to <code>initialValue</code>. That object persists for the full
              lifetime of the component instance.
            </li>
            <li>
              Reading or writing <code>ref.current</code> is a plain JavaScript mutation — React is
              never notified, so it never schedules a re-render because of it.
            </li>
            <li>
              The ref object itself has a <strong>stable identity</strong> across renders, same as a{" "}
              <code>useState</code> setter — safe to omit from a dependency array.
            </li>
          </ul>

          <h3 className="theory-subhead">When to reach for it</h3>
          <ul>
            <li>
              Storing a value that must survive re-renders but shouldn't drive what's on screen — a
              timer id, a previous value, a mutable flag read inside an event handler.
            </li>
            <li>
              Holding a reference to a DOM node so you can call its imperative API directly (
              <code>.focus()</code>, <code>.scrollIntoView()</code>, measuring size).
            </li>
            <li>
              Don't mutate a ref that's read <em>during render</em> for anything visual — if a value
              should show up on screen, it belongs in <code>useState</code> instead.
            </li>
          </ul>

          <h3 className="theory-subhead">DOM refs in React 19</h3>
          <p>
            Pass a ref straight through as a normal prop — <code>ref</code> is a standard prop now,
            so a function component can accept it directly, no <code>forwardRef</code> needed:
          </p>
          <pre>
            <code>{"function MyInput({ ref }) {\n  return <input ref={ref} />;\n}"}</code>
          </pre>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>

          <h3 className="demo-subhead">1. Ref counter vs. state counter</h3>
          <div className="mini-counter-row">
            <div className="mini-counter" data-flavor="ref">
              <p className="mini-label">useRef (last revealed)</p>
              <p className="mini-count">{revealedRefCount}</p>
            </div>
            <div className="mini-counter" data-flavor="state">
              <p className="mini-label">useState</p>
              <p className="mini-count">{stateCount}</p>
            </div>
          </div>
          <div className="demo-buttons">
            <button onClick={() => run("ref")} data-active={activeId === "ref"}>
              {ACTIONS.ref.label}
            </button>
            <button onClick={() => run("state")} data-active={activeId === "state"}>
              {ACTIONS.state.label}
            </button>
            <button onClick={() => run("rerender")} data-active={activeId === "rerender"}>
              {ACTIONS.rerender.label}
            </button>
            <button onClick={() => run("reset")} data-active={activeId === "reset"}>
              {ACTIONS.reset.label}
            </button>
          </div>
          <p className="demo-hint">
            Click <strong>+1 (ref)</strong> a few times — the number above won't budge, because it
            only shows the ref's <em>last revealed</em> value, not a live read of it. Then click{" "}
            <strong>{ACTIONS.rerender.label}</strong> to safely copy the ref's true current value
            into state so it can finally be displayed. (Revealed so far:{" "}
            <strong>{renderNonce}</strong> time{renderNonce === 1 ? "" : "s"}.)
          </p>

          <h3 className="demo-subhead">2. A real DOM ref</h3>
          <div className="dom-ref-row">
            <input ref={inputRef} type="text" defaultValue="Click the button to focus me" />
            <button onClick={() => run("focus")} data-active={activeId === "focus"}>
              {ACTIONS.focus.label}
            </button>
          </div>
          <p className="demo-hint">
            No state involved here — the button reaches into the DOM node <code>inputRef</code>{" "}
            points at and calls <code>.focus()</code>/<code>.select()</code> on it directly.
          </p>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                {active.outcome && (
                  <span className={`explain-outcome ${active.outcome}`}>
                    {active.outcome === "hidden" && "Hidden: "}
                    {active.outcome === "visible" && "Visible: "}
                    {active.outcome === "revealed" && "Revealed: "}
                    {active.outcome === "imperative" && "Imperative: "}
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
