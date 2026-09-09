import { useState, useTransition, type ChangeEvent } from "react";

/**
 * Concept: useTransition basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo contrasts two ways of driving an expensive list re-render from
 * a text input, against the SAME artificially heavy per-item computation:
 *
 *   - "Naive" — a single setState call drives both the input's value and
 *     the expensive list render, synchronously, on every keystroke. React
 *     must finish that expensive render before it can commit, so fast
 *     typing visibly outruns the browser — characters lag or feel dropped.
 *   - "useTransition" — the input's own value still updates immediately via
 *     a plain, urgent setState (react.dev is explicit that controlled input
 *     state must NOT be wrapped in a transition), but the query driving the
 *     expensive list is set inside startTransition. isPending renders a
 *     "stale/pending" affordance while that low-priority render is still in
 *     flight, and typing again before it finishes interrupts it — per
 *     react.dev: "If a user triggers a new interaction while a transition
 *     is in progress, React will prioritize the new interaction, effectively
 *     interrupting the previous transition."
 *
 * See ./README.md for the full write-up, sources, and discussion questions.
 */

interface Item {
  id: number;
  text: string;
}

type Mode = "naive" | "transition";
type ActionId = "naive-typed" | "transition-pending" | "transition-settled";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// --- Deterministic, artificially expensive workload ------------------------
//
// TOTAL_ITEMS rows, each paying a fixed, wasteful synchronous cost on every
// single render of the list — standing in for a real app's expensive
// per-row work (fuzzy-match scoring, heavy formatting, etc.). Tuned so the
// jank in "Naive" is clearly visible on a typical laptop without hanging
// the tab for seconds; adjust BUSY_ITERATIONS_PER_ROW if it's too
// subtle/too slow on your machine.
const TOTAL_ITEMS = 3000;
const BUSY_ITERATIONS_PER_ROW = 4000;

const CATEGORIES = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew"];

const ITEMS: Item[] = Array.from({ length: TOTAL_ITEMS }, (_, id) => ({
  id,
  text: `Row #${id} — ${CATEGORIES[id % CATEGORIES.length]}`,
}));

// Deliberately wasteful synchronous work with no side effect other than
// burning CPU time — a stand-in for "some expensive thing every row does
// on every render" (scoring, layout math, whatever). The return value only
// exists so the JS engine can't optimize the loop away.
function busyComputeScore(seed: number): number {
  let acc = seed;
  for (let i = 0; i < BUSY_ITERATIONS_PER_ROW; i++) {
    acc = (acc * 31 + i) % 1_000_003;
    acc += Math.sqrt(acc + i) | 0;
  }
  return acc;
}

// Runs the expensive per-row work for EVERY item (not just the matches) —
// same as a real list re-rendering every row's expensive content before
// filtering, then keeps the ones matching the query. This is what makes
// the cost roughly constant per keystroke, regardless of how many rows
// match.
function computeMatches(query: string): Item[] {
  const q = query.trim().toLowerCase();
  const results: Item[] = [];
  for (const item of ITEMS) {
    const score = busyComputeScore(item.id); // wasteful work happens here
    const isMatch = q === "" || item.text.toLowerCase().includes(q);
    if (isMatch && score >= 0) {
      // score is always >= 0 by construction; the check only exists so
      // the compiler can't prove `score` is unused and drop the call.
      results.push(item);
    }
  }
  return results;
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  "naive-typed": {
    label: "Naive: keystroke handled",
    code: `function handleNaiveChange(e) {
  setNaiveQuery(e.target.value);
  // Same render commits the input's new value AND runs computeMatches()
  // — a few thousand rows of deliberately wasteful work — synchronously,
  // before React can paint and let you type the next character.
}`,
    explanation:
      "setNaiveQuery is a plain, urgent update. React can't show the new character until it " +
      "finishes rendering the whole component — including the expensive list — so fast typing " +
      "outruns the browser and keystrokes visibly lag or feel dropped.",
    outcome: "buggy",
  },
  "transition-pending": {
    label: "useTransition: keystroke handled",
    code: `function handleTransitionChange(e) {
  const value = e.target.value;
  setInputValue(value);          // urgent — input updates right now
  startTransition(() => {
    setTransitionQuery(value);   // non-urgent — marked as a Transition
  });
}`,
    explanation:
      "setInputValue commits immediately, so the character appears instantly. setTransitionQuery " +
      "is marked as a Transition, so isPending flips to true while React renders the expensive " +
      'list in the background. Per react.dev: "If a user triggers a new interaction while a ' +
      "transition is in progress, React will prioritize the new interaction, effectively " +
      'interrupting the previous transition" — type again right now and this restarts with the ' +
      "newest value instead of queuing up stale renders.",
  },
  "transition-settled": {
    label: "useTransition: transition settled",
    code: `// Same startTransition(() => setTransitionQuery(value)) call as above —
// isPending flips back to false once React finishes rendering the list
// for the latest query.`,
    explanation:
      "The background render committed, so the list now reflects the latest query and isPending " +
      "is false again. Because Transition renders are interruptible, only the newest query you " +
      "typed actually had to finish rendering — any in-flight renders for queries you'd already " +
      "typed past were abandoned rather than piling up.",
    outcome: "correct",
  },
};

