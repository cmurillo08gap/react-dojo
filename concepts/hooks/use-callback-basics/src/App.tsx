import { memo, useCallback, useState } from "react";

/**
 * Concept: useCallback basics
 *
 * Layout convention for every concept package — see ./README.md and
 * hooks/use-state-basics/src/App.tsx for the reference shape:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last button pressed,
 *      showing the exact code that ran plus why it behaved that way.
 */

type Variant = "naive" | "stabilized";
type ActionId = "increment" | "rerender" | "toggle" | "reset";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const NAIVE_CALLBACK_CODE = `// NAIVE: a brand-new function object every render.
function Parent() {
  const incrementCounter = () => {
    setCounter((c) => c + 1);
  };

  // MemoizedChild sees a "new" onIncrement prop on every
  // parent render, whether or not counter actually changed.
  return <MemoizedChild onIncrement={incrementCounter} />;
}`;

const STABILIZED_CALLBACK_CODE = `// STABILIZED: useCallback keeps the same function identity
// across renders as long as the dependency array is unchanged.
function Parent() {
  const incrementCounter = useCallback(() => {
    setCounter((c) => c + 1);
  }, []); // no deps needed — the updater form reads the latest count itself

  // MemoizedChild receives the exact same onIncrement reference every
  // render, so its React.memo shallow-props check can bail out.
  return <MemoizedChild onIncrement={incrementCounter} />;
}`;

const ACTION_LABELS: Record<ActionId, string> = {
  increment: "Increment counter (child button)",
  rerender: "Re-render parent (unrelated state)",
  toggle: "Switch variant",
  reset: "Reset demo",
};

function buildActionInfo(id: ActionId, variant: Variant): ActionInfo {
  const callbackCode = variant === "naive" ? NAIVE_CALLBACK_CODE : STABILIZED_CALLBACK_CODE;

  switch (id) {
    case "increment":
      return {
        label: ACTION_LABELS.increment,
        code: callbackCode,
        explanation:
          variant === "naive"
            ? "Clicking the child's own button called onIncrement, which changed `counter` in " +
              "the parent — so the parent re-rendered. Because this is the naive variant, that " +
              "re-render recreated incrementCounter as a brand-new function. React.memo's " +
              "shallow comparison sees a changed onIncrement prop, so MemoizedChild re-renders " +
              "too — its render count went up."
            : "Clicking the child's own button called onIncrement, which changed `counter` in " +
              "the parent — so the parent re-rendered. But incrementCounter is wrapped in " +
              "useCallback with an empty dependency array, so it's the exact same function " +
              "reference as last render. React.memo's shallow comparison sees an unchanged " +
              "onIncrement prop and bails out — MemoizedChild's render count does NOT go up, " +
              "even though its own callback is what triggered the update.",
        outcome: variant === "naive" ? "buggy" : "correct",
      };
    case "rerender":
      return {
        label: ACTION_LABELS.rerender,
        code: callbackCode,
        explanation:
          variant === "naive"
            ? '"Re-render parent" only changes `unrelatedTick`, a piece of state MemoizedChild ' +
              "never sees. But the parent re-rendering still redefines incrementCounter as a " +
              'fresh arrow function (naive variant), so the child receives a "new" onIncrement ' +
              "prop, fails React.memo's shallow comparison, and re-renders for no functional " +
              "reason at all."
            : '"Re-render parent" only changes `unrelatedTick`. The parent re-renders, but the ' +
              "stabilized incrementCounter (from useCallback) keeps the same reference, so " +
              "MemoizedChild's props are shallow-equal to last render. React.memo bails out and " +
              "skips rendering the child entirely — its render count stays put.",
        outcome: variant === "naive" ? "buggy" : "correct",
      };
    case "toggle":
      return {
        label: ACTION_LABELS.toggle,
        code: callbackCode,
        explanation:
          `Now using the "${variant}" variant. Switching variants swaps which function is ` +
          "passed as onIncrement, so it necessarily re-renders the child once (a genuinely " +
          'different function). Try "Re-render parent" or the child\'s own button next to see ' +
          "how this variant behaves from here.",
      };
    case "reset":
      return {
        label: ACTION_LABELS.reset,
        code:
          "setCounter(0);\n" +
          "setUnrelatedTick(0);\n" +
          'setVariant("naive");\n' +
          "// changing MemoizedChild's `key` remounts it, resetting its\n" +
          "// own render-count ref back to 0\n" +
          "setChildKey((k) => k + 1);",
        explanation:
          "Resets both counters, switches back to the naive variant, and remounts " +
          "MemoizedChild (via a changed key) so its render count starts fresh at 0.",
      };
  }
}

