import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Concept: External store sync
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

// ---------------------------------------------------------------------
// The external store
//
// A tiny store that lives entirely OUTSIDE React: plain module state plus
// a listener list, nothing here imports React. This is deliberately the
// same shape as a real external store you'd have to integrate with —
// `window` dimensions, `navigator.onLine`, a WebSocket cache, a Redux-less
// pub/sub singleton — the interesting question is only ever "how does a
// React component read this safely?"
// ---------------------------------------------------------------------

interface CounterStore {
  getSnapshot(): number;
  subscribe(listener: () => void): () => void;
  increment(): void;
  reset(): void;
}

function createCounterStore(): CounterStore {
  let count = 0;
  let listeners: Array<() => void> = [];

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: () => count,
    subscribe(listener) {
      listeners = [...listeners, listener];
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    increment() {
      count += 1;
      emit();
    },
    reset() {
      count = 0;
      emit();
    },
  };
}

// One shared instance — every consumer below reads the SAME store, the
// same way every component in a real app would share one store instance
// imported from a module.
const counterStore = createCounterStore();

// ---------------------------------------------------------------------
// Consumer pattern 1: ad hoc (useState + manual subscribe in an Effect)
//
// Read the snapshot once into useState, then subscribe by hand in an
// Effect. This is the pattern most people reach for before learning
// useSyncExternalStore exists — and it's subtly unsafe:
//
//  1. Effects run AFTER paint, not during render. Between the render that
//     computes the initial `useState(() => store.getSnapshot())` value and
//     the Effect actually calling `store.subscribe(...)`, there's a window
//     where a store change can fire and be missed entirely — nothing is
//     listening yet.
//  2. Under concurrent rendering, React can start rendering a component,
//     pause the whole tree's work, let a store mutation happen, and only
//     commit later. Every ad hoc consumer that already rendered a stale
//     snapshot keeps showing it until ITS OWN Effect happens to fire — so
//     two mounted consumers of the same store can disagree for a render
//     or two. That's "tearing": the UI briefly shows two different
//     "current" values for what's supposed to be one piece of state.
//
// `subscribeDelayMs` below exaggerates window #1 on purpose, so the race
// is reliably visible on a click instead of needing real network/CPU
// jitter to land it by chance.
// ---------------------------------------------------------------------

function useCounterAdHoc(subscribeDelayMs: number): number {
  const [count, setCount] = useState(() => counterStore.getSnapshot());

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    function attach() {
      if (cancelled) return;
      // Re-sync once we finally attach. This line hides routine mount
      // races, but it can't recover an update that already fired AND
      // finished (no one was listening yet) before we got here — that
      // one is just gone.
      setCount(counterStore.getSnapshot());
      unsubscribe = counterStore.subscribe(() => setCount(counterStore.getSnapshot()));
    }

    if (subscribeDelayMs > 0) {
      const timer = setTimeout(attach, subscribeDelayMs);
      return () => {
        cancelled = true;
        clearTimeout(timer);
        unsubscribe?.();
      };
    }

    attach();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [subscribeDelayMs]);

  return count;
}

// ---------------------------------------------------------------------
// Consumer pattern 2: fixed (useSyncExternalStore)
//
// useSyncExternalStore subscribes as part of rendering/committing, not
// from a delayed Effect, and re-checks getSnapshot() on every render —
// including renders React throws away and retries under concurrent
// features. React guarantees every component calling this hook for the
// same store agrees within the same commit: there's no window where one
// consumer paints an old value and another paints a new one.
// ---------------------------------------------------------------------

function useCounterSynced(): number {
  return useSyncExternalStore(counterStore.subscribe, counterStore.getSnapshot);
}

type ConsumerId = "adhoc-a" | "adhoc-b" | "synced-a" | "synced-b";

function AdHocConsumer({
  id,
  label,
  subscribeDelayMs,
  onValue,
}: {
  id: ConsumerId;
  label: string;
  subscribeDelayMs: number;
  onValue: (id: ConsumerId, value: number) => void;
}) {
  const count = useCounterAdHoc(subscribeDelayMs);
  useEffect(() => {
    onValue(id, count);
  }, [id, count, onValue]);
  return (
    <p className="demo-count">
      {label}: <strong>{count}</strong>
    </p>
  );
}

function SyncedConsumer({
  id,
  label,
  onValue,
}: {
  id: ConsumerId;
  label: string;
  onValue: (id: ConsumerId, value: number) => void;
}) {
  const count = useCounterSynced();
  useEffect(() => {
    onValue(id, count);
  }, [id, count, onValue]);
  return (
    <p className="demo-count">
      {label}: <strong>{count}</strong>
    </p>
  );
}

