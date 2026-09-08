import { useState } from "react";

/**
 * Concept: JSX & components
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

// ✅ Defined once, at module scope — this function object's identity never
// changes across App's re-renders. React matches it against the same
// element `type` every time, so the instance (and its local state) is
// preserved.
function StableCounter({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return (
    <div className="mini-counter" data-flavor="stable">
      <p className="mini-label">{label}</p>
      <p className="mini-count">{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}

// Keep this snippet in sync with the actual handler below — it's a
// display copy, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const RERENDER_CODE = `const [parentTicks, setParentTicks] = useState(0);
// ...
<button onClick={() => setParentTicks((t) => t + 1)}>Re-render App</button>`;

export function App() {
  const [parentTicks, setParentTicks] = useState(0);
  const [hasRerendered, setHasRerendered] = useState(false);

  // 🐛 Defined INSIDE App's function body — a brand-new function object is
  // created every time App re-renders. React sees a different `type` on
  // the element it returns for this slot, treats it as a different
  // component, and unmounts the old instance (throwing away its state)
  // before mounting a fresh one.
  //
  // Its own +1 button deliberately touches only its own local state —
  // never App's. A child's state update only re-renders that child, not
  // its parent, so clicking +1 here never redefines this function and
  // never triggers the bug by itself. Only something that makes App
  // re-render for an unrelated reason (the "Re-render App" button below)
  // does that.
  function UnstableCounter({ label }: { label: string }) {
    const [count, setCount] = useState(0);
    return (
      <div className="mini-counter" data-flavor="unstable">
        <p className="mini-label">{label}</p>
        <p className="mini-count">{count}</p>
        <button onClick={() => setCount((c) => c + 1)}>+1</button>
      </div>
    );
  }

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>JSX & components</h1>
        <p>
          JSX is sugar for plain function calls that build a description of the UI — it isn't HTML,
          and a component is nothing more than a function that returns one of those descriptions.
          Where you <em>define</em> that function matters as much as what it returns.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">JSX compiles to function calls</h3>
          <p>
            <code>{'<Greeting name="Ada" />'}</code> compiles (via the automatic JSX runtime) to
            roughly:
          </p>
          <pre>
            <code>{`jsx(Greeting, { name: "Ada" })`}</code>
          </pre>
          <ul>
            <li>
              There's no special "JSX object" at runtime — it's a plain JS object describing{" "}
              <em>what</em> to render, built by an ordinary function call.
            </li>
            <li>
              A <strong>lowercase</strong> tag (<code>{"<div>"}</code>) compiles to a{" "}
              <em>string</em> — a host/DOM element name.
            </li>
            <li>
              A <strong>capitalized</strong> tag (<code>{"<Greeting>"}</code>) compiles to a{" "}
              <em>reference</em> to the variable <code>Greeting</code> in scope — which is why
              components are named PascalCase by convention, not just style.
            </li>
          </ul>

          <h3 className="theory-subhead">Component identity across renders</h3>
          <ul>
            <li>
              React decides whether to reuse or remount a component instance by comparing the{" "}
              <code>type</code> of the element at that position in the tree — for a component,{" "}
              <code>type</code> is the function itself.
            </li>
            <li>
              Define components at <strong>module scope</strong> (or as a stable reference via a
              hook), never inside another component's function body — a nested definition gets
              re-created, with a new identity, on every parent render.
            </li>
            <li>
              A "different type at the same position" is treated as a full unmount + remount, which
              throws away that subtree's local state and re-runs its effects.
            </li>
            <li>
              A child's own state update only re-renders <em>that child</em>, never its parent —
              so clicking a counter's own <code>+1</code> can't trigger this bug by itself. It
              takes something else re-rendering the parent (an unrelated state change, a new
              prop) to redefine — and reset — a nested component.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="mini-counter-row">
            <StableCounter label="Stable (module scope)" />
            {/* eslint-disable-next-line react-hooks/static-components -- intentional: this
                is the exact anti-pattern this concept demonstrates. See UnstableCounter above. */}
            <UnstableCounter label="Unstable (defined inside App)" />
          </div>
          <div className="demo-buttons">
            <button
              onClick={() => {
                setParentTicks((t) => t + 1);
                setHasRerendered(true);
              }}
              data-active={hasRerendered}
            >
              Re-render App ({parentTicks})
            </button>
          </div>
          <p className="demo-hint">
            Bump each counter's own +1 a few times first — neither button touches App's state, so
            neither will trigger the bug yet. Then click "Re-render App" and watch what happens to
            each count.
          </p>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {hasRerendered ? (
            <div className="explain-body">
              <p>
                <span className="explain-outcome buggy">⚠ Buggy: </span>
                App re-rendered, which redefines UnstableCounter as a NEW function object. React
                sees a different element "type" where UnstableCounter used to be, so it unmounts
                the old instance (losing its count) and mounts a fresh one at 0. StableCounter's
                identity never changed, so its count survived untouched.
              </p>
              <pre>
                <code>{RERENDER_CODE}</code>
              </pre>
            </div>
          ) : (
            <p className="explain-placeholder">
              Bump each counter's own +1 above, then click "Re-render App" to see the exact code
              that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
