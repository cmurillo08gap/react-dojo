import { useEffect, useRef, useState } from "react";
import {
  getActiveListenerCount,
  observeTicker,
  resetTicker,
  subscribeToTicker,
  type TickEvent,
} from "./ticker";

/**
 * Concept: useEffect basics
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

type Mode = "buggy" | "correct";

interface Subscriber {
  id: number;
  mode: Mode;
}

type ActionId = "mountBuggy" | "mountCorrect" | "unmount" | "reset";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual handlers/effects below —
// they're display copies, not derived automatically, so the reader sees
// exactly what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  mountBuggy: {
    label: "Mount (buggy — no cleanup)",
    code: `useEffect(() => {
  const unsubscribe = subscribeToTicker(handleTick);
  // No return here — the subscription is never undone.
}, [mode]);`,
    explanation:
      "A fresh subscriber mounted and its effect subscribed to the ticker, but returned no " +
      "cleanup function. Watch the active listener count: it goes up and never comes back " +
      "down for this subscriber — not on remount, not on unmount. Because of <StrictMode>'s " +
      "dev-only mount → cleanup → mount double-invoke, mounting it even once already adds " +
      "two listeners, not one.",
    outcome: "buggy",
  },
  mountCorrect: {
    label: "Mount (correct — with cleanup)",
    code: `useEffect(() => {
  const unsubscribe = subscribeToTicker(handleTick);
  return unsubscribe;
}, [mode]);`,
    explanation:
      "A fresh subscriber mounted and returned `unsubscribe` as its cleanup function. React " +
      "calls that cleanup before the effect ever re-runs, and again on unmount — so even " +
      "StrictMode's dev-only mount → cleanup → mount dance nets exactly one active listener.",
    outcome: "correct",
  },
  unmount: {
    label: "Unmount",
    code: `{subscriber && (
  <TickerSubscriber key={subscriber.id} id={subscriber.id} mode={subscriber.mode} />
)}`,
    explanation:
      "Removing the subscriber from the tree unmounts it. If it was the correct variant, its " +
      "cleanup runs and the listener count drops back down. If it was the buggy variant, no " +
      "cleanup ever runs, so the listener count doesn't move at all — that listener is now " +
      "permanently leaked for the rest of the page's life.",
  },
  reset: {
    label: "Reset ticker",
    code: `export function resetTicker(): void {
  listeners.clear();
}`,
    explanation:
      "A demo-only escape hatch that force-clears every listener the ticker is holding — " +
      "including ones leaked by the buggy variant — so you can replay the demo from a clean " +
      "slate without reloading the page.",
  },
};

/**
 * The component under test. It subscribes to the module-level ticker (an
 * external system) inside a `useEffect` — `mode` controls whether that
 * effect returns a cleanup function or not.
 */
function TickerSubscriber({ id, mode }: { id: number; mode: Mode }) {
  const [ticksSeen, setTicksSeen] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToTicker(() => {
      setTicksSeen((n) => n + 1);
    });

    if (mode === "correct") {
      return unsubscribe;
    }
    // Buggy: no cleanup returned, so this exact listener closure is never
    // removed — see ACTIONS.mountBuggy for why that matters immediately,
    // even before any manual remount.
  }, [mode]);

  return (
    <div className="mini-counter" data-flavor={mode === "buggy" ? "unstable" : undefined}>
      <p className="mini-label">
        Subscriber #{id} ({mode})
      </p>
      <p className="mini-count">{ticksSeen} ticks seen</p>
    </div>
  );
}

