import { memo, useCallback, useRef, useState } from "react";

/**
 * Concept: React.memo basics
 *
 * Layout convention for every concept package (see hooks/use-state-basics
 * for the reference shape):
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last button pressed,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

interface ChildProps {
  label: string;
  onPing: () => void;
}

/**
 * React's rules say a render body must stay pure — don't read or write
 * `ref.current` while rendering (this repo's ESLint config enforces it via
 * `react-hooks/refs`) — because the compiler and concurrent features may
 * render a component more than once per commit. This hook is the one
 * deliberate, contained exception: a diagnostic self-count, in the spirit
 * of tools like "why-did-you-render," that only ever displays *itself*
 * back into the same component — nothing else reads it, and no logic
 * decision depends on it. That's what makes this the one place in this
 * whole repo you'll see the disable comment below; it's not a pattern to
 * reach for in ordinary component logic.
 *
 * Note: in development, <StrictMode> (see main.tsx) intentionally
 * double-invokes render functions on mount to help surface impure ones —
 * so each badge may start at "Renders: 2" instead of 1. Compare the
 * *increase* per click, not the absolute starting number.
 */
function useRenderCount(): number {
  const count = useRef(0);
  // eslint-disable-next-line react-hooks/refs -- diagnostic self-count only, see comment above
  return (count.current += 1);
}

/**
 * A plain function component — no React.memo. It has no way to opt out of
 * re-rendering, so it re-renders every time its parent does, regardless of
 * whether its own props changed.
 */
function PlainChild({ label, onPing }: ChildProps) {
  const renderCount = useRenderCount();

  return (
    <div className="child-body">
      <span className="render-badge">Renders: {renderCount}</span>
      <div className="child-card-footer">
        <p>{label}</p>
        <button onClick={onPing}>Ping</button>
      </div>
    </div>
  );
}

/**
 * The SAME React.memo-wrapped component is reused for both the "defeated"
 * and "working" demo slots below — what differs is only which onPing
 * reference App passes in. React.memo does a shallow equality check of the
 * previous vs. next props object; if every prop compares equal, React
 * reuses the previous render output and skips re-rendering this subtree
 * entirely.
 */
const MemoChild = memo(function MemoChild({ label, onPing }: ChildProps) {
  const renderCount = useRenderCount();

  return (
    <div className="child-body">
      <span className="render-badge">Renders: {renderCount}</span>
      <div className="child-card-footer">
        <p>{label}</p>
        <button onClick={onPing}>Ping</button>
      </div>
    </div>
  );
});

type ActionId = "tick" | "plain" | "defeated" | "working" | "reset";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual code below — they're display
// copies, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  tick: {
    label: "Tick",
    code: `function handleTick() {
  setTick((t) => t + 1);
}`,
    explanation:
      "Tick only changes App's own tick state — the label and onPing values passed to " +
      "every child below are unaffected. Watch the render badges: Plain and Defeated both " +
      "climb on every click; Working does not move.",
  },
  plain: {
    label: "Why: Plain?",
    code: `function PlainChild({ label, onPing }: ChildProps) {
  const renderCount = useRenderCount();
  // ...renders label and a Ping button
}

// no React.memo() wrapper at all`,
    explanation:
      "PlainChild is a normal function component with no React.memo wrapper, so it has no " +
      "mechanism to opt out of re-rendering. Every time App re-renders — for any reason — " +
      "React calls PlainChild's function again too, even though label and the meaning of " +
      "onPing never changed.",
  },
  defeated: {
    label: "Why: Defeated?",
    code: `const MemoChild = memo(function MemoChild({ label, onPing }: ChildProps) {
  /* identical body to PlainChild */
});

// In App's render:
<MemoChild label={label} onPing={() => setPings((p) => p + 1)} />`,
    explanation:
      "MemoChild is wrapped in React.memo, but App passes it a brand-new arrow function as " +
      "onPing every render. A function literal creates a new reference each time, so " +
      "React.memo's shallow prop comparison (prevProps.onPing === nextProps.onPing) fails " +
      "on every render, and it re-renders anyway. The memoization buys nothing here.",
    outcome: "buggy",
  },
  working: {
    label: "Why: Working?",
    code: `const stablePing = useCallback(() => setPings((p) => p + 1), []);

// Same MemoChild component as "Defeated":
<MemoChild label={label} onPing={stablePing} />`,
    explanation:
      "Same MemoChild component, same label string — but onPing is now wrapped in " +
      "useCallback with an empty dependency array, so it's the exact same function reference " +
      "on every render. React.memo's shallow comparison now sees identical props for both " +
      "label and onPing, so it bails out: MemoChild's render count stops climbing.",
    outcome: "correct",
  },
  reset: {
    label: "Reset",
    code: `function resetDemo() {
  setDemoKey((k) => k + 1); // new key -> React unmounts the old
  setTick(0);               // child instances and mounts fresh ones,
  setPings(0);               // so each render-count ref starts at 0 again.
}`,
    explanation:
      "Bumping the key on the children's wrapper tells React these are entirely new elements, " +
      "not updates to the previous ones, so it unmounts the old child instances (discarding " +
      "their render-count refs) and mounts brand new ones.",
  },
};

