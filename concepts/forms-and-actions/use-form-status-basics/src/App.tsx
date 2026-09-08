import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Concept: useFormStatus basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last thing the demo did,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo is a "Save profile" form whose submit button is nested THREE
 * components deep: <Form> -> <ButtonGroup> -> <SubmitButton>. Three tabs
 * show the same form wired three different ways:
 *
 *   - "Prop drilling" — the top-level <Form> owns a `pending` useState set
 *     inside the action function, and threads it down through ButtonGroup
 *     as a prop it never otherwise needs, purely to hand it to SubmitButton.
 *   - "useFormStatus (child)" — SubmitButton calls useFormStatus() directly.
 *     ButtonGroup passes zero props through for this at all.
 *   - "useFormStatus (gotcha)" — useFormStatus() is called in the SAME
 *     component that renders the <form>, which always returns
 *     pending: false — the hook only reports on a form the calling
 *     component is nested INSIDE, never one it renders itself.
 *
 * `useFormStatus` is imported from "react-dom", not "react".
 *
 * See ./README.md for the full write-up and discussion questions.
 */

type Mode = "propDrilling" | "hookInChild" | "gotcha";
type Phase = "idle" | "pending" | "success" | "error";

interface PhaseInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

const SIMULATED_DELAY_MS = 800;

async function saveProfile(name: string): Promise<{ ok: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, message: "Name is required." };
  }
  return { ok: true, message: `Saved "${trimmed}".` };
}

// --- "Prop drilling" version -------------------------------------------
//
// Nothing in ButtonGroup itself needs `pending` — it exists purely to pass
// it further down to SubmitButton. Every intermediate layer between the
// state and the component that needs it has to know about the prop.

const DRILLING_PHASES: Record<Exclude<Phase, "idle">, PhaseInfo> = {
  pending: {
    label: "Saving…",
    code: `function Form() {
  const [pending, setPending] = useState(false);
  async function action(formData: FormData) {
    setPending(true);
    // ...
  }
  return (
    <form action={action}>
      <ButtonGroup pending={pending} />
    </form>
  );
}

function ButtonGroup({ pending }: { pending: boolean }) {
  // ButtonGroup has no use for "pending" itself — it only exists to
  // forward it one level further down.
  return <div className="button-group"><SubmitButton pending={pending} /></div>;
}`,
    explanation:
      "pending lives in Form's own useState, so ButtonGroup — which never reads it — still has " +
      "to declare and forward a prop it has no other use for, just so SubmitButton two levels " +
      "down can see it.",
  },
  success: {
    label: "Saved",
    code: `setPending(false);
setMessage(result.message);
// Every consumer of "pending" three components away has to be re-wired
// by hand if SubmitButton ever moves to a different nesting depth.`,
    explanation:
      "The prop chain (Form → ButtonGroup → SubmitButton) is fixed at write time. Moving " +
      "SubmitButton one level deeper means adding the prop to every new intermediate component.",
    outcome: "correct",
  },
  error: {
    label: "Name required",
    code: `const result = await saveProfile(name);
setPending(false);   // has to be reset in this branch too
setMessage(result.message);`,
    explanation:
      "The pending flag has to be flipped back off independently in both the success and error " +
      "branches of the action function — miss one and SubmitButton stays disabled.",
    outcome: "buggy",
  },
};

function DrilledForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  async function action(formData: FormData) {
    setPending(true);
    setPhase("pending");
    const name = String(formData.get("name") ?? "");
    const result = await saveProfile(name);
    setPending(false);
    setMessage(result.message);
    setPhase(result.ok ? "success" : "error");
  }

  return (
    <FormShell action={action} pending={pending} message={message} phase={phase} phases={DRILLING_PHASES}>
      <DrilledButtonGroup pending={pending} />
    </FormShell>
  );
}

function DrilledButtonGroup({ pending }: { pending: boolean }) {
  // This component has no use for "pending" beyond forwarding it — that's
  // the prop-drilling cost the useFormStatus version below has none of.
  return (
    <div className="button-group">
      <DrilledSubmitButton pending={pending} />
    </div>
  );
}