export function App() {
  const [mode, setMode] = useState<Mode>("naive");
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  // --- Naive version: one urgent update drives input + expensive list ----
  const [naiveQuery, setNaiveQuery] = useState("");

  // --- useTransition version ----------------------------------------------
  const [inputValue, setInputValue] = useState(""); // urgent — the input's own value
  const [transitionQuery, setTransitionQuery] = useState(""); // non-urgent — drives the list
  const [isPending, startTransition] = useTransition();

  // Once the transition's render commits (isPending flips back to false),
  // update the "what just happened" panel to the settled explanation. This
  // is the "adjusting state during rendering" pattern react.dev recommends
  // in place of an Effect for reacting to a value changing since the last
  // render: comparing against a ref-free "previous value" state and calling
  // setState directly in the render body, guarded so it only fires once per
  // actual change. An Effect here would mean calling setState() directly
  // within an effect body purely to sync local component state — not an
  // external system — which react.dev's rules of hooks flag as an
  // anti-pattern (cascading renders for no benefit over doing it inline).
  const [prevIsPending, setPrevIsPending] = useState(isPending);
  if (isPending !== prevIsPending) {
    setPrevIsPending(isPending);
    if (mode === "transition" && !isPending && activeId === "transition-pending") {
      setActiveId("transition-settled");
    }
  }

  function handleNaiveChange(e: ChangeEvent<HTMLInputElement>) {
    setActiveId("naive-typed");
    setNaiveQuery(e.target.value);
  }

  function handleTransitionChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);
    setActiveId("transition-pending");
    startTransition(() => {
      setTransitionQuery(value);
    });
  }

  function switchMode(next: Mode) {
    setMode(next);
    setActiveId(null);
  }

  // The expensive computation only runs for whichever mode is on screen —
  // switching modes doesn't pay the other variant's cost. (Timing this with
  // performance.now() during render would call an impure function in the
  // render body — react.dev's Rules of React flag that too, since it can
  // produce unstable results across the double-render React may do — so
  // this demo shows the effect qualitatively via the pending indicator
  // instead of a millisecond count.)
  const visibleMatches =
    mode === "naive" ? computeMatches(naiveQuery) : computeMatches(transitionQuery);

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useTransition basics</h1>
        <p>
          Not every state update is urgent. Wrapping a slow, non-urgent update in{" "}
          <code>startTransition</code> lets React keep the UI (like a text input) instantly
          responsive, rendering the expensive part in the background and marking it as{" "}
          <code>isPending</code> until it catches up — interruptibly, so it never falls behind.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Declaring a transition</h3>
          <p>
            <code>useTransition</code> is a hook <strong>built into React</strong> (imported from{" "}
            <code>"react"</code>) for marking a state update as non-urgent.
          </p>
          <pre>
            <code>const [isPending, startTransition] = useTransition();</code>
          </pre>
          <ul>
            <li>
              <code>isPending</code> — a boolean that's <code>true</code> from the moment{" "}
              <code>startTransition</code> is called until the update it scheduled has rendered and
              committed.
            </li>
            <li>
              <code>startTransition</code> — call it with a function; React runs that function{" "}
              <strong>immediately</strong>, and any state updates triggered synchronously inside it
              are marked as a Transition instead of an urgent update.
            </li>
            <li>
              Updates scheduled <em>after</em> an <code>await</code> or a timeout inside that
              function are <strong>not</strong> automatically part of the Transition — only
              synchronous updates made during the callback's own execution are covered.
            </li>
          </ul>

          <h3 className="theory-subhead">What "marking an update as a transition" means</h3>
          <ul>
            <li>
              A Transition tells React this update is <strong>lower priority</strong> than a regular
              one — React renders it in the background instead of blocking the next paint on it.
            </li>
            <li>
              Transitions are <strong>interruptible</strong>: react.dev says "if a user triggers a
              new interaction while a transition is in progress, React will prioritize the new
              interaction, effectively interrupting the previous transition" — so typing again
              restarts the pending list render with the latest value instead of queuing it up behind
              the stale one.
            </li>
            <li>
              Marking an update as a transition does <strong>not</strong> make the work itself
              faster — <code>computeMatches()</code> below costs exactly the same either way. It
              changes <em>when</em> and <em>how blocking</em> that render is.
            </li>
          </ul>

          <h3 className="theory-subhead">
            <code>startTransition</code> (standalone) vs. <code>useTransition</code>
          </h3>
          <ul>
            <li>
              <code>useTransition</code> is a Hook, so it can only be called at the top level of a
              component. The standalone <code>startTransition</code> import (also from{" "}
              <code>"react"</code>) does the same marking from outside a component (e.g. a data
              library) — but, per react.dev, "without the isPending status indicator."
            </li>
            <li>
              Per react.dev's <code>startTransition</code> caveats: it can't track pending status,
              and "if multiple transitions are ongoing, React currently batches them together."
            </li>
          </ul>

          <h3 className="theory-subhead">Key rule: don't wrap the input's own value</h3>
          <p>react.dev is explicit that controlled input state must stay urgent:</p>
          <pre>
            <code>{`// ❌ Can't use Transitions for controlled input state
startTransition(() => {
  setText(e.target.value);
});`}</code>
          </pre>
          <p>
            "Controlled inputs require synchronous updates, which Transitions do not provide." —
            that's exactly why the demo below calls <code>setInputValue</code> urgently and only
            wraps the expensive <code>setTransitionQuery</code> call in <code>startTransition</code>
            .
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-buttons" role="tablist" aria-label="Implementation">
            <button
              type="button"
              onClick={() => switchMode("naive")}
              data-active={mode === "naive"}
              aria-pressed={mode === "naive"}
            >
              Naive (blocking)
            </button>
            <button
              type="button"
              onClick={() => switchMode("transition")}
              data-active={mode === "transition"}
              aria-pressed={mode === "transition"}
            >
              useTransition
            </button>
          </div>

          {mode === "naive" ? (
            <input
              type="text"
              className="query-input"
              value={naiveQuery}
              onChange={handleNaiveChange}
              placeholder={`Type quickly to filter ${TOTAL_ITEMS} rows…`}
              aria-label="Naive filter query"
            />
          ) : (
            <input
              type="text"
              className="query-input"
              value={inputValue}
              onChange={handleTransitionChange}
              placeholder={`Type quickly to filter ${TOTAL_ITEMS} rows…`}
              aria-label="useTransition filter query"
            />
          )}

          <div className="pending-indicator">
            {mode === "transition" && isPending && (
              <>
                <span className="pending-spinner" aria-hidden="true" />
                List updating in the background — input stayed responsive…
              </>
            )}
          </div>

          <p className="match-meta">
            {visibleMatches.length} / {TOTAL_ITEMS} rows matched
            {mode === "naive"
              ? " — computed synchronously, on the same render as your keystroke."
              : isPending
                ? " — still computing in the background…"
                : " — computed in the background, off the keystroke's critical path."}
          </p>

          <ul className="match-list" data-pending={mode === "transition" && isPending}>
            {visibleMatches.slice(0, 40).map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
            {visibleMatches.length > 40 && <li>…and {visibleMatches.length - 40} more</li>}
          </ul>
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
              Type into the input above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