interface MemoizedChildProps {
  onIncrement: () => void;
}

// Wrapped in React.memo: React skips re-rendering this component whenever
// its props are shallow-equal to last render's props — but only if nothing
// else forces an update (e.g. its own local state or context).
const MemoizedChild = memo(function MemoizedChild({ onIncrement }: MemoizedChildProps) {
  // Counting "did this component's function body actually run again?"
  // without touching a ref during render (reading/writing ref.current in
  // the render body is unsafe — see hooks/use-ref-basics). Instead this
  // uses React's own sanctioned "adjust state while rendering" idiom: a
  // plain state comparison, guarded by a condition so it can only ever run
  // once per actual change, immediately re-rendering with the corrected
  // state before anything commits to the screen. Since onIncrement is this
  // component's only prop, "the prop identity changed" and "this function
  // body ran again" are the same fact here — and because React.memo bails
  // out *before* calling this function at all when props are shallow-equal,
  // this comparison simply never runs on a bailed-out render, so the count
  // stays put. It's also idempotent under <StrictMode>'s dev-only double
  // render: the second invocation sees the already-updated comparison
  // state and skips re-incrementing.
  const [renderCount, setRenderCount] = useState(1);
  const [prevOnIncrement, setPrevOnIncrement] = useState(() => onIncrement);
  if (onIncrement !== prevOnIncrement) {
    setPrevOnIncrement(onIncrement);
    setRenderCount((c) => c + 1);
  }

  return (
    <div className="child-box">
      <p className="mini-label">MemoizedChild render count</p>
      <p className="mini-count">{renderCount}</p>
      <button onClick={onIncrement}>Increment counter (from inside child)</button>
    </div>
  );
});
MemoizedChild.displayName = "MemoizedChild";