function DrilledSubmitButton({ pending }: { pending: boolean }) {
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

// --- "useFormStatus (child)" version -------------------------------------
//
// SubmitButton reads its own status directly. ButtonGroup passes through
// zero props related to submission state at all.

const HOOK_PHASES: Record<Exclude<Phase, "idle">, PhaseInfo> = {
  pending: {
    label: "Saving…",
    code: `function Form() {
  async function action(formData: FormData) { /* ... */ }
  return (
    <form action={action}>
      <ButtonGroup />
    </form>
  );
}

function ButtonGroup() {
  // Zero props related to submission status — SubmitButton gets its own.
  return <div className="button-group"><SubmitButton /></div>;
}

function SubmitButton() {
  const { pending } = useFormStatus(); // from "react-dom"
  return <button disabled={pending}>{pending ? "Saving…" : "Save"}</button>;
}`,
    explanation:
      "SubmitButton called useFormStatus() and got pending: true the instant the form above it " +
      "started submitting — ButtonGroup never declared or touched a pending prop at all.",
    outcome: "correct",
  },
  success: {
    label: "Saved",
    code: `const { pending, data } = useFormStatus();
// data is the FormData currently being submitted, or null when idle —
// available here with no prop threading either.`,
    explanation:
      "useFormStatus derives its value from the nearest enclosing <form> automatically — moving " +
      "SubmitButton to a different nesting depth needs no code changes anywhere in between.",
    outcome: "correct",
  },
  error: {
    label: "Name required",
    code: `// SubmitButton doesn't need to know WHY the form failed — it only
// cares whether one is in flight. pending flips back to false as soon
// as the action's promise settles, success or not.`,
    explanation:
      "pending is derived state, not something any component set and forgot to unset — there's " +
      "no branch where it can be left stuck on.",
    outcome: "correct",
  },
};

function HookForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  async function action(formData: FormData) {
    setPhase("pending");
    const name = String(formData.get("name") ?? "");
    const result = await saveProfile(name);
    setMessage(result.message);
    setPhase(result.ok ? "success" : "error");
  }

  return (
    <FormShell action={action} pending={phase === "pending"} message={message} phase={phase} phases={HOOK_PHASES}>
      <HookButtonGroup />
    </FormShell>
  );
}

function HookButtonGroup() {
  // No pending prop anywhere in this component — compare to
  // DrilledButtonGroup above.
  return (
    <div className="button-group">
      <HookSubmitButton />
    </div>
  );
}

function HookSubmitButton() {
  // useFormStatus must be called from a component rendered INSIDE the
  // <form> it's reporting on — see the "gotcha" tab for what happens if
  // it's called in the form-rendering component itself instead.
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

// --- "useFormStatus (gotcha)" version -------------------------------------
//
// useFormStatus is called in the SAME component that renders the <form>.
// react.dev is explicit that this only returns status for a PARENT form —
// never one rendered in the same component or in child components — so
// `pending` here is always false, no matter what the form is doing.

function GotchaForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  // BUG: this component renders the <form> below, so react-dom's own docs
  // say this call cannot see that form's status — pending is always false.
  const { pending } = useFormStatus();

  async function action(formData: FormData) {
    setPhase("pending");
    const name = String(formData.get("name") ?? "");
    const result = await saveProfile(name);
    setMessage(result.message);
    setPhase(result.ok ? "success" : "error");
  }

  return (
    <div>
      <form action={action} className="save-form">
        <label htmlFor="name-gotcha">Name</label>
        <input id="name-gotcha" name="name" placeholder="Ada Lovelace" autoComplete="off" />
        <button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      <p className="demo-count" role="status" aria-live="polite">
        pending (read in the form-rendering component): <strong>{String(pending)}</strong>
        <br />
        actual submission phase: <strong>{phase}</strong>
      </p>
      {message && (
        <p className={`explain-outcome ${phase === "error" ? "buggy" : "correct"}`} role="alert">
          {phase === "error" ? "⚠ " : "✓ "}
          {message}
        </p>
      )}
      <div className="explain-body">
        <p>
          <span className="explain-outcome buggy">⚠ Note: </span>
          Watch <code>pending</code> above while submitting — it never leaves <code>false</code>,
          even while the button is visibly disabled by the <code>phase</code> state tracked
          separately. <code>useFormStatus</code> only reports on a <code>{`<form>`}</code> the
          calling component is nested <em>inside</em>; a component that renders the form itself
          is not "inside" it.
        </p>
        <pre>
          <code>{`function Form() {
  // BUG: Form renders the <form> below, so useFormStatus here can't
  // see it — react-dom's docs call this out explicitly. pending is
  // always false, regardless of what the form is actually doing.
  const { pending } = useFormStatus();
  return <form action={action}>...</form>;
}`}</code>
        </pre>
      </div>
    </div>
  );
}

