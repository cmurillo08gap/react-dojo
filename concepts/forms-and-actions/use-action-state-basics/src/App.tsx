import { useActionState, useRef, useState, type FormEvent } from "react";

/**
 * Concept: useActionState basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last thing the demo did,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo is a signup-style username field with a simulated async,
 * server-like validation ("username already taken"). Two implementations
 * of the SAME check are shown side by side:
 *
 *   - "useActionState" — one hook call. The action function receives
 *     (previousState, formData), returns the next state directly, and the
 *     hook hands back a pending flag for free. Wiring it to
 *     <form action={formAction}> means React drives the whole submit →
 *     pending → settle cycle; there's no manual event.preventDefault() or
 *     manual pending bookkeeping at all.
 *   - "Manual useState (pre-19)" — the same validation logic, but the
 *     component has to own value/status/message/pending itself across
 *     three-plus useState calls and a hand-written async onSubmit handler
 *     that has to remember to flip "pending" back off in every branch,
 *     including a race guard for out-of-order responses.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

type Mode = "actionState" | "manual";

type Phase = "idle" | "pending" | "success" | "error";

interface PhaseInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Shared "server" — both implementations call the exact same check, so the
// only thing that differs between modes is how the component wires state
// and pending status around it, not the validation rules themselves.
const TAKEN_USERNAMES = ["admin", "root", "taken", "test"];
const SIMULATED_DELAY_MS = 900;

async function checkUsernameOnServer(username: string): Promise<{ ok: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { ok: false, message: "Username must be at least 3 characters." };
  }
  if (TAKEN_USERNAMES.includes(trimmed.toLowerCase())) {
    return { ok: false, message: `"${trimmed}" is already taken.` };
  }
  return { ok: true, message: `"${trimmed}" is available — account created.` };
}

// --- useActionState version -----------------------------------------------
//
// The action receives (previousState, formData) — previousState first,
// formData second — and its RETURN VALUE becomes the new state. There is
// no separate setter to call and no separate "pending" flag to manage:
// useActionState derives isPending from whether this action is currently
// in flight.

interface SignupState {
  status: "idle" | "success" | "error";
  message: string | null;
}

const initialSignupState: SignupState = { status: "idle", message: null };

async function signupAction(_previousState: SignupState, formData: FormData): Promise<SignupState> {
  const username = String(formData.get("username") ?? "");
  const result = await checkUsernameOnServer(username);
  return result.ok
    ? { status: "success", message: result.message }
    : { status: "error", message: result.message };
}

// Keep these snippets in sync with the actual code below — they're display
// copies, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const ACTION_STATE_PHASES: Record<Exclude<Phase, "idle">, PhaseInfo> = {
  pending: {
    label: "Submitting…",
    code: `const [state, formAction, isPending] = useActionState(
  signupAction,
  initialSignupState,
);

// <form action={formAction}>: submitting the form calls signupAction
// automatically. isPending flips true the instant the action starts —
// no setIsSubmitting(true) to write yourself.
<button disabled={isPending}>{isPending ? "Checking…" : "Sign up"}</button>`,
    explanation:
      "React called signupAction(previousState, formData) the moment the form was submitted, " +
      "and isPending became true for the duration — the button disables itself with no " +
      "handler-written flag.",
    outcome: "correct",
  },
  success: {
    label: "Available",
    code: `async function signupAction(previousState, formData) {
  const username = formData.get("username");
  const result = await checkUsernameOnServer(username);
  // The return value BECOMES the new state — no setState call at all.
  return { status: "success", message: result.message };
}`,
    explanation:
      "signupAction's return value is what state becomes on the next render. Returning a " +
      'fresh { status: "success", message } object is the entire update — useActionState ' +
      "re-renders the component with it automatically.",
    outcome: "correct",
  },
  error: {
    label: "Taken / invalid",
    code: `async function signupAction(previousState, formData) {
  const username = formData.get("username");
  const result = await checkUsernameOnServer(username);
  if (!result.ok) {
    // A KNOWN, expected failure — return it as state, don't throw.
    return { status: "error", message: result.message };
  }
  return { status: "success", message: result.message };
}`,
    explanation:
      "A validation failure (username too short, or already taken) is an expected outcome, so " +
      "it's returned as state and rendered inline — react.dev reserves throwing for unknown " +
      "errors that should hit the nearest Error Boundary instead.",
    outcome: "correct",
  },
};

// --- Manual useState version (pre-19 equivalent) --------------------------
//
// The same checkUsernameOnServer call, but every piece useActionState gave
// us for free now has to be modeled and kept in sync by hand: the pending
// flag, the resulting message, AND a guard against an out-of-order
// response overwriting a newer one (useActionState's queuing handles this
// internally; a bare async handler does not, unless you write the guard).

const MANUAL_PHASES: Record<Exclude<Phase, "idle">, PhaseInfo> = {
  pending: {
    label: "Submitting…",
    code: `const [pending, setPending] = useState(false);
const [message, setMessage] = useState<string | null>(null);
const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setPending(true); // must remember this on every entry point
  const result = await checkUsernameOnServer(username);
  // ...
}`,
    explanation:
      'preventDefault() has to be called manually (a plain <form onSubmit> reloads the page ' +
      "otherwise), and pending has to be flipped on by hand before the await — forgetting this " +
      "line leaves the button enabled during the request.",
  },
  success: {
    label: "Available",
    code: `const result = await checkUsernameOnServer(username);
setPending(false);       // easy to forget in a branch
setStatus("success");
setMessage(result.message);`,
    explanation:
      "Three separate setter calls have to move together on every successful path. Missing " +
      'setPending(false) here would leave the UI stuck showing "Checking…" forever.',
  },
  error: {
    label: "Taken / invalid",
    code: `if (!result.ok) {
  setPending(false);      // easy to forget in THIS branch too
  setStatus("error");
  setMessage(result.message);
  return;
}`,
    explanation:
      "The success and error branches each have to remember the same pending/status/message " +
      "trio independently — useActionState collapses this into one returned object, so there's " +
      "no second branch to keep in sync.",
    outcome: "buggy",
  },
};

export function App() {
  const [mode, setMode] = useState<Mode>("actionState");

  // --- useActionState wiring ---
  // Exact signature: useActionState(action, initialState, permalink?)
  // Returns [state, formAction, isPending] — formAction is what you pass
  // straight to <form action={...}>.
  const [signupState, formAction, isSignupPending] = useActionState(signupAction, initialSignupState);

  // --- manual useState wiring (contrast) ---
  const [manualValue, setManualValue] = useState("");
  const [manualStatus, setManualStatus] = useState<"idle" | "success" | "error">("idle");
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [manualPending, setManualPending] = useState(false);
  // Guards against an earlier, slower submission overwriting a newer one —
  // useActionState's internal queuing makes this unnecessary in that version.
  const latestSubmission = useRef(0);

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submissionId = ++latestSubmission.current;
    setManualPending(true);
    const result = await checkUsernameOnServer(manualValue);
    if (submissionId !== latestSubmission.current) return; // a newer submit already landed
    setManualPending(false);
    setManualStatus(result.ok ? "success" : "error");
    setManualMessage(result.message);
  }

  function switchMode(next: Mode) {
    setMode(next);
  }

  const activePhase: Phase =
    mode === "actionState"
      ? isSignupPending
        ? "pending"
        : signupState.status
      : manualPending
        ? "pending"
        : manualStatus;

  const phases = mode === "actionState" ? ACTION_STATE_PHASES : MANUAL_PHASES;
  const active = activePhase === "idle" ? null : phases[activePhase];

  const message = mode === "actionState" ? signupState.message : manualMessage;
  const pending = mode === "actionState" ? isSignupPending : manualPending;
  const status = mode === "actionState" ? signupState.status : manualStatus;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useActionState basics</h1>
        <p>
          A form that validates against a server usually needs a value, a pending flag, and an
          error/success message, all updated together across an async round trip.{" "}
          <code>useActionState</code> wraps that trio into one hook: the action function you write
          receives the previous state and the submitted <code>FormData</code>, and whatever it{" "}
          <em>returns</em> becomes the new state — pending tracking included.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Declaring an action-backed state</h3>
          <p>
            <code>useActionState</code> is a hook <strong>built into React 19</strong> (imported
            from <code>"react"</code>) for state that changes as the result of a form/Action
            submission.
          </p>
          <pre>
            <code>const [state, formAction, isPending] = useActionState(fn, initialState, permalink?);</code>
          </pre>
          <ul>
            <li>
              <code>fn</code> — the action function you write, called as{" "}
              <code>fn(previousState, formData)</code> — previous state first, the submitted{" "}
              <code>FormData</code> second. Its <strong>return value becomes the new state</strong>{" "}
              on the next render, just like a reducer.
            </li>
            <li>
              <code>initialState</code> — the value <code>state</code> holds before any submission
              has happened.
            </li>
            <li>
              <code>permalink</code> — optional; a URL to fall back to for progressive enhancement
              on pages that can be server-rendered before hydration. Not needed in a
              client-only app like this one.
            </li>
            <li>
              <code>state</code> — the current state for <em>this</em> render, matching{" "}
              <code>initialState</code> until <code>fn</code> resolves for the first time.
            </li>
            <li>
              <code>formAction</code> — pass this straight to{" "}
              <code>{`<form action={formAction}>`}</code>; submitting that form is what triggers{" "}
              <code>fn</code>.
            </li>
            <li>
              <code>isPending</code> — <code>true</code> while a dispatched action for this hook is
              in flight. No separate <code>useState</code> needed to track it.
            </li>
          </ul>

          <h3 className="theory-subhead">Handling errors</h3>
          <ul>
            <li>
              A <strong>known, expected</strong> failure (bad input, "already taken") is returned
              as part of the state and rendered inline — the pattern this demo uses.
            </li>
            <li>
              An <strong>unknown</strong> error (a genuine bug) should be thrown instead; React
              cancels queued actions and surfaces it to the nearest Error Boundary rather than
              silently swallowing it as state.
            </li>
          </ul>

          <h3 className="theory-subhead">Key rules</h3>
          <ul>
            <li>
              Wiring <code>formAction</code> to a <code>{`<form action={...}>`}</code> is enough —
              React calls it on submit. Calling <code>formAction</code> yourself outside of a form
              (or dispatching manually) needs <code>startTransition</code> for{" "}
              <code>isPending</code> to update correctly.
            </li>
            <li>
              Because the whole next state comes back from one function call, there's no way to
              update <code>message</code> without also deciding <code>status</code> in the same
              object — unlike separate setters, which can drift out of sync with each other.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-buttons" role="tablist" aria-label="Implementation">
            <button
              type="button"
              onClick={() => switchMode("actionState")}
              data-active={mode === "actionState"}
              aria-pressed={mode === "actionState"}
            >
              useActionState
            </button>
            <button
              type="button"
              onClick={() => switchMode("manual")}
              data-active={mode === "manual"}
              aria-pressed={mode === "manual"}
            >
              Manual useState (pre-19)
            </button>
          </div>

          <p className="explain-placeholder" style={{ marginTop: "0.6rem" }}>
            Try <strong>admin</strong>, <strong>root</strong>, <strong>taken</strong>, or{" "}
            <strong>test</strong> (already taken), <strong>ab</strong> (too short), or anything
            else (available). Each submit takes ~{SIMULATED_DELAY_MS}ms to simulate a server
            round trip.
          </p>

          {mode === "actionState" ? (
            <form action={formAction} className="signup-form">
              <label htmlFor="username-action">Username</label>
              <input
                id="username-action"
                name="username"
                placeholder="pick a username"
                disabled={isSignupPending}
                autoComplete="off"
              />
              <button type="submit" disabled={isSignupPending}>
                {isSignupPending ? "Checking…" : "Sign up"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="signup-form">
              <label htmlFor="username-manual">Username</label>
              <input
                id="username-manual"
                name="username"
                placeholder="pick a username"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                disabled={manualPending}
                autoComplete="off"
              />
              <button type="submit" disabled={manualPending}>
                {manualPending ? "Checking…" : "Sign up"}
              </button>
            </form>
          )}

          <p className="demo-count" role="status" aria-live="polite">
            pending: <strong>{String(pending)}</strong>
            <br />
            status: <strong>{status}</strong>
          </p>

          {message && (
            <p className={`explain-outcome ${status === "error" ? "buggy" : "correct"}`} role="alert">
              {status === "error" ? "⚠ " : "✓ "}
              {message}
            </p>
          )}
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <h3 className="theory-subhead">{active.label}</h3>
              <p>
                {active.outcome && (
                  <span className={`explain-outcome ${active.outcome}`}>
                    {active.outcome === "buggy" ? "⚠ Note: " : "✓ "}
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
              Submit the form above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
