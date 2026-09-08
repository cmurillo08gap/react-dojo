import { useReducer, useState } from "react";

/**
 * Concept: useReducer basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last button pressed,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo contrasts two implementations of the SAME small state machine —
 * a fetch-status UI with a status/data/error trio whose fields are coupled
 * (only certain combinations are ever meaningful):
 *
 *   - "Loose useState" — one useState call per field. Each handler only
 *     remembers to update the fields *it* cares about, so it's easy to
 *     leave a stale value behind in a field nobody told to reset. The demo
 *     panel prints the raw state so you can see the invalid combination
 *     directly (e.g. status: "success" with a leftover error message).
 *   - "useReducer" — one reducer with a discriminated-union action type.
 *     Every action returns a *complete* replacement state object, so a
 *     stale field can never survive into the next state. The same invalid
 *     combination becomes unreachable by construction, not by discipline.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

type Status = "idle" | "loading" | "success" | "error";

type Mode = "loose" | "reducer";

type ActionId = "fetch" | "succeed" | "fail" | "reset";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// --- Fixed version: one reducer, one discriminated-union action type -----
//
// Because every case below returns a brand-new, fully-formed FetchState,
// there is no way to end up with (say) status: "success" while an old
// error message lingers — the "success" case simply doesn't carry one
// forward. The invalid combination the loose version can reach is not
// ruled out by convention here, it's structurally unreachable.

interface FetchState {
  status: Status;
  data: string | null;
  error: string | null;
}

type FetchAction =
  | { type: "fetch" }
  | { type: "succeed"; data: string }
  | { type: "fail"; error: string }
  | { type: "reset" };

const initialFetchState: FetchState = { status: "idle", data: null, error: null };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "fetch":
      return { status: "loading", data: null, error: null };
    case "succeed":
      return { status: "success", data: action.data, error: null };
    case "fail":
      return { status: "error", data: null, error: action.error };
    case "reset":
      return initialFetchState;
    default: {
      // Exhaustiveness check: if FetchAction ever gains a new variant
      // without a matching case above, this line fails to typecheck.
      const unreachable: never = action;
      return unreachable;
    }
  }
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const LOOSE_ACTIONS: Record<ActionId, ActionInfo> = {
  fetch: {
    label: "Fetch",
    code: `function handleFetchLoose() {
  setStatus("loading");
  // Bug: doesn't touch "error" or "data" — whatever was left over
  // from the previous request is still sitting in state.
}`,
    explanation:
      'Only status changes. If a previous request left "error" or "data" set, ' +
      'they silently carry over into the "loading" state.',
  },
  succeed: {
    label: "Succeed",
    code: `function handleSucceedLoose() {
  setStatus("success");
  setData("42 items loaded");
  // Bug: doesn't reset "error" — a stale error from an earlier
  // failed request can still be truthy right now.
}`,
    explanation:
      'This handler only "owns" status and data, so it never clears error. If the last ' +
      "request before this one failed, the UI now shows a success state with a leftover " +
      "error message at the same time — an invalid combination.",
    outcome: "buggy",
  },
  fail: {
    label: "Fail",
    code: `function handleFailLoose() {
  setStatus("error");
  setError("Network request failed");
  // Bug: doesn't reset "data" — a previous successful response can
  // still be sitting in state.
}`,
    explanation:
      'Symmetric bug: this handler "owns" status and error, so old data from a previous ' +
      "success is never cleared. status: \"error\" and a populated data field can coexist.",
    outcome: "buggy",
  },
  reset: {
    label: "Reset",
    code: `function handleResetLoose() {
  setStatus("idle");
  setData(null);
  setError(null);
}`,
    explanation:
      "Reset happens to touch all three setters, so it's the one handler that can't leave " +
      "a stale field behind — but nothing forces every handler to remember that.",
    outcome: "correct",
  },
};

const REDUCER_ACTIONS: Record<ActionId, ActionInfo> = {
  fetch: {
    label: "Fetch",
    code: `dispatch({ type: "fetch" });

// case "fetch":
//   return { status: "loading", data: null, error: null };`,
    explanation:
      'The "fetch" case returns a full replacement state — status, data, and error are all ' +
      "decided together, so a stale error or data value from before can't survive.",
    outcome: "correct",
  },
  succeed: {
    label: "Succeed",
    code: `dispatch({ type: "succeed", data: "42 items loaded" });

// case "succeed":
//   return { status: "success", data: action.data, error: null };`,
    explanation:
      'The "succeed" case always sets error back to null as part of the same object — there ' +
      "is no code path where success and a leftover error can coexist.",
    outcome: "correct",
  },
  fail: {
    label: "Fail",
    code: `dispatch({ type: "fail", error: "Network request failed" });

// case "fail":
//   return { status: "error", data: null, error: action.error };`,
    explanation:
      'The "fail" case always sets data back to null as part of the same object — an error ' +
      "state can never carry forward stale data from a previous success.",
    outcome: "correct",
  },
  reset: {
    label: "Reset",
    code: `dispatch({ type: "reset" });

// case "reset":
//   return initialFetchState;`,
    explanation:
      "Reset is just another case returning a known-good complete state — nothing special " +
      "about it compared to the other three.",
    outcome: "correct",
  },
};

// Detects the exact kind of invalid combination the loose version can
// reach. This check has no equivalent in the reducer version because the
// reducer's return type makes the underlying combinations unreachable.
function looseInvalidReason(status: Status, data: string | null, error: string | null) {
  if (status === "success" && error !== null) {
    return 'status is "success" but error is still set from an earlier failed request.';
  }
  if (status === "error" && data !== null) {
    return 'status is "error" but data is still set from an earlier successful request.';
  }
  if (status === "loading" && (data !== null || error !== null)) {
    return 'status is "loading" but a previous request\'s data/error is still sitting in state.';
  }
  return null;
}

export function App() {
  const [mode, setMode] = useState<Mode>("loose");
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  // Loose version: three independent useState calls.
  const [looseStatus, setLooseStatus] = useState<Status>("idle");
  const [looseData, setLooseData] = useState<string | null>(null);
  const [looseError, setLooseError] = useState<string | null>(null);

  // Fixed version: one useReducer call.
  const [reducerState, dispatch] = useReducer(fetchReducer, initialFetchState);

  function run(id: ActionId) {
    setActiveId(id);
    if (mode === "loose") {
      switch (id) {
        case "fetch":
          // Intentional bug — see LOOSE_ACTIONS.fetch.
          setLooseStatus("loading");
          break;
        case "succeed":
          // Intentional bug — see LOOSE_ACTIONS.succeed.
          setLooseStatus("success");
          setLooseData("42 items loaded");
          break;
        case "fail":
          // Intentional bug — see LOOSE_ACTIONS.fail.
          setLooseStatus("error");
          setLooseError("Network request failed");
          break;
        case "reset":
          setLooseStatus("idle");
          setLooseData(null);
          setLooseError(null);
          break;
      }
    } else {
      switch (id) {
        case "fetch":
          dispatch({ type: "fetch" });
          break;
        case "succeed":
          dispatch({ type: "succeed", data: "42 items loaded" });
          break;
        case "fail":
          dispatch({ type: "fail", error: "Network request failed" });
          break;
        case "reset":
          dispatch({ type: "reset" });
          break;
      }
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setActiveId(null);
  }

  const actions = mode === "loose" ? LOOSE_ACTIONS : REDUCER_ACTIONS;
  const active = activeId ? actions[activeId] : null;

  const status = mode === "loose" ? looseStatus : reducerState.status;
  const data = mode === "loose" ? looseData : reducerState.data;
  const error = mode === "loose" ? looseError : reducerState.error;
  const invalidReason = mode === "loose" ? looseInvalidReason(status, data, error) : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useReducer basics</h1>
        <p>
          Several <code>useState</code> calls for fields that are actually{" "}
          <strong>coupled</strong> (like a fetch's status/data/error trio) can be updated{" "}
          <em>inconsistently</em> — nothing stops one handler from changing status without
          resetting the fields that go with it. <code>useReducer</code> replaces that trio with one
          state value and a fixed set of actions, so each transition can only produce a complete,
          valid state.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Declaring a reducer</h3>
          <p>
            <code>useReducer</code> is a hook <strong>built into React</strong> (imported from{" "}
            <code>"react"</code>) for state whose updates follow more structure than a single{" "}
            <code>useState</code> comfortably expresses.
          </p>
          <pre>
            <code>const [state, dispatch] = useReducer(reducer, initialArg, init?);</code>
          </pre>
          <ul>
            <li>
              <code>reducer</code> — a pure function <code>(state, action) =&gt; newState</code>{" "}
              you write; it must not mutate <code>state</code>, only return a new value.
            </li>
            <li>
              <code>initialArg</code> — the value used to compute the initial state (optionally
              post-processed by the third argument, <code>init</code>).
            </li>
            <li>
              <code>state</code> — the current state for <em>this</em> render, just like{" "}
              <code>useState</code>'s first tuple element.
            </li>
            <li>
              <code>dispatch</code> — call it with an <strong>action</strong> object to request a
              state update; React re-renders with whatever the reducer returns for that action.
              Its identity is stable across renders, same as a <code>useState</code> setter.
            </li>
          </ul>

          <h3 className="theory-subhead">Migrating from useState</h3>
          <p>react.dev frames the move from a few related useState calls to useReducer in three steps:</p>
          <ul>
            <li>
              <strong>Move</strong> from setting state directly to dispatching actions from event
              handlers (<code>{`dispatch({ type: "succeed", data })`}</code> instead of two or three
              setter calls).
            </li>
            <li>
              <strong>Write</strong> a reducer function that, for a given state and action, returns
              the next state — typically a <code>switch</code> over{" "}
              <code>action.type</code>.
            </li>
            <li>
              <strong>Use</strong> the reducer from the component via{" "}
              <code>useReducer(reducer, initialState)</code>, throwing away the individual{" "}
              <code>useState</code> calls it replaces.
            </li>
          </ul>

          <h3 className="theory-subhead">Key rules</h3>
          <ul>
            <li>
              A discriminated-union action type (<code>{`{ type: "fetch" } | { type: "succeed"; data: string } | ...`}</code>
              ) lets TypeScript narrow each <code>switch</code> case and flag a missing case with an
              exhaustiveness check.
            </li>
            <li>
              Reducers run during rendering, so they must stay <strong>pure</strong>: no mutating
              the <code>state</code> argument, no side effects, no <code>Date.now()</code>/
              <code>Math.random()</code>. In Strict Mode, React calls the reducer (and initializer)
              twice on purpose to help surface impurities — the result of one call is discarded.
            </li>
            <li>
              react.dev's own recommendation: reach for a reducer "if you often encounter bugs due
              to incorrect state updates in some component, and want to introduce more structure to
              its code" — not a rule to apply to every component with more than one{" "}
              <code>useState</code>.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-buttons" role="tablist" aria-label="Implementation">
            <button
              type="button"
              onClick={() => switchMode("loose")}
              data-active={mode === "loose"}
              aria-pressed={mode === "loose"}
            >
              Loose useState (buggy)
            </button>
            <button
              type="button"
              onClick={() => switchMode("reducer")}
              data-active={mode === "reducer"}
              aria-pressed={mode === "reducer"}
            >
              useReducer (fixed)
            </button>
          </div>

          <p className="demo-count">
            status: <strong>{status}</strong>
            <br />
            data: <strong>{data === null ? "null" : `"${data}"`}</strong>
            <br />
            error: <strong>{error === null ? "null" : `"${error}"`}</strong>
          </p>

          {invalidReason && (
            <p className="explain-outcome buggy" role="alert">
              ⚠ Invalid combination: {invalidReason}
            </p>
          )}

          <div className="demo-buttons">
            {(Object.keys(actions) as ActionId[]).map((id) => (
              <button key={id} onClick={() => run(id)} data-active={activeId === id}>
                {actions[id].label}
              </button>
            ))}
          </div>

          <p className="explain-placeholder" style={{ marginTop: "0.75rem" }}>
            Try Fail then Succeed (or Fail then Fetch) in <strong>Loose useState</strong> — the state
            printed above becomes internally inconsistent. Switch to{" "}
            <strong>useReducer</strong> and repeat the same sequence: the invalid combination never
            appears.
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
              Click a button above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