// --- Shared form shell (drilling + hook modes only) -------------------------

function FormShell({
  action,
  pending,
  message,
  phase,
  phases,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  pending: boolean;
  message: string | null;
  phase: Phase;
  phases: Record<Exclude<Phase, "idle">, PhaseInfo>;
  children: ReactNode;
}) {
  const active = phase === "idle" ? null : phases[phase];

  return (
    <div>
      <form action={action} className="save-form">
        <label htmlFor="name-input">Name</label>
        <input id="name-input" name="name" placeholder="Ada Lovelace" disabled={pending} autoComplete="off" />
        {children}
      </form>
      <p className="demo-count" role="status" aria-live="polite">
        pending: <strong>{String(pending)}</strong>
      </p>
      {message && (
        <p className={`explain-outcome ${phase === "error" ? "buggy" : "correct"}`} role="alert">
          {phase === "error" ? "⚠ " : "✓ "}
          {message}
        </p>
      )}
      <div className="explain-inline">
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
          <p className="explain-placeholder">Submit the form above to see the exact code that ran.</p>
        )}
      </div>
    </div>
  );
}

export function App() {
  const [mode, setMode] = useState<Mode>("propDrilling");

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useFormStatus basics</h1>
        <p>
          A submit button nested a few components deep inside a <code>{`<form>`}</code> often needs
          to know "is this form submitting" — <code>useFormStatus</code> reads that directly, with
          zero props threaded through every component in between.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Reading form status from a nested component</h3>
          <pre>
            <code>{`import { useFormStatus } from "react-dom";

const { pending, data, method, action } = useFormStatus();`}</code>
          </pre>
          <p>
            Note the import — <code>useFormStatus</code> comes from{" "}
            <code>"react-dom"</code>, not <code>"react"</code>.
          </p>
          <ul>
            <li>
              <code>pending</code> — <code>true</code> while the parent <code>{`<form>`}</code> is
              submitting.
            </li>
            <li>
              <code>data</code> — the <code>FormData</code> being submitted, or <code>null</code>{" "}
              when there's no active submission.
            </li>
            <li>
              <code>method</code> — <code>"get"</code> or <code>"post"</code>, the parent form's
              submission method.
            </li>
            <li>
              <code>action</code> — a reference to the function passed to the parent form's{" "}
              <code>action</code> prop, or <code>null</code>.
            </li>
          </ul>

          <h3 className="theory-subhead">The rule that matters most</h3>
          <p>
            <code>useFormStatus</code> only returns status for a <strong>parent</strong>{" "}
            <code>{`<form>`}</code> — never one rendered by the same component calling the hook, and
            never one rendered by a child. Call it from a component <strong>nested inside</strong>{" "}
            the <code>{`<form>`}</code> whose status you want.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-buttons" role="tablist" aria-label="Implementation">
            <button
              type="button"
              onClick={() => setMode("propDrilling")}
              data-active={mode === "propDrilling"}
              aria-pressed={mode === "propDrilling"}
            >
              Prop drilling
            </button>
            <button
              type="button"
              onClick={() => setMode("hookInChild")}
              data-active={mode === "hookInChild"}
              aria-pressed={mode === "hookInChild"}
            >
              useFormStatus (child)
            </button>
            <button
              type="button"
              onClick={() => setMode("gotcha")}
              data-active={mode === "gotcha"}
              aria-pressed={mode === "gotcha"}
            >
              useFormStatus (gotcha)
            </button>
          </div>

          <p className="explain-placeholder" style={{ marginTop: "0.6rem" }}>
            The submit button is nested <code>Form → ButtonGroup → SubmitButton</code>. Leave the
            name blank to see the error path; ~{SIMULATED_DELAY_MS}ms simulated delay either way.
          </p>

          {mode === "propDrilling" && <DrilledForm />}
          {mode === "hookInChild" && <HookForm />}
          {mode === "gotcha" && <GotchaForm />}
        </section>
      </div>
    </main>
  );
}