type ActionId = "increment" | "reset" | "arm-delay" | "disarm-delay" | "rearm";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual code above — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  increment: {
    label: "Increment store",
    code: `counterStore.increment(); // count += 1, then notifies every subscriber`,
    explanation:
      "Every mounted consumer's subscribe callback fires. Both useSyncExternalStore " +
      "consumers re-render with the new snapshot in the same commit. The two ad hoc " +
      "consumers only update once their own useEffect subscription has actually attached — " +
      'if "simulate slow subscribe" is armed for Ad hoc B, it lags behind Ad hoc A and both ' +
      "synced consumers for a moment.",
  },
  reset: {
    label: "Reset store",
    code: `counterStore.reset(); // count = 0, then notifies every subscriber`,
    explanation:
      "Same notification path as increment — a good moment to check whether all four " +
      "readouts above briefly disagreed before settling back to 0.",
  },
  "arm-delay": {
    label: "Simulate slow subscribe: ON",
    code: `// subscribeDelayMs > 0, so attach() runs from a setTimeout instead of
// synchronously inside the Effect — opening a window where Ad hoc B is
// mounted (and rendering a snapshot) but nothing is listening to the
// store yet.
const timer = setTimeout(attach, subscribeDelayMs);`,
    explanation:
      'Ad hoc B remounts with an artificial 600ms delay before its useEffect actually calls ' +
      'store.subscribe(...). Click "Increment store" while the delay is armed: Ad hoc A and ' +
      "both synced consumers jump immediately, but Ad hoc B keeps showing its stale snapshot " +
      "until the delayed subscribe finally attaches and re-syncs — two consumers of the exact " +
      'same store disagreeing about its "current" value at the same moment. The gap is ' +
      "exaggerated here for a demo, but the same window exists, unexaggerated, in any ad hoc " +
      "subscription — a slow-mounting tree, a suspended boundary, or concurrent rendering " +
      "pausing before commit can all open it for real.",
    outcome: "buggy",
  },
  "disarm-delay": {
    label: "Simulate slow subscribe: OFF",
    code: `subscribeDelayMs === 0
  ? attach()                          // subscribes synchronously in the Effect
  : setTimeout(attach, subscribeDelayMs);`,
    explanation:
      "With the delay off, Ad hoc B's Effect subscribes on its very first commit, same as Ad " +
      "hoc A — so in this simple demo (no Suspense, no concurrent interruption) it happens to " +
      "keep up. Ad hoc code being safe here is coincidental to how simple this demo is, not a " +
      "guarantee useState + useEffect gives you in general.",
  },
  rearm: {
    label: "Remount Ad hoc B",
    code: `<AdHocConsumer key={remountKey} id="adhoc-b" ... />`,
    explanation:
      "Changing the key unmounts and remounts Ad hoc B from scratch, so its useState " +
      "initializer re-reads the store and its Effect's subscribe timing restarts — use this " +
      "to re-open the vulnerability window and try the race again.",
  },
};

