import {
  memo,
  Profiler,
  useCallback,
  useRef,
  useState,
  type ProfilerOnRenderCallback,
} from "react";

/**
 * Concept: Profiling with the Profiler API
 *
 * Layout convention for every concept package:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * See ./README.md for the full write-up, the React DevTools walkthrough,
 * and discussion questions.
 *
 * This package is about *measuring* an over-rendering tree, not fixing it —
 * see performance/react-memo-basics for why React.memo works, and
 * hooks/use-callback-basics for why a stable function identity matters.
 */

// ---------------------------------------------------------------------------
// The "over-rendering tree": three children with very different reasons to
// re-render. None of them are memoized by default — that's the point.
// ---------------------------------------------------------------------------

interface TickCounterProps {
  tick: number;
}

// Legitimately re-renders every tick: its own displayed data (tick) changed.
function TickCounter({ tick }: TickCounterProps) {
  return (
    <div className="demo-tree-node">
      <span className="node-label">TickCounter — data changed</span>
      Tick: <strong>{tick}</strong>
    </div>
  );
}

interface GreetingProps {
  name: string;
}

// Never has a reason to re-render (name is constant) — but does anyway in
// "unoptimized" mode, purely because its parent re-rendered.
function Greeting({ name }: GreetingProps) {
  return (
    <div className="demo-tree-node">
      <span className="node-label">Greeting — data never changes</span>
      Hello, {name}!
    </div>
  );
}

interface ExpensiveListProps {
  items: readonly string[];
  onSelect: (item: string) => void;
  lastSelected: string | null;
}