export function App() {
  const [tick, setTick] = useState(0);
  const [pings, setPings] = useState(0);
  const [demoKey, setDemoKey] = useState(0);
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  // Never reassigned — every child receives the exact same string reference
  // on every render. Only the *function* props differ between scenarios.
  const label = "Widget A";

  // Stabilized once (empty deps): the same function reference forever.
  const stablePing = useCallback(() => setPings((p) => p + 1), []);

  function run(id: ActionId) {
    setActiveId(id);
    switch (id) {
      case "tick":
        setTick((t) => t + 1);
        break;
      case "reset":
        setDemoKey((k) => k + 1);
        setTick(0);
        setPings(0);
        break;
      case "plain":
      case "defeated":
      case "working":
        // These are explanatory only — they just change which write-up is
        // shown below. (Note that pressing them still re-renders App via
        // setActiveId, which reproduces the same Plain/Defeated/Working
        // pattern all over again — any parent re-render triggers it.)
        break;
    }
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>React.memo basics</h1>
        <p>
          <code>React.memo</code> lets a function component skip re-rendering when its parent
          re-renders but its own props haven't meaningfully changed. "Meaningfully" is the catch —
          it's a <strong>shallow</strong> comparison, and a fresh object, array, or function prop is
          a new reference on every render, which quietly defeats it.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Wrapping a component</h3>
          <p>
            <code>memo</code> is a function <strong>built into React</strong> (imported from{" "}
            <code>"react"</code>) that wraps a component and memoizes its rendered output.
          </p>
          <pre>
            <code>{`const MemoChild = memo(function MemoChild(props) { ... });`}</code>
          </pre>
          <ul>
            <li>
              On re-render, React shallowly compares every prop in the previous props object against
              the next one (<code>Object.is</code> per key).
            </li>
            <li>
              If they're all equal (and <code>ref</code> is unchanged), React reuses the last render
              output and skips calling the component function at all — it bails out of that entire
              subtree.
            </li>
            <li>
              If even one prop differs by reference, the shallow check fails and the component
              re-renders normally.
            </li>
          </ul>

          <h3 className="theory-subhead">The stale-reference pitfall</h3>
          <ul>
            <li>
              An inline <code>{`() => ...`}</code> arrow function, <code>{`{ ... }`}</code> object
              literal, or <code>{`[...]`}</code> array literal written directly in JSX is a{" "}
              <strong>new reference every render</strong> — even if its contents look identical to
              last time.
            </li>
            <li>
              Passed as a prop to a memoized child, that new reference makes the shallow check fail
              every time, so <code>React.memo</code> never bails out — it costs a comparison for
              zero benefit.
            </li>
            <li>
              Fix it by stabilizing the reference in the parent: <code>useCallback</code> for
              functions, <code>useMemo</code> for objects/arrays (see{" "}
              <code>hooks/use-callback-basics</code> and <code>hooks/use-memo-basics</code>).
            </li>
          </ul>

          <h3 className="theory-subhead">What memo does NOT do</h3>
          <p>
            <code>React.memo</code> only gates re-renders caused by the <em>parent</em> re-rendering
            with shallowly-equal props. It can't stop a component from re-rendering because of its{" "}
            <strong>own</strong> local state or context update — that always proceeds regardless.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p className="demo-count">
            Tick: <strong>{tick}</strong> &nbsp;·&nbsp; Pings: <strong>{pings}</strong>
          </p>
          <p className="demo-note">
            Dev-only note: <code>&lt;StrictMode&gt;</code> double-invokes effects on mount, so each
            badge may start at "Renders: 2" instead of 1 — compare the increase per click, not the
            starting number.
          </p>
          <div className="demo-buttons">
            {(Object.keys(ACTIONS) as ActionId[]).map((id) => (
              <button key={id} onClick={() => run(id)} data-active={activeId === id}>
                {ACTIONS[id].label}
              </button>
            ))}
          </div>

          <div className="children-grid" key={demoKey}>
            <div className="child-card" data-variant="plain">
              <h3>1. Plain child</h3>
              <p>No React.memo — always re-renders with its parent.</p>
              <PlainChild label={label} onPing={() => setPings((p) => p + 1)} />
            </div>

            <div className="child-card" data-variant="defeated">
              <h3>2. Memoized, defeated</h3>
              <p>React.memo, but a fresh onPing function every render.</p>
              <MemoChild label={label} onPing={() => setPings((p) => p + 1)} />
            </div>

            <div className="child-card" data-variant="working">
              <h3>3. Memoized, working</h3>
              <p>React.memo + a useCallback-stabilized onPing.</p>
              <MemoChild label={label} onPing={stablePing} />
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
              Click "Tick" to force a parent re-render, or one of the "Why?" buttons to see the code
              and reasoning behind each child's behavior.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