export function App() {
  const [variant, setVariant] = useState<Variant>("naive");
  const [counter, setCounter] = useState(0);
  const [unrelatedTick, setUnrelatedTick] = useState(0);
  const [childKey, setChildKey] = useState(0);
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  // Naive: a fresh closure every render — always a new function identity.
  const naiveIncrementCounter = () => {
    setCounter((c) => c + 1);
    setActiveId("increment");
  };

  // Stabilized: useCallback returns the SAME function reference across
  // renders as long as its dependency array (here, empty) doesn't change.
  // setCounter/setActiveId are setter functions with a stable identity, so
  // omitting them from the array is safe.
  const stabilizedIncrementCounter = useCallback(() => {
    setCounter((c) => c + 1);
    setActiveId("increment");
  }, []);

  const onIncrement = variant === "naive" ? naiveIncrementCounter : stabilizedIncrementCounter;

  function handleRerenderParent() {
    // Unrelated to `counter` and never passed to MemoizedChild — this
    // exists purely to force the parent to re-render.
    setUnrelatedTick((t) => t + 1);
    setActiveId("rerender");
  }

  function handleSelectVariant(next: Variant) {
    setVariant(next);
    setActiveId("toggle");
  }

  function handleReset() {
    setCounter(0);
    setUnrelatedTick(0);
    setVariant("naive");
    setChildKey((k) => k + 1);
    setActiveId("reset");
  }

  const active = activeId ? buildActionInfo(activeId, variant) : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useCallback basics</h1>
        <p>
          Every render creates a brand-new function object for any inline arrow function — even one
          with identical code. <code>useCallback</code> hands back the{" "}
          <strong>same function reference</strong> across renders, which is what lets a{" "}
          <code>React.memo</code>-wrapped child's shallow prop comparison actually bail out.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Function identity</h3>
          <p>
            In JavaScript, <code>() =&gt; {"{}"}</code> written twice produces two different
            function objects. A component's inline arrow function is re-created on every render, so{" "}
            <code>oldFn === newFn</code> is <code>false</code> even when the source code never
            changed.
          </p>
          <pre>
            <code>const stable = useCallback(fn, deps);</code>
          </pre>
          <ul>
            <li>
              <code>useCallback</code> re-runs and returns a <em>new</em> function only when a value
              in <code>deps</code> changes (compared with <code>Object.is</code>, position by
              position).
            </li>
            <li>
              With an empty array (<code>[]</code>), the comparison always succeeds after the first
              render, so the same function reference is returned forever.
            </li>
            <li>
              <code>useCallback(fn, deps)</code> is shorthand for{" "}
              <code>useMemo(() =&gt; fn, deps)</code> — it memoizes the function itself, not its
              return value.
            </li>
          </ul>

          <h3 className="theory-subhead">React.memo's bail-out</h3>
          <ul>
            <li>
              <code>memo(Component)</code> shallow-compares each new prop against the previous
              render's prop with <code>Object.is</code>. If every prop matches, React skips
              re-rendering that component (and its subtree) entirely.
            </li>
            <li>
              A stable prop still doesn't save you if the child re-renders for another reason — its
              own state changing, or a context it reads changing — so <code>useCallback</code> only
              pays off paired with a memoized consumer that otherwise re-renders on unrelated parent
              updates.
            </li>
            <li>
              This repo's Vite setup (<code>@vitejs/plugin-react</code>, no React Compiler plugin)
              does the classic Babel JSX transform only — it does not auto-memoize anything. Where
              the React Compiler is enabled, its stated goal is to remove the need for manual{" "}
              <code>useMemo</code>/<code>useCallback</code>/<code>React.memo</code> by inferring
              this memoization automatically; without it (as here), pairing them by hand is still on
              you.
            </li>
            <li>
              Manual memoization has a real cost (tracking the dependency array every render) —
              reach for it because a memoized child is measurably re-rendering too often, not
              speculatively on every callback prop.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>

          <p className="demo-label">Variant</p>
          <div className="demo-buttons variant-toggle">
            <button onClick={() => handleSelectVariant("naive")} data-active={variant === "naive"}>
              Naive (inline function)
            </button>
            <button
              onClick={() => handleSelectVariant("stabilized")}
              data-active={variant === "stabilized"}
            >
              Stabilized (useCallback)
            </button>
          </div>

          <p className="demo-count parent-counter">
            Counter (what onIncrement updates): <strong>{counter}</strong>
            <br />
            Unrelated parent tick (MemoizedChild never sees this): <strong>{unrelatedTick}</strong>
          </p>

          <div className="child-box-wrap" data-variant={variant}>
            <MemoizedChild key={childKey} onIncrement={onIncrement} />
          </div>
          <p className="child-hint">
            The render count only goes up when <code>MemoizedChild</code>'s function body actually
            runs — <code>React.memo</code> skips calling it at all when props are shallow-equal to
            last render's.
          </p>

          <div className="demo-buttons">
            <button onClick={handleRerenderParent} data-active={activeId === "rerender"}>
              {ACTION_LABELS.rerender}
            </button>
            <button onClick={handleReset} data-active={activeId === "reset"}>
              {ACTION_LABELS.reset}
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
              Click a button above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
