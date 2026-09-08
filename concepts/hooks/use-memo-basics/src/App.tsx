import { useMemo, useState } from "react";

/**
 * Concept: useMemo basics
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

type NPresetId = "n-small" | "n-medium" | "n-large";
type ActionId = NPresetId | "unrelated";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome: "recomputes" | "bails-out";
}

const N_PRESETS: Record<NPresetId, number> = {
  "n-small": 20_000,
  "n-medium": 80_000,
  "n-large": 160_000,
};

interface PrimeResult {
  count: number;
  checks: number;
}

// Deliberately slow, pure function: counts primes below `limit` by trial
// division. Cost grows with `limit`, which makes it a believable stand-in
// for a real expensive derived value (filtering/sorting/formatting a big
// dataset) without pulling in any real dataset.
//
// Returns the number of division checks it performed alongside the prime
// count — a deterministic, pure stand-in for "how much work did this cost"
// that doesn't need a wall-clock timer. Timing a computation with
// `performance.now()`/`Date.now()` *inside* a component's render (or a
// `useMemo` factory, which also runs during render) calls an impure
// function while React is rendering — exactly what the theory panel's
// "must still behave the same" rule warns against. For real wall-clock
// timing, reach for React DevTools' Profiler tab or the browser's
// Performance panel instead of instrumenting render itself.
function countPrimesBelow(limit: number): PrimeResult {
  let count = 0;
  let checks = 0;
  for (let i = 2; i < limit; i++) {
    let isPrime = true;
    for (let divisor = 2; divisor * divisor <= i; divisor++) {
      checks++;
      if (i % divisor === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) count++;
  }
  return { count, checks };
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  "n-small": {
    label: "N = 20,000",
    code: `setN(20_000);`,
    explanation:
      "n changed — the one case where recomputing is actually correct. Both the naive call " +
      "and the memoized useMemo(..., [n]) recompute, because the dependency itself moved.",
    outcome: "recomputes",
  },
  "n-medium": {
    label: "N = 80,000",
    code: `setN(80_000);`,
    explanation:
      'n changed again — same story, just a slower N. Watch the "division checks" count ' +
      "climb on both variants below.",
    outcome: "recomputes",
  },
  "n-large": {
    label: "N = 160,000",
    code: `setN(160_000);`,
    explanation:
      'A bigger n means many more trial divisions — the "division checks" count below jumps ' +
      "sharply on both variants, and you may even feel a brief pause while it runs. This cost " +
      "is exactly what useMemo exists to avoid paying unnecessarily.",
    outcome: "recomputes",
  },
  unrelated: {
    label: "Re-render (unrelated state)",
    code: `function handleUnrelatedClick() {
  setUnrelatedCount((c) => c + 1);
}

// naive: called directly in the render body — runs on *every* render,
// no matter what triggered it.
const naiveResult = countPrimesBelow(n);

// memoized: n hasn't changed, so useMemo's dependency array is still
// equal (element-wise Object.is) to last render's — the cached value is
// returned and the factory function never runs.
const memoized = useMemo(() => countPrimesBelow(n), [n]);`,
    explanation:
      "This click has nothing to do with n. The naive variant reruns the slow prime count " +
      "anyway, because its call sits directly in the render body — every render calls it, " +
      "unconditionally. The memoized variant's dependency array is unchanged, so useMemo " +
      "bails out and hands back the cached value instead of recomputing.",
    outcome: "bails-out",
  },
};

export function App() {
  const [n, setN] = useState(20_000);
  const [unrelatedCount, setUnrelatedCount] = useState(0);
  const [lastActionId, setLastActionId] = useState<ActionId | null>(null);
  // These two counters are updated only inside the event handlers below —
  // never during render — precisely because they mirror a fact we already
  // know for certain from how the code is written: the naive call runs on
  // literally every render, and the memoized call only re-runs when `n`
  // (its only dependency) changes.
  const [naiveRuns, setNaiveRuns] = useState(1); // the initial render already ran it once
  const [memoRuns, setMemoRuns] = useState(1); // useMemo's factory always runs on mount too

  // Naive: called directly in the render body. Runs unconditionally on
  // every render, whatever triggered it — including the "unrelated" button.
  const naiveResult = countPrimesBelow(n);

  // Memoized: React only re-invokes this factory when a value in the
  // dependency array changed (compared with Object.is) since the last
  // render — otherwise it hands back the previously cached result without
  // running the factory at all.
  const memoized = useMemo(() => countPrimesBelow(n), [n]);

  function changeN(id: NPresetId) {
    setN(N_PRESETS[id]);
    setLastActionId(id);
    setNaiveRuns((c) => c + 1);
    setMemoRuns((c) => c + 1);
  }

  function handleUnrelatedClick() {
    setUnrelatedCount((c) => c + 1);
    setLastActionId("unrelated");
    setNaiveRuns((c) => c + 1);
    // memoRuns intentionally NOT incremented — n hasn't changed, so
    // useMemo bails out instead of re-running its factory.
  }

  const active = lastActionId ? ACTIONS[lastActionId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useMemo basics</h1>
        <p>
          A component's render body re-runs on every state change, even ones that have nothing to do
          with a given computation. <code>useMemo</code> caches an expensive calculation's result
          between renders and only recomputes it when a value in its{" "}
          <strong>dependency array</strong> actually changed.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Caching a calculation</h3>
          <p>
            <code>useMemo</code> is a hook <strong>built into React</strong> (imported from{" "}
            <code>"react"</code>) that lets you cache the result of a calculation between
            re-renders.
          </p>
          <pre>
            <code>{`const value = useMemo(() => computeExpensiveValue(n), [n]);`}</code>
          </pre>
          <ul>
            <li>
              On the <strong>first render</strong>, React calls the function and stores its return
              value.
            </li>
            <li>
              On every later render, React compares each entry in the dependency array (
              <code>[n]</code> here) against last render's, using <code>Object.is</code>.
            </li>
            <li>
              If every dependency is unchanged, React <strong>skips calling the function</strong>{" "}
              and returns the cached value. If any dependency changed, it re-runs the function and
              caches the new result.
            </li>
          </ul>

          <h3 className="theory-subhead">Key rules</h3>
          <ul>
            <li>
              <code>useMemo</code> is a <strong>performance optimization</strong>, not a correctness
              tool — the component must still behave the same if you deleted the{" "}
              <code>useMemo</code> wrapper and called the function directly every render (just
              slower). If your logic actually depends on it, that's a sign of a different bug.
            </li>
            <li>
              The dependency array must list every reactive value the calculation reads — missing
              one recomputes on stale inputs, an unused extra one causes needless recomputation.
            </li>
            <li>
              Skip it for cheap calculations — the bookkeeping <code>useMemo</code> itself does has
              a small cost, so it only pays off once the calculation it wraps is genuinely
              expensive.
            </li>
            <li>
              <strong>React 19 note:</strong> the opt-in React Compiler can infer this memoization
              automatically at build time, aiming to remove most manual <code>useMemo</code>/
              <code>useCallback</code>/<code>React.memo</code> calls — but it's a separate build
              step (a Babel plugin) that isn't wired into this plain Vite setup, so the contrast
              below is exactly what the Compiler would otherwise be doing for you.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p className="demo-count">
            N: <strong>{n.toLocaleString()}</strong> · unrelated re-renders:{" "}
            <strong>{unrelatedCount}</strong>
          </p>

          <div className="demo-buttons">
            {(Object.keys(N_PRESETS) as NPresetId[]).map((id) => (
              <button key={id} onClick={() => changeN(id)} data-active={lastActionId === id}>
                {ACTIONS[id].label}
              </button>
            ))}
            <button onClick={handleUnrelatedClick} data-active={lastActionId === "unrelated"}>
              {ACTIONS.unrelated.label}
            </button>
          </div>
          <p className="demo-hint">
            Click the N buttons to change the actual dependency, then click "Re-render (unrelated
            state)" a few times and watch what happens to each variant's counters below.
          </p>

          <div className="variant-row">
            <div className="variant-card" data-flavor="naive">
              <p className="variant-label">Naive — called directly in render</p>
              <p className="variant-metric">
                Computed <strong>{naiveRuns}</strong> time{naiveRuns === 1 ? "" : "s"}
              </p>
              <p className="variant-metric">
                Division checks last run: <strong>{naiveResult.checks.toLocaleString()}</strong>
              </p>
              <p className="variant-metric">
                Primes below {n.toLocaleString()}:{" "}
                <strong>{naiveResult.count.toLocaleString()}</strong>
              </p>
            </div>
            <div className="variant-card" data-flavor="memoized">
              <p className="variant-label">Memoized — useMemo(..., [n])</p>
              <p className="variant-metric">
                Computed <strong>{memoRuns}</strong> time{memoRuns === 1 ? "" : "s"}
              </p>
              <p className="variant-metric">
                Division checks last run: <strong>{memoized.checks.toLocaleString()}</strong>
              </p>
              <p className="variant-metric">
                Primes below {n.toLocaleString()}:{" "}
                <strong>{memoized.count.toLocaleString()}</strong>
              </p>
            </div>
          </div>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                <span className={`explain-outcome ${active.outcome}`}>
                  {active.outcome === "bails-out" ? "✓ Bailed out: " : "↻ Recomputed: "}
                </span>
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
