import { useDeferredValue, useMemo, useState, type ChangeEvent } from "react";

/**
 * Concept: useDeferredValue basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last mode selected,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo is a search-as-you-type filter over an in-memory dataset with an
 * artificially heavy per-item computation, contrasting two ways of wiring
 * the same input to the same expensive list:
 *
 *   - "Naive" — the expensive filter runs directly against the live
 *     `query` state on every render. Since that filter pass must finish
 *     before React can commit anything (including the input's own updated
 *     value), typing feels laggy — every keystroke waits on unrelated list
 *     work.
 *   - "useDeferredValue" — the input still renders from the live `query`
 *     (so it stays instantly responsive), but the expensive list is
 *     computed from `useDeferredValue(query)` instead. React commits the
 *     cheap, urgent render (the input) first, then reruns the component in
 *     the background once it can afford the expensive pass. `isStale`
 *     (`query !== deferredQuery`) dims the list while that background
 *     render is still catching up.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

// ---------------------------------------------------------------------------
// Dataset + artificial cost
// ---------------------------------------------------------------------------

// Deterministic pseudo-random generator (mulberry32) so the generated
// dataset — and therefore the demo's behavior — is identical on every
// reload, instead of reseeding differently each time like Math.random().
function mulberry32(seed: number) {
  let state = seed;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ADJECTIVES = [
  "quantum",
  "electric",
  "frozen",
  "hidden",
  "golden",
  "silent",
  "rapid",
  "gentle",
  "brave",
  "curious",
  "lucid",
  "stormy",
  "ancient",
  "vivid",
  "quiet",
  "fierce",
  "bold",
  "subtle",
  "radiant",
  "distant",
];

const NOUNS = [
  "falcon",
  "harbor",
  "lantern",
  "glacier",
  "meadow",
  "comet",
  "cipher",
  "forge",
  "orchard",
  "beacon",
  "tundra",
  "citadel",
  "prairie",
  "voyage",
  "echo",
  "summit",
  "canyon",
  "reef",
  "thicket",
  "spire",
];

// Size of the in-memory dataset the demo searches against.
const DATASET_SIZE = 3000;

function buildDataset(size: number): string[] {
  const random = mulberry32(42);
  const items: string[] = [];
  for (let i = 0; i < size; i++) {
    const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(random() * NOUNS.length)];
    items.push(`${adjective}-${noun}-${i.toString(36).padStart(3, "0")}`);
  }
  return items;
}

// Built once at module load — a stable dataset shared by both modes.
const DATASET = buildDataset(DATASET_SIZE);

// How many fixed-cost "units" of work each dataset row costs to check,
// regardless of whether it ends up matching. Stands in for something like
// fuzzy-scoring or syntax-highlighting a row would do in a real search UI
// before you even know if it's relevant. Tuned so filtering the *whole*
// dataset once is clearly noticeable (tens of milliseconds) on typical
// hardware, without freezing the tab for seconds.
const WORK_PER_ITEM = 6000;

function expensiveCheck(item: string, query: string): boolean {
  // Deterministic busy-work: a fixed number of cheap math ops per item.
  let acc = 0;
  for (let i = 0; i < WORK_PER_ITEM; i++) {
    acc += Math.sqrt(i + 1) % 7;
  }
  const matches = item.toLowerCase().includes(query);
  // Fold `acc` into the returned expression (via a branch that's always
  // false in practice) so the JS engine can't prove the loop above is
  // dead code and optimize it away entirely.
  return matches || acc < 0;
}

// Cost of one call is always DATASET_SIZE * WORK_PER_ITEM units — it scans
// every row, not just the ones that match — which is exactly what makes it
// expensive enough to notice on every keystroke.
function filterDataset(query: string): string[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return DATASET;
  return DATASET.filter((item) => expensiveCheck(item, trimmed));
}

const RESULT_LIMIT = 200;

// ---------------------------------------------------------------------------
// "What just happened" copy
// ---------------------------------------------------------------------------

type Mode = "naive" | "deferred";

interface ModeInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const MODE_INFO: Record<Mode, ModeInfo> = {
  naive: {
    label: "Naive (filter from live query)",
    code: `const [query, setQuery] = useState("");

// Runs on *every* keystroke, synchronously, as part of this render — the
// input's own updated value can't commit until this finishes.
const results = filterDataset(query);`,
    explanation:
      "results is computed straight from query, so every keystroke forces this whole " +
      "render — expensive filter included — to finish before React can commit anything, " +
      "even the input's own updated value. That's why typing feels laggy: the input is " +
      "stuck waiting on list work it doesn't actually need.",
    outcome: "buggy",
  },
  deferred: {
    label: "useDeferredValue",
    code: `const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);
const isStale = query !== deferredQuery;

// The input always renders from the live "query", so it stays instantly
// responsive. "results" comes from the lagging "deferredQuery" instead —
// React commits the cheap, urgent render first, then re-runs this
// component in the background once it can afford the expensive pass.
const results = filterDataset(deferredQuery);`,
    explanation:
      "query updates immediately, so the input never waits on filterDataset. " +
      "deferredQuery lags behind on purpose: React keeps showing the OLD results " +
      "(dimmed via isStale) for a moment, keeps typing responsive, then quietly " +
      "re-renders results once the background pass catches up — with no timer or " +
      "cancellation logic written by hand.",
    outcome: "correct",
  },
};

export function App() {
  const [mode, setMode] = useState<Mode>("naive");
  const [activeId, setActiveId] = useState<Mode | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  function switchMode(next: Mode) {
    setMode(next);
    setActiveId(next);
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    // Reveal the explanation for whichever mode is active as soon as the
    // learner actually interacts with the search box.
    setActiveId(mode);
  }

  // The one line that makes the whole demo work: which query the expensive
  // list is computed from depends on the selected mode. Everything else —
  // the input, the dataset, the cost function — is identical between modes.
  const listQuery = mode === "naive" ? query : deferredQuery;

  // useMemo here is incidental, not the point of the demo: it just avoids
  // redoing the expensive pass on a re-render where listQuery didn't
  // change (e.g. toggling isStale-driven styling). The concurrency benefit
  // comes entirely from *which* query feeds listQuery above.
  const allMatches = useMemo(() => filterDataset(listQuery), [listQuery]);
  const results = allMatches.slice(0, RESULT_LIMIT);

  const active = activeId ? MODE_INFO[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useDeferredValue basics</h1>
        <p>
          Filtering a large, expensive list directly from live input state makes typing itself feel
          slow, because the expensive work happens inside the same render as the keystroke.{" "}
          <code>useDeferredValue</code> lets the input stay instantly responsive by rendering the
          expensive part from a value that's allowed to lag a moment behind, then catch up once
          React can afford it.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Signature</h3>
          <p>
            <code>useDeferredValue</code> is a hook <strong>built into React</strong> (imported from{" "}
            <code>"react"</code>) that returns a deferred version of a value you pass it.
          </p>
          <pre>
            <code>const deferredValue = useDeferredValue(value, initialValue?);</code>
          </pre>
          <ul>
            <li>
              <code>value</code> — required, the value to defer (a primitive or an object).
            </li>
            <li>
              <code>initialValue</code> — optional (added in <strong>React 19</strong>): what to
              return on the component's very first render, before any deferral has happened. Omit it
              and the first render simply uses <code>value</code> itself.
            </li>
            <li>
              Returns <code>deferredValue</code> — equal to <code>value</code> on the initial
              render; on later updates it "lags behind" while React works on the new value in the
              background, then updates once that background render finishes.
            </li>
          </ul>

          <h3 className="theory-subhead">How the lag actually works</h3>
          <ul>
            <li>
              When an urgent update changes <code>value</code> (e.g. typing into a controlled
              input), React first re-renders keeping the <em>old</em> deferred value, so the urgent
              part of the UI (the input) commits immediately.
            </li>
            <li>
              React then schedules a lower-priority background render with the new value. That
              render is <strong>interruptible</strong> — if another urgent update (another
              keystroke) arrives before it finishes, React abandons it and starts over, so it never
              blocks on stale work.
            </li>
            <li>
              Comparing the live value to the deferred one tells you whether that background render
              has caught up yet: <code>const isStale = query !== deferredQuery;</code> — a common
              way to dim or fade the lagging UI so it reads as "catching up" rather than broken.
            </li>
          </ul>

          <h3 className="theory-subhead">vs. debouncing/throttling</h3>
          <p>
            Debouncing and throttling rely on a <strong>fixed time delay</strong> that knows nothing
            about how expensive the render actually is or how fast the device is.{" "}
            <code>useDeferredValue</code> integrates directly with React's own scheduler instead: it
            adapts automatically (barely lags on a fast device, lags more on a slow one) and its
            background render can be interrupted by new input — a timer-based debounce keeps waiting
            out its fixed delay regardless.
          </p>

          <h3 className="theory-subhead">vs. useTransition</h3>
          <p>
            <code>useTransition</code> wraps the <em>code that produces</em> a state update — you
            need the setter itself to call <code>startTransition(() =&gt; setState(...))</code>.{" "}
            <code>useDeferredValue</code> instead defers a <em>value you're given</em> (a prop, or
            something from a hook you don't control) where you have no setter to wrap. Per
            react.dev's caveats for <code>startTransition</code>: transitions "cannot be used to
            control text inputs... If you need to trigger a transition based on prop changes or
            values from custom hooks, <code>useDeferredValue</code> is the recommended alternative."
          </p>

          <h3 className="theory-subhead">Caveats</h3>
          <ul>
            <li>
              Pass primitives or objects that are stable across renders. An object literal created
              fresh during render looks "new" to <code>useDeferredValue</code>'s equality check on
              every single render, so it never gets to reuse the previous deferred value — defeating
              the whole point.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-buttons" role="tablist" aria-label="Mode">
            <button
              type="button"
              onClick={() => switchMode("naive")}
              data-active={mode === "naive"}
              aria-pressed={mode === "naive"}
            >
              Naive
            </button>
            <button
              type="button"
              onClick={() => switchMode("deferred")}
              data-active={mode === "deferred"}
              aria-pressed={mode === "deferred"}
            >
              useDeferredValue
            </button>
          </div>

          <input
            type="text"
            className="search-input"
            value={query}
            onChange={handleQueryChange}
            placeholder={`Search ${DATASET_SIZE.toLocaleString()} generated items… (try "quantum")`}
            aria-label="Search dataset"
          />

          <p className="demo-meta">
            <span>
              {allMatches.length.toLocaleString()} match{allMatches.length === 1 ? "" : "es"}
              {allMatches.length > RESULT_LIMIT ? ` (showing first ${RESULT_LIMIT})` : ""}
            </span>
            {mode === "deferred" && (
              <span className={isStale ? "stale-badge" : "fresh-badge"}>
                {isStale ? "⏳ stale — background render pending" : "✓ fresh"}
              </span>
            )}
          </p>

          <ul className="result-list" data-stale={mode === "deferred" && isStale}>
            {results.length === 0 ? (
              <li className="result-empty">No matches.</li>
            ) : (
              results.map((item) => <li key={item}>{item}</li>)
            )}
          </ul>

          <p className="explain-placeholder" style={{ marginTop: "0.75rem" }}>
            Type a few characters in <strong>Naive</strong> mode and notice the input itself feels
            sluggish. Switch to <strong>useDeferredValue</strong> and type the same thing — the
            input stays smooth while the (dimmed) list catches up a beat later.
          </p>
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
              Pick a mode and start typing in the search box to see the exact code behind it and why
              it behaves that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
