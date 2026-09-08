import { useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";

/**
 * Concept: Form Actions basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last thing the demo did,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo is a "subscribe with your email" mini-form with a simulated
 * async server call, implemented two ways:
 *
 *   - "onSubmit (pre-19)" — a plain <form onSubmit>. The component has to
 *     call event.preventDefault() itself, own an isPending useState it
 *     flips on/off around the request (including in a finally block so it
 *     never gets stuck), and manually reset the controlled input's value
 *     on success.
 *   - "<form action> (React 19)" — the SAME subscribeOnServer call, wired
 *     to <form action={subscribeAction}>. There's no preventDefault (an
 *     action prop already runs inside a Transition), no isPending useState
 *     anywhere in this file (the submit button reads it via
 *     useFormStatus() instead), and no manual input reset (the email
 *     field is uncontrolled, and React resets every uncontrolled field in
 *     the form automatically once the action resolves without throwing).
 *
 * One thing React 19 does NOT remove: a bare action's return value isn't
 * captured anywhere, so turning a caught error into an on-screen message
 * still needs a piece of state you write yourself — that gap is exactly
 * what useActionState (see forms-and-actions/use-action-state-basics)
 * fills.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

type Mode = "onSubmit" | "action";

type Phase = "idle" | "pending" | "success" | "error";

interface PhaseInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

interface SubscribeResult {
  status: "success" | "error";
  message: string;
}

// Shared "server" — both implementations call the exact same check, so the
// only thing that differs between modes is how the component wires
// pending/reset/error handling around it, not the validation rules
// themselves.
const TAKEN_EMAILS = ["taken@example.com", "test@example.com"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIMULATED_DELAY_MS = 800;

async function subscribeOnServer(email: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  const trimmed = email.trim();
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw new Error(`"${trimmed}" doesn't look like a valid email address.`);
  }
  if (TAKEN_EMAILS.includes(trimmed.toLowerCase())) {
    throw new Error(`"${trimmed}" is already subscribed.`);
  }
  return `Subscribed "${trimmed}" — check your inbox to confirm.`;
}

// --- React 19 version: a bare <form action={fn}> ---------------------------
//
// subscribeAction receives the submitted FormData directly — no event
// object, no preventDefault(). Passing a function to a <form>'s `action`
// prop makes React run it inside a Transition for you, and (per
// react.dev) reset every UNCONTROLLED field in the form once it resolves
// without throwing. Nothing here calls a reset function; the email input
// simply has no `value` prop.

// NewSubmitButton must be its own component nested INSIDE the <form> —
// useFormStatus() only reports the status of the nearest parent <form>,
// and reading it from the same component that renders that <form> always
// returns the default (non-pending) status. This is the only hook this
// file needs for "isPending"; there is no pending useState anywhere here.
function NewSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Subscribing…" : "Subscribe"}
    </button>
  );
}

// Keep these snippets in sync with the actual code below — they're display
// copies, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const NEW_PHASES: Record<Exclude<Phase, "idle">, PhaseInfo> = {
  pending: {
    label: "Submitting…",
    code: `<form action={subscribeAction}>
  <input name="email" placeholder="you@example.com" />
  <NewSubmitButton />
</form>

// NewSubmitButton reads pending from useFormStatus() — a hook, not a
// useState this component owns. No event.preventDefault() either: an
// action prop already runs inside a Transition.
function NewSubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Subscribing…" : "Subscribe"}</button>;
}`,
    explanation:
      "Submitting the form called subscribeAction(formData) directly. useFormStatus() reported " +
      "pending as true for the duration, with no isPending useState written anywhere in this file.",
    outcome: "correct",
  },
  success: {
    label: "Subscribed",
    code: `async function subscribeAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const message = await subscribeOnServer(email);
  setNewResult({ status: "success", message });
  // No setEmail("") anywhere: the <input> has no "value" prop, so it's
  // uncontrolled, and React resets every uncontrolled field in this
  // form automatically now that subscribeAction resolved successfully.
}`,
    explanation:
      "React only resets a form's uncontrolled fields after its action resolves without " +
      "throwing — watch the email field above clear itself with no reset call anywhere in " +
      "this file.",
    outcome: "correct",
  },
  error: {
    label: "Rejected",
    code: `async function subscribeAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  try {
    const message = await subscribeOnServer(email);
    setNewResult({ status: "success", message });
  } catch (err) {
    // Caught here so the message renders inline. Left uncaught, this
    // throw would instead propagate to the nearest Error Boundary —
    // react.dev's documented way to handle a form action's errors.
    setNewResult({ status: "error", message: err instanceof Error ? err.message : "Failed." });
  }
}`,
    explanation:
      "A bare action's return value isn't captured as state anywhere (unlike useActionState's), " +
      "so turning this caught error into an on-screen message still needed a useState this " +
      'component owns. Note the field was NOT reset — only a *successful* action resets uncontrolled ' +
      "fields, so the invalid address stays put to edit.",
  },
};

// --- Pre-19 equivalent: a plain <form onSubmit> -----------------------------
//
// Every piece the action version above got automatically now has to be
// modeled by hand: preventDefault(), a pending flag, and resetting the
// input's value on success.

const OLD_PHASES: Record<Exclude<Phase, "idle">, PhaseInfo> = {
  pending: {
    label: "Submitting…",
    code: `async function handleOldSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); // manual — a plain <form onSubmit> reloads the page otherwise
  setOldPending(true);    // manual — nothing tracks this for you
  setOldResult(null);
  try {
    // ...
  }
}`,
    explanation:
      "preventDefault() has to be called by hand — without it a plain <form onSubmit> reloads " +
      "the page on every submit. isPending is a useState this component owns and must remember " +
      "to flip on before the request.",
  },
  success: {
    label: "Subscribed",
    code: `const message = await subscribeOnServer(oldEmail);
setOldResult({ status: "success", message });
setOldEmail("");        // manual reset — forgetting this line leaves the
                         // submitted address sitting in the field`,
    explanation:
      "Nothing resets the input automatically because it's controlled (value={oldEmail}) — the " +
      "component has to clear its own state to clear what's on screen.",
    outcome: "correct",
  },
  error: {
    label: "Rejected",
    code: `} catch (err) {
  setOldResult({ status: "error", message: err instanceof Error ? err.message : "Failed." });
} finally {
  setOldPending(false); // manual — forgetting this in ANY branch leaves
                         // the button disabled forever
}`,
    explanation:
      "The pending flag has to be turned back off in a finally block reached from every branch " +
      "— success, expected validation failure, or an unexpected throw. Miss one path and the " +
      'button is stuck reading "Subscribing…".',
    outcome: "buggy",
  },
};

export function App() {
  const [mode, setMode] = useState<Mode>("action");

  // --- onSubmit wiring (contrast) ---
  const [oldEmail, setOldEmail] = useState("");
  const [oldPending, setOldPending] = useState(false);
  const [oldResult, setOldResult] = useState<SubscribeResult | null>(null);

  async function handleOldSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOldPending(true);
    setOldResult(null);
    try {
      const message = await subscribeOnServer(oldEmail);
      setOldResult({ status: "success", message });
      setOldEmail("");
    } catch (err) {
      setOldResult({ status: "error", message: err instanceof Error ? err.message : "Failed." });
    } finally {
      setOldPending(false);
    }
  }

  // --- <form action> wiring ---
  const [newResult, setNewResult] = useState<SubscribeResult | null>(null);
  // NOTE: this state exists ONLY to pick which "what just happened" panel
  // to show below — it does not drive the submit button's disabled state
  // or label. That comes from useFormStatus() inside NewSubmitButton,
  // which needs no useState of its own for pending.
  const [newPhaseHint, setNewPhaseHint] = useState<Phase>("idle");

  async function subscribeAction(formData: FormData) {
    setNewPhaseHint("pending");
    const email = String(formData.get("email") ?? "");
    try {
      const message = await subscribeOnServer(email);
      setNewResult({ status: "success", message });
      setNewPhaseHint("success");
    } catch (err) {
      setNewResult({ status: "error", message: err instanceof Error ? err.message : "Failed." });
      setNewPhaseHint("error");
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
  }

  const activePhase: Phase = mode === "onSubmit" ? (oldPending ? "pending" : (oldResult?.status ?? "idle")) : newPhaseHint;

  const phases = mode === "onSubmit" ? OLD_PHASES : NEW_PHASES;
  const active = activePhase === "idle" ? null : phases[activePhase];

  const result = mode === "onSubmit" ? oldResult : newResult;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Form Actions basics</h1>
        <p>
          A plain <code>{`<form onSubmit>`}</code> needs manual{" "}
          <code>event.preventDefault()</code>, a hand-written pending flag, and a manual value
          reset on success. React 19 lets a <code>{`<form>`}</code>'s <code>action</code> prop be a
          function instead: React calls it with the submitted <code>FormData</code>, runs it inside
          a Transition (so no <code>preventDefault()</code>), and resets the form's uncontrolled
          fields for you once it resolves successfully.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">A function as a form action</h3>
          <pre>
            <code>{`<form action={someFunction}>`}</code>
          </pre>
          <ul>
            <li>
              Passing a <strong>function</strong> to <code>action</code> (instead of the plain HTML
              behavior of passing a URL string) makes React call that function with the submitted{" "}
              <code>FormData</code> as its only argument — no event object.
            </li>
            <li>
              react.dev, on the <code>action</code> prop: "the function passed to{" "}
              <code>action</code> may be async and will be called with a single argument
              containing the form data of the submitted form." The submission runs inside a{" "}
              <strong>Transition</strong>, which is why <code>e.preventDefault()</code> is
              unnecessary — there's no page-reload default to prevent in the first place.
            </li>
            <li>
              Caveat: when <code>action</code> is a function, the form always submits with{" "}
              <code>POST</code>, regardless of any <code>method</code> prop.
            </li>
          </ul>

          <h3 className="theory-subhead">What React does for you automatically</h3>
          <ul>
            <li>
              <strong>Form reset</strong> — per react.dev: "After the action function successfully
              completes, all uncontrolled field elements within the form are automatically reset."
              An input needs no <code>value</code> prop (i.e. it must be uncontrolled) for this to
              apply — a controlled input's value is still whatever its own state says.
            </li>
            <li>
              <strong>Pending tracking</strong> — read via <code>useFormStatus()</code>, imported
              from <code>"react-dom"</code>, called from a component <em>nested inside</em> the{" "}
              <code>{`<form>`}</code> (not the component that renders the <code>{`<form>`}</code>{" "}
              itself — calling it there always reports the non-pending default). It returns{" "}
              <code>{`{ pending, data, method, action }`}</code>; this demo only needs{" "}
              <code>pending</code>. A deeper dive on the nested-component requirement lives in{" "}
              <em>use-form-status-basics</em>.
            </li>
          </ul>

          <h3 className="theory-subhead">What it does NOT do for you</h3>
          <ul>
            <li>
              A bare action's <strong>return value isn't captured</strong> anywhere — unlike{" "}
              <code>useActionState</code>, where the action's return value becomes the next state.
              Turning a caught error into an on-screen message still needs a <code>useState</code>{" "}
              you write yourself, which is exactly the gap <em>use-action-state-basics</em> fills.
            </li>
            <li>
              If the action <strong>throws</strong> and nothing catches it, react.dev's documented
              handling is to wrap the <code>{`<form>`}</code> in an Error Boundary and let its
              fallback UI render — React does not silently swallow the error or reset the form on a
              failed submission.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-buttons" role="tablist" aria-label="Implementation">
            <button
              type="button"
              onClick={() => switchMode("action")}
              data-active={mode === "action"}
              aria-pressed={mode === "action"}
            >
              {"<form action> (React 19)"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("onSubmit")}
              data-active={mode === "onSubmit"}
              aria-pressed={mode === "onSubmit"}
            >
              onSubmit (pre-19)
            </button>
          </div>

          <p className="explain-placeholder" style={{ marginTop: "0.6rem" }}>
            Try <strong>taken@example.com</strong> or <strong>test@example.com</strong> (already
            subscribed), <strong>not-an-email</strong> (invalid), or anything else (success). Each
            submit takes ~{SIMULATED_DELAY_MS}ms to simulate a server round trip.
          </p>

          {mode === "action" ? (
            <form action={subscribeAction} className="signup-form">
              <label htmlFor="email-action">Email</label>
              <input id="email-action" name="email" type="text" placeholder="you@example.com" autoComplete="off" />
              <NewSubmitButton />
            </form>
          ) : (
            <form onSubmit={handleOldSubmit} className="signup-form">
              <label htmlFor="email-onsubmit">Email</label>
              <input
                id="email-onsubmit"
                name="email"
                type="text"
                placeholder="you@example.com"
                value={oldEmail}
                onChange={(event) => setOldEmail(event.target.value)}
                disabled={oldPending}
                autoComplete="off"
              />
              <button type="submit" disabled={oldPending}>
                {oldPending ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}

          {result && (
            <p className={`explain-outcome ${result.status === "error" ? "buggy" : "correct"}`} role="alert">
              {result.status === "error" ? "⚠ " : "✓ "}
              {result.message}
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