// A deliberately non-trivial render: enough DOM nodes plus a bit of real
// per-item work that its render cost shows up clearly in actualDuration.
function ExpensiveList({ items, onSelect, lastSelected }: ExpensiveListProps) {
  return (
    <div className="demo-tree-node">
      <span className="node-label">ExpensiveList — data never changes, but render is costly</span>
      <ul className="expensive-list">
        {items.map((item) => {
          // Artificial-but-real work performed on every render of this
          // component — stands in for "a moderately expensive list item."
          let busy = 0;
          for (let i = 0; i < 4000; i += 1) busy += Math.sqrt(i);
          return (
            <li key={item}>
              <button onClick={() => onSelect(item)} data-active={item === lastSelected}>
                {item} ({busy.toFixed(0)})
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Memoized twins used in "optimized" mode. Wrapping in React.memo only pays
// off if the props it receives are also referentially stable — see the
// "optimized" entry in ACTIONS below and performance/react-memo-basics.
const MemoTickCounter = memo(TickCounter);
const MemoGreeting = memo(Greeting);
const MemoExpensiveList = memo(ExpensiveList);

const LIST_ITEMS = Array.from({ length: 250 }, (_, i) => `item-${i}`);

type Mode = "unoptimized" | "optimized";

interface DemoTreeProps {
  mode: Mode;
  tick: number;
  onSelect: (item: string) => void;
  lastSelected: string | null;
}

function DemoTree({ mode, tick, onSelect, lastSelected }: DemoTreeProps) {
  if (mode === "optimized") {
    return (
      <div className="demo-tree">
        <MemoTickCounter tick={tick} />
        <MemoGreeting name="Ada" />
        <MemoExpensiveList items={LIST_ITEMS} onSelect={onSelect} lastSelected={lastSelected} />
      </div>
    );
  }
  return (
    <div className="demo-tree">
      {/* Same components, no memo — every one of these re-renders on every tick. */}
      <TickCounter tick={tick} />
      <Greeting name="Ada" />
      <ExpensiveList items={LIST_ITEMS} onSelect={onSelect} lastSelected={lastSelected} />
    </div>
  );
}

interface ProfiledDemoTreeProps extends DemoTreeProps {
  onCommit: ProfilerOnRenderCallback;
}

/**
 * <Profiler> is a plain (non-memoized) built-in component: it calls
 * onRender for EVERY commit that reaches it, purely because an ancestor
 * re-rendered — regardless of whether anything memoized *inside* it
 * bailed out. If onRender updates state owned by that same ancestor (as
 * handleRender/setLog does in App below), and the <Profiler> element is
 * written inline in that ancestor's own JSX with no memo boundary around
 * it, you get an unconditional loop: onRender -> setLog -> App re-renders
 * -> <Profiler> is recreated and reprocessed regardless of DemoTree's own
 * memoization -> onRender fires again -> forever ("Maximum update depth
 * exceeded"). Memoizing DemoTree alone does NOT fix this — the fiber that
 * needs to bail is the Profiler's own parent, not something nested inside
 * it.
 *
 * The fix: wrap the Profiler itself (this component) in React.memo, and
 * give it only referentially stable props (onCommit included — see
 * handleRender's useCallback below). Then a log-only update to App leaves
 * ProfiledDemoTree's props unchanged, so memo bails out *before* the
 * <Profiler> element is even recreated, and the loop never starts. A
 * genuine change (mode/tick/lastSelected) still gets through once, and the
 * log-triggered re-render that follows it now matches the just-committed
 * props, so memo bails on that one, stopping the chain at exactly one log
 * entry per real interaction.
 */
function ProfiledDemoTreeImpl({
  mode,
  tick,
  onSelect,
  lastSelected,
  onCommit,
}: ProfiledDemoTreeProps) {
  return (
    <Profiler id={`demo-tree:${mode}`} onRender={onCommit}>
      <DemoTree mode={mode} tick={tick} onSelect={onSelect} lastSelected={lastSelected} />
    </Profiler>
  );
}

const ProfiledDemoTree = memo(ProfiledDemoTreeImpl);

// ---------------------------------------------------------------------------
// Profiler commit log
// ---------------------------------------------------------------------------

interface CommitLogEntry {
  key: number;
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  // Captured for completeness (React also reports these to onRender) but
  // not worth a table column here — DevTools' flame graph is the tool for
  // relating commits to wall-clock time.
  startTime: number;
  commitTime: number;
}

const MAX_LOG_ENTRIES = 20;

// ---------------------------------------------------------------------------
// "What just happened" copy — kept as plain strings next to the real
// handlers below, not derived from them, so the reader sees exactly what ran.
// ---------------------------------------------------------------------------

type ActionId = "tick" | "unoptimized" | "optimized" | "clear";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
}

const ACTIONS: Record<ActionId, ActionInfo> = {
  tick: {
    label: "Tick",
    code: `function tick() {
  setTick((t) => t + 1);
}`,
    explanation:
      'Bumping "tick" re-renders the parent. In "unoptimized" mode every child re-renders ' +
      "with it — Greeting and ExpensiveList included — even though neither one's own data " +
      "changed. Check the commit log: one click should add one row, and its actualDuration " +
      "should sit close to baseDuration, because nothing was skipped.",
  },
  unoptimized: {
    label: "Unoptimized",
    code: `<TickCounter tick={tick} />
<Greeting name="Ada" />
<ExpensiveList items={LIST_ITEMS} onSelect={onSelect} lastSelected={lastSelected} />`,
    explanation:
      'Plain, unmemoized children — the "over-rendering tree." React has no way to know ' +
      "Greeting's and ExpensiveList's props didn't change, so it re-renders them anyway on " +
      "every parent commit. This is the shape of bug this whole package exists to help you " +
      "spot before you reach for a fix.",
  },
  optimized: {
    label: "Optimized",
    code: `const MemoGreeting = memo(Greeting);
const MemoExpensiveList = memo(ExpensiveList);
// LIST_ITEMS is a module-level constant — already a stable reference.
const handleSelectStable = useCallback((item) => setLastSelected(item), []);`,
    explanation:
      "Same children, now wrapped in React.memo and given referentially stable props — a " +
      "module-level items array and a useCallback'd handler — so memo's shallow prop " +
      "comparison actually has a chance to bail out. Click Tick again: Greeting and " +
      "ExpensiveList should stop contributing to actualDuration, while baseDuration (the " +
      '"no memoization" estimate) stays roughly the same — that gap is memoization paying ' +
      "off. TickCounter still re-renders every time, because its tick prop genuinely " +
      "changed: memo only skips renders when props are unchanged, not renders you'd simply " +
      "like to avoid. See performance/react-memo-basics for why this works.",
  },
  clear: {
    label: "Clear log",
    code: `setLog([]);`,
    explanation: "Clears the commit log so the next interaction is easy to read in isolation.",
  },
};

export function App() {
  const [tick, setTick] = useState(0);
  const [mode, setMode] = useState<Mode>("unoptimized");
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const [log, setLog] = useState<CommitLogEntry[]>([]);
  const [activeId, setActiveId] = useState<ActionId | null>(null);
  const nextKey = useRef(0);

  // Stable across renders — passed to the "optimized" tree so React.memo's
  // shallow prop comparison actually has a chance to bail out.
  const handleSelectStable = useCallback((item: string) => setLastSelected(item), []);

  // useCallback with an empty dependency array is what makes this safe to
  // pass to ProfiledDemoTree: it only closes over setLog (a useState setter,
  // always stable) and nextKey (a ref, always stable), so its identity
  // never changes — see ProfiledDemoTreeImpl's comment above for why that
  // stability is what breaks the potential infinite loop.
  const handleRender = useCallback<ProfilerOnRenderCallback>(
    (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
      nextKey.current += 1;
      setLog((prev) =>
        [
          { key: nextKey.current, id, phase, actualDuration, baseDuration, startTime, commitTime },
          ...prev,
        ].slice(0, MAX_LOG_ENTRIES),
      );
    },
    [],
  );

  function runTick() {
    setActiveId("tick");
    setTick((t) => t + 1);
  }

  function runMode(next: Mode) {
    setActiveId(next);
    setMode(next);
  }

  function runClear() {
    setActiveId("clear");
    setLog([]);
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Profiling with the Profiler API</h1>
        <p>
          Before you can fix an over-rendering tree, you have to <em>notice</em> it. React's
          built-in <code>&lt;Profiler&gt;</code> component measures render cost programmatically;
          React DevTools' Profiler tab does the same thing interactively, for the whole tree, with
          no manual wrapping at all.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">The Profiler component</h3>
          <p>
            <code>&lt;Profiler&gt;</code> is built into React (imported from <code>"react"</code>).
            It takes an <code>id</code> and an <code>onRender</code> callback, and calls that
            callback every time something inside it commits:
          </p>
          <pre>
            <code>{`<Profiler id="demo-tree" onRender={onRender}>
  <DemoTree />
</Profiler>`}</code>
          </pre>

          <h3 className="theory-subhead">What onRender receives</h3>
          <ul>
            <li>
              <code>id</code> — the Profiler's own <code>id</code> prop, so you can tell multiple
              nested profilers' log entries apart.
            </li>
            <li>
              <code>phase</code> — <code>"mount"</code> on first render, <code>"update"</code> for a
              normal re-render, or <code>"nested-update"</code> when a descendant's own commit phase
              triggers another state update.
            </li>
            <li>
              <code>actualDuration</code> — milliseconds actually spent rendering this commit's
              subtree, including any memoization bail-outs it got to skip.
            </li>
            <li>
              <code>baseDuration</code> — an estimate of rendering the <em>entire</em> subtree from
              scratch with no memoization at all — the worst case.
            </li>
            <li>
              <code>startTime</code> / <code>commitTime</code> — timestamps for when this render
              began and when it committed (shared across sibling profilers in the same commit).
            </li>
          </ul>

          <h3 className="theory-subhead">The one comparison that matters</h3>
          <p>
            <code>actualDuration</code> vs. <code>baseDuration</code> is the key read: while nothing
            is memoized, they track closely — nothing gets skipped, so "actual" cost equals "worst
            case" cost. Once memoization is doing real work, <code>actualDuration</code> drops well
            below <code>baseDuration</code>, and that gap <em>is</em> the savings.
          </p>
          <p>
            Multiple <code>&lt;Profiler&gt;</code>s can nest to measure different subtrees
            independently — this demo only uses one for simplicity, but a real app might wrap a slow
            list separately from the header around it.
          </p>

          <h3 className="theory-subhead">The onRender-into-setState trap</h3>
          <p>
            Wiring <code>onRender</code> up to <code>setState</code> — exactly what this demo's
            commit-log table does — is an easy way to build an infinite loop by accident:{" "}
            <code>&lt;Profiler&gt;</code> is a plain built-in component, not a memoized one, so it
            re-fires <code>onRender</code> on <em>every</em> commit reachable from an ancestor's
            re-render, regardless of whether anything memoized further down bailed out. If the state
            that <code>onRender</code> updates lives in that same ancestor and the{" "}
            <code>&lt;Profiler&gt;</code> is written inline in its JSX with no memo boundary around
            it, each update re-triggers the very commit it's reporting on — forever. The fix here
            wraps the <code>&lt;Profiler&gt;</code> in its own <code>React.memo</code>d component (
            <code>ProfiledDemoTree</code> in the source) with a <code>useCallback</code>-stabilized{" "}
            <code>onRender</code>, so a log-only update leaves its props unchanged and it bails out
            before the <code>&lt;Profiler&gt;</code> is even touched again.
          </p>

          <h3 className="theory-subhead">This vs. React DevTools</h3>
          <p>
            This in-app table only shows what you explicitly instrumented, and is the kind of thing
            you'd reach for to log real perf metrics to an analytics backend in production. React
            DevTools' Profiler tab does this automatically for the <em>whole</em> tree, no wrapping
            required, plus a flame graph, a ranked chart, and a "why did this render" breakdown per
            component. See the README for a walkthrough against this exact page.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>

          <div className="demo-toolbar">
            <div className="mode-group">
              <button data-active={mode === "unoptimized"} onClick={() => runMode("unoptimized")}>
                Unoptimized
              </button>
              <button data-active={mode === "optimized"} onClick={() => runMode("optimized")}>
                Optimized
              </button>
            </div>
            <button data-active={activeId === "tick"} onClick={runTick}>
              Tick
            </button>
            <button onClick={runClear}>Clear log</button>
          </div>

          <div className="demo-meta">
            <span>
              Mode: <strong>{mode}</strong>
            </span>
            <span>
              Tick: <strong>{tick}</strong>
            </span>
          </div>

          <ProfiledDemoTree
            mode={mode}
            tick={tick}
            onSelect={handleSelectStable}
            lastSelected={lastSelected}
            onCommit={handleRender}
          />

          <h3 className="theory-subhead">Commit log (last {MAX_LOG_ENTRIES})</h3>
          {log.length === 0 ? (
            <p className="log-empty">Click Tick to record some commits.</p>
          ) : (
            <div className="log-table-wrap">
              <table className="log-table">
                <thead>
                  <tr>
                    <th>id</th>
                    <th>phase</th>
                    <th>actual (ms)</th>
                    <th>base (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((entry) => (
                    <tr key={entry.key}>
                      <td>{entry.id}</td>
                      <td data-phase={entry.phase}>{entry.phase}</td>
                      <td>{entry.actualDuration.toFixed(2)}</td>
                      <td>{entry.baseDuration.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>{active.explanation}</p>
              <pre>
                <code>{active.code}</code>
              </pre>
            </div>
          ) : (
            <p className="explain-placeholder">
              Click a control above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