export function App() {
  const [activeId, setActiveId] = useState<ActionId | null>(null);
  const [delayArmed, setDelayArmed] = useState(false);
  const [remountKey, setRemountKey] = useState(0);
  const [readings, setReadings] = useState<Record<ConsumerId, number>>(() => {
    const snapshot = counterStore.getSnapshot();
    return {
      "adhoc-a": snapshot,
      "adhoc-b": snapshot,
      "synced-a": snapshot,
      "synced-b": snapshot,
    };
  });

  // Stable identity (no dependency on `readings`) so it's safe to omit
  // from the consumers' effect dependency arrays without re-subscribing
  // every render.
  const report = useCallback((id: ConsumerId, value: number) => {
    setReadings((prev) => (prev[id] === value ? prev : { ...prev, [id]: value }));
  }, []);

  function run(id: ActionId) {
    setActiveId(id);
    switch (id) {
      case "increment":
        counterStore.increment();
        break;
      case "reset":
        counterStore.reset();
        break;
      case "arm-delay":
        setDelayArmed(true);
        setRemountKey((k) => k + 1);
        break;
      case "disarm-delay":
        setDelayArmed(false);
        setRemountKey((k) => k + 1);
        break;
      case "rearm":
        setRemountKey((k) => k + 1);
        break;
    }
  }

  const active = activeId ? ACTIONS[activeId] : null;
  const adHocTorn = readings["adhoc-a"] !== readings["adhoc-b"];
  const syncedTorn = readings["synced-a"] !== readings["synced-b"];

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>External store sync</h1>
        <p>
          Reading a value that lives <strong>outside React</strong> — a counter store, `window`
          size, an online/offline flag — via ad hoc <code>useState</code> + manual subscription
          risks missed updates and <strong>tearing</strong>. <code>useSyncExternalStore</code> is
          the hook React ships specifically to read external stores without that risk.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">What counts as an "external store"</h3>
          <p>
            Any mutable data that lives outside React's own state and can change without React
            knowing: browser APIs (<code>navigator.onLine</code>, <code>window</code> size), a
            WebSocket message cache, a non-React state library. Components need to read the{" "}
            <em>current</em> value and re-render when it changes.
          </p>

          <h3 className="theory-subhead">The ad hoc pattern (and its risk)</h3>
          <pre>
            <code>{`const [value, setValue] = useState(() => store.getSnapshot());
useEffect(() => {
  setValue(store.getSnapshot());       // catch up
  return store.subscribe(() => setValue(store.getSnapshot()));
}, []);`}</code>
          </pre>
          <ul>
            <li>
              The initial render and the Effect that subscribes are two separate moments — a
              store change between them is missed by that consumer alone.
            </li>
            <li>
              Under concurrent rendering, React can render a component against one snapshot, pause,
              and commit later after the store has already moved on — different mounted
              consumers can briefly disagree about the "current" value. That's called{" "}
              <strong>tearing</strong>.
            </li>
          </ul>

          <h3 className="theory-subhead">
            The fixed pattern: <code>useSyncExternalStore</code>
          </h3>
          <pre>
            <code>const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);</code>
          </pre>
          <ul>
            <li>
              <code>subscribe(callback)</code> — registers <code>callback</code> with the store and
              returns an unsubscribe function; React calls this itself, synchronously, as part of
              rendering/committing.
            </li>
            <li>
              <code>getSnapshot()</code> — returns the current value. It must be{" "}
              <strong>immutable</strong> and reference-stable when nothing changed (return a cached
              value, not a freshly built object) or React re-renders forever.
            </li>
            <li>
              <code>getServerSnapshot()</code> — optional third argument used only for server
              rendering; this demo doesn't need it (no SSR here).
            </li>
            <li>
              Because React re-checks <code>getSnapshot()</code> during every render — including
              throwaway/retried renders under concurrent features — it guarantees every component
              reading the same store is consistent within a commit. No ad hoc Effect timing to get
              wrong.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>

          <div className="demo-buttons">
            <button onClick={() => run("increment")} data-active={activeId === "increment"}>
              Increment store
            </button>
            <button onClick={() => run("reset")} data-active={activeId === "reset"}>
              Reset store
            </button>
            <button
              onClick={() => run(delayArmed ? "disarm-delay" : "arm-delay")}
              data-active={activeId === "arm-delay" || activeId === "disarm-delay"}
            >
              {delayArmed ? "Simulate slow subscribe: ON" : "Simulate slow subscribe: OFF"}
            </button>
            <button onClick={() => run("rearm")} data-active={activeId === "rearm"}>
              Remount Ad hoc B
            </button>
          </div>

          <h3 className="theory-subhead">Ad hoc: useState + manual subscribe</h3>
          <AdHocConsumer
            id="adhoc-a"
            label="Ad hoc A (subscribes immediately)"
            subscribeDelayMs={0}
            onValue={report}
          />
          <AdHocConsumer
            key={remountKey}
            id="adhoc-b"
            label={`Ad hoc B (${delayArmed ? "600ms delayed subscribe" : "subscribes immediately"})`}
            subscribeDelayMs={delayArmed ? 600 : 0}
            onValue={report}
          />
          <p>
            Do Ad hoc A and B agree right now?{" "}
            <span className={`explain-outcome ${adHocTorn ? "buggy" : "correct"}`}>
              {adHocTorn ? "✗ torn — disagree" : "✓ agree"}
            </span>
          </p>

          <h3 className="theory-subhead">Fixed: useSyncExternalStore</h3>
          <SyncedConsumer id="synced-a" label="Synced A" onValue={report} />
          <SyncedConsumer id="synced-b" label="Synced B" onValue={report} />
          <p>
            Do Synced A and B agree right now?{" "}
            <span className={`explain-outcome ${syncedTorn ? "buggy" : "correct"}`}>
              {syncedTorn ? "✗ torn — disagree" : "✓ always agree"}
            </span>
          </p>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                {active.outcome && (
                  <span className={`explain-outcome ${active.outcome}`}>
                    {active.outcome === "buggy" ? "⚠ Risky: " : "✓ "}
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
              Click a control above to see the exact code that ran and why it behaved that way. Try:
              arm the delay, then increment while it's armed, and watch Ad hoc B lag.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