export function App() {
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  // Lazy initializer: computed once, synchronously, during the initial
  // render itself — not as a side effect — so the effect below only ever
  // needs to handle *changes* reported by the ticker, never an initial sync.
  const [activeCount, setActiveCount] = useState(() => getActiveListenerCount());
  const [log, setLog] = useState<TickEvent[]>([]);
  const [activeId, setActiveId] = useState<ActionId | null>(null);
  const nextId = useRef(0);

  // The dashboard's own subscription — always correctly cleaned up, since
  // it exists only to observe the ticker for display purposes and isn't
  // part of the buggy/correct contrast being demonstrated.
  useEffect(() => {
    return observeTicker((event) => {
      setActiveCount(event.listenerCount);
      setLog((prev) => [event, ...prev].slice(0, 6));
    });
  }, []);

  function run(id: ActionId) {
    setActiveId(id);
    switch (id) {
      case "mountBuggy":
        nextId.current += 1;
        setSubscriber({ id: nextId.current, mode: "buggy" });
        break;
      case "mountCorrect":
        nextId.current += 1;
        setSubscriber({ id: nextId.current, mode: "correct" });
        break;
      case "unmount":
        setSubscriber(null);
        break;
      case "reset":
        resetTicker();
        setActiveCount(getActiveListenerCount());
        break;
    }
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useEffect basics</h1>
        <p>
          Effects let you <strong>synchronize a component with an external system</strong> —
          something outside React's own state, like a subscription, a timer, or a WebSocket
          connection. A <strong>cleanup function</strong> tells React how to disconnect before the
          effect re-runs or the component unmounts.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Synchronizing with an external system</h3>
          <p>
            <code>useEffect</code> is a hook <strong>built into React</strong> (imported from{" "}
            <code>"react"</code>) for connecting a component to something that lives outside React's
            rendering — a subscription, a browser API, a network connection.
          </p>
          <pre>
            <code>{`useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);`}</code>
          </pre>
          <ul>
            <li>
              The <strong>setup function</strong> (the first argument) runs after React commits the
              render to the screen.
            </li>
            <li>
              It can optionally <strong>return a cleanup function</strong> — React calls it right
              before the effect runs again, and once more when the component unmounts.
            </li>
            <li>
              The <strong>dependency array</strong> (the second argument) lists every reactive value
              the setup function reads. Omit it and the effect reruns after every render; pass{" "}
              <code>[]</code> and it runs once, after the initial mount.
            </li>
          </ul>

          <h3 className="theory-subhead">Cleanup functions & StrictMode</h3>
          <ul>
            <li>
              A subscription without cleanup <strong>leaks</strong>: every time the effect reruns or
              the component remounts, another subscription piles up on top of the old one, which
              nothing ever removes.
            </li>
            <li>
              In development, <code>&lt;StrictMode&gt;</code> intentionally runs every effect's
              setup, then its cleanup, then setup again — immediately, on the very first mount —
              specifically to surface missing/incorrect cleanup before it reaches production.
            </li>
            <li>
              This double-invoke is <strong>dev-only</strong>: production builds run the setup
              function exactly once per real mount. Relying on "it only ran once for me locally" is
              not the same as verifying the cleanup is correct.
            </li>
            <li>
              A correct cleanup makes the mount → cleanup → mount cycle a no-op (net one
              subscription); a missing one turns it into a visible bug you can catch immediately,
              rather than in production traffic.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p className="demo-count">
            Active ticker listeners: <strong>{activeCount}</strong> &middot; subscriber slot:{" "}
            <strong>{subscriber ? `mounted (${subscriber.mode})` : "empty"}</strong>
          </p>
          <div className="demo-buttons">
            <button onClick={() => run("mountBuggy")} data-active={activeId === "mountBuggy"}>
              {ACTIONS.mountBuggy.label}
            </button>
            <button onClick={() => run("mountCorrect")} data-active={activeId === "mountCorrect"}>
              {ACTIONS.mountCorrect.label}
            </button>
            <button
              onClick={() => run("unmount")}
              data-active={activeId === "unmount"}
              disabled={!subscriber}
            >
              {ACTIONS.unmount.label}
            </button>
            <button onClick={() => run("reset")} data-active={activeId === "reset"}>
              {ACTIONS.reset.label}
            </button>
          </div>
          <p className="demo-hint">
            Click "{ACTIONS.mountBuggy.label}" a few times in a row — each click mounts a brand new
            subscriber, but the listener count never comes back down. Now try the same with "
            {ACTIONS.mountCorrect.label}": the count always settles back to exactly one.
          </p>

          <div className="subscriber-slot">
            {subscriber ? (
              <TickerSubscriber key={subscriber.id} id={subscriber.id} mode={subscriber.mode} />
            ) : (
              <p className="explain-placeholder">No subscriber mounted.</p>
            )}
          </div>

          <ul className="tick-log">
            {log.length === 0 ? (
              <li className="tick-log-empty">
                No ticks yet — mount a subscriber and wait a second.
              </li>
            ) : (
              log.map((event) => (
                <li key={event.tick} data-leaked={event.listenerCount > 1}>
                  Tick {event.tick} → {event.listenerCount} listener
                  {event.listenerCount === 1 ? "" : "s"} fired
                </li>
              ))
            )}
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
              Click a button above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
