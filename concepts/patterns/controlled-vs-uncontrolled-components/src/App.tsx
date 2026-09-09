import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Concept: Controlled vs. uncontrolled components
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * This is the GENERAL, component-design version of controlled/uncontrolled
 * — not about <input> (that's forms-and-actions/controlled-vs-uncontrolled-inputs,
 * read-only reference, not duplicated here). Per react.dev's "Sharing State
 * Between Components": a component is "uncontrolled" when it manages
 * important information via its own local state, and "controlled" when
 * that information is driven by props instead, letting a parent fully
 * specify its behavior. The <Accordion> below is ONE component that
 * supports both, following the same "controlled if the prop is defined"
 * convention used by real headless libraries (Radix, Headless UI, React
 * Aria): `open === undefined` means uncontrolled (manage internally),
 * otherwise the parent owns it.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

interface AccordionProps {
  title: string;
  children: ReactNode;
  /** Uncontrolled mode only: initial open state. Ignored once `open` is passed. */
  defaultOpen?: boolean;
  /** Controlled mode: when defined, this component renders `open` and nothing else. */
  open?: boolean;
  /** Fired on every toggle attempt, controlled or not — the parent's only hook in. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * A single expand/collapse panel that works BOTH ways, exactly like a real
 * design-system component:
 *
 *   - Uncontrolled: leave `open` undefined (optionally pass `defaultOpen`).
 *     The component manages `internalOpen` itself via useState.
 *   - Controlled: pass `open` + `onOpenChange`. The component never touches
 *     its own state for rendering — it renders whatever `open` says and
 *     calls `onOpenChange` instead of flipping anything itself.
 *
 * The `isControlled = open !== undefined` check is the whole trick: it's
 * evaluated fresh on every render, so if a caller flips between passing a
 * real boolean and `undefined` across renders, this component would
 * silently change modes mid-lifetime. React doesn't catch that for a
 * custom component the way it does for <input> — so this component
 * guards itself with the effect below and warns exactly like a real
 * library would.
 */
function Accordion({ title, children, defaultOpen = false, open, onOpenChange }: AccordionProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Self-implemented guard against silently switching modes across renders.
  // React's own controlled/uncontrolled warning only exists for built-in
  // form elements like <input> — a plain component like this one gets no
  // such protection for free, so a well-behaved reusable component has to
  // build it itself (this is what Radix/Headless UI-style hooks do under
  // the hood via a "useControllableState" helper).
  const wasControlled = useRef(isControlled);
  useEffect(() => {
    if (wasControlled.current !== isControlled) {
      console.error(
        `Accordion "${title}" is changing from ${wasControlled.current ? "controlled" : "uncontrolled"} ` +
          `to ${isControlled ? "controlled" : "uncontrolled"}. Decide between using a controlled or ` +
          "uncontrolled Accordion for the lifetime of the component.",
      );
    }
    wasControlled.current = isControlled;
  }, [isControlled, title]);

  // Written as `open === undefined ? ... : open` (not `isControlled ? ...`)
  // so TypeScript narrows `open` to `boolean` in the branch that uses it —
  // a separate boolean variable wouldn't let the compiler make that link.
  const currentOpen = open === undefined ? internalOpen : open;

  function toggle() {
    const next = !currentOpen;
    // Only touch internal state when nobody else owns it — a controlled
    // instance must never update its own state, or it would fight the
    // parent's next render.
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div className="accordion-item">
      <button
        type="button"
        className="accordion-trigger"
        onClick={toggle}
        aria-expanded={currentOpen}
      >
        <span className={`accordion-caret ${currentOpen ? "open" : ""}`}>▸</span>
        {title}
      </button>
      {currentOpen && <div className="accordion-panel">{children}</div>}
    </div>
  );
}

type ActionId = "uncontrolled-toggle" | "controlled-header" | "controlled-force" | "trap-flip";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  "uncontrolled-toggle": {
    label: "Toggle uncontrolled panel",
    code: `<Accordion title="Uncontrolled" defaultOpen={false} onOpenChange={logOnly}>
  ...
</Accordion>

// Inside Accordion: open === undefined, so isControlled is false.
function toggle() {
  const next = !currentOpen;
  setInternalOpen(next);   // <- this line is what actually runs
  onOpenChange?.(next);    // <- fires too, but only for observation
}`,
    explanation:
      "open was never passed, so isControlled is false and this instance manages its own " +
      "internalOpen via useState. Passing onOpenChange anyway doesn't make it controlled — only " +
      "the presence of the open prop does. The parent hears about the toggle (for logging) but " +
      "has no say in it.",
    outcome: "correct",
  },
  "controlled-header": {
    label: "Click controlled panel's own header",
    code: `<Accordion title="Controlled" open={controlledOpen} onOpenChange={setControlledOpen}>
  ...
</Accordion>

// Inside Accordion: open !== undefined, so isControlled is true.
function toggle() {
  const next = !currentOpen;
  // setInternalOpen is skipped entirely — isControlled guards it.
  onOpenChange?.(next);   // <- the ONLY thing this click does
}`,
    explanation:
      "Clicking the header never flips this instance's own state — isControlled is true, so " +
      "setInternalOpen is skipped. All the click does is call onOpenChange(next), which runs the " +
      "parent's setControlledOpen. The panel only actually opens once that state update flows back " +
      "down through the open prop on the next render.",
    outcome: "correct",
  },
  "controlled-force": {
    label: "Parent button forces open/closed",
    code: `// Parent-owned button, nothing to do with the Accordion's own header:
<button onClick={() => setControlledOpen(true)}>Force open</button>
<button onClick={() => setControlledOpen(false)}>Force closed</button>`,
    explanation:
      "This button never touched the Accordion's header or its toggle() function at all — it drove " +
      "the panel purely by changing the parent's own state, which flows down through the open prop. " +
      "That's the entire point of a controlled component: the parent is fully in charge.",
    outcome: "correct",
  },
  "trap-flip": {
    label: "Flip one instance between modes",
    code: `<Accordion
  title="Mode-switch trap"
  open={trapControlled ? trapOpen : undefined}
  onOpenChange={trapControlled ? setTrapOpen : undefined}
/>`,
    explanation:
      "Flipping open between a real boolean and undefined on the SAME instance changes isControlled " +
      "mid-lifetime. React itself won't catch this for a plain component (unlike <input>), so it's " +
      "this component's own useEffect guard that noticed the mismatch and logged the warning below.",
    outcome: "buggy",
  },
};

export function App() {
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  // --- 1. Uncontrolled instance -----------------------------------------
  // No `open` prop at all — the Accordion owns its own state. onOpenChange
  // is passed anyway, purely so the parent can log what happened; it has
  // zero influence on whether the panel actually opens.
  const [uncontrolledEvents, setUncontrolledEvents] = useState(0);

  function handleUncontrolledObserve() {
    setUncontrolledEvents((n) => n + 1);
    setActiveId("uncontrolled-toggle");
  }

  // --- 2. Controlled instance --------------------------------------------
  // The parent owns `controlledOpen` and is the only thing that can change
  // it — the Accordion just renders whatever it's told.
  const [controlledOpen, setControlledOpen] = useState(false);

  function handleControlledHeaderToggle(next: boolean) {
    setControlledOpen(next);
    setActiveId("controlled-header");
  }

  function forceControlled(next: boolean) {
    setControlledOpen(next);
    setActiveId("controlled-force");
  }

  // --- 3. The mode-switching trap -----------------------------------------
  // One Accordion instance whose `open`/`onOpenChange` are conditionally
  // passed at all, flipping isControlled across renders on purpose.
  const [trapControlled, setTrapControlled] = useState(true);
  const [trapOpen, setTrapOpen] = useState(false);
  const [capturedWarning, setCapturedWarning] = useState<string | null>(null);

  function flipTrapMode() {
    setCapturedWarning(null);
    setTrapControlled((c) => !c);
    setActiveId("trap-flip");
  }

  // Patch console.error for the lifetime of this page so the Accordion's
  // own dev-mode guard (see the component above) shows its warning inline
  // in the demo instead of only in devtools. Only messages mentioning
  // "Accordion" are captured; everything else still passes through.
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const message = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
      if (message.includes("Accordion")) {
        setCapturedWarning(message);
      }
      originalError(...args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Controlled vs. uncontrolled components</h1>
        <p>
          This is the <strong>general, component-design</strong> version of controlled/uncontrolled
          — the same <code>&lt;Accordion&gt;</code> below can either manage its own open/closed
          state, or hand that job entirely to a parent, depending on which props are passed. (The{" "}
          <code>&lt;input&gt;</code>-specific version of this idea lives in{" "}
          <code>forms-and-actions/controlled-vs-uncontrolled-inputs</code>.)
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Uncontrolled: the component owns its state</h3>
          <p>
            Per react.dev's <em>Sharing State Between Components</em>: "It is common to call a
            component with some local state 'uncontrolled' ... because its parent cannot influence
            whether [it] is active or not."
          </p>
          <pre>
            <code>{`function Accordion() {
  const [internalOpen, setInternalOpen] = useState(false);
  // internalOpen is this component's own memory — nobody outside can see it.
}`}</code>
          </pre>

          <h3 className="theory-subhead">Controlled: a prop drives it</h3>
          <p>
            "You might say a component is 'controlled' when the important information in it is
            driven by props rather than its own local state. This lets the parent component fully
            specify its behavior." (react.dev)
          </p>
          <pre>
            <code>{`<Accordion open={isOpen} onOpenChange={setIsOpen} />
// The parent's state is the single source of truth; Accordion just renders it.`}</code>
          </pre>
          <ul>
            <li>
              Uncontrolled components are easier to drop in (less configuration) but harder to
              coordinate with siblings or drive externally.
            </li>
            <li>
              Controlled components are maximally flexible but require the parent to fully own and
              pass down the state.
            </li>
            <li>
              react.dev's own take: "controlled" and "uncontrolled" aren't strict technical terms —
              most components mix both. The question worth asking per piece of state is "should this
              be controlled (via props) or uncontrolled (via state)?"
            </li>
          </ul>

          <h3 className="theory-subhead">Supporting both in one API</h3>
          <p>
            Real component libraries (Radix, Headless UI, React Aria) ship components that work
            either way, using the <strong>"controlled if the prop is defined"</strong> convention:
          </p>
          <pre>
            <code>{`const isControlled = open !== undefined;
const currentOpen = isControlled ? open : internalOpen;`}</code>
          </pre>
          <ul>
            <li>
              Nobody passes <code>open</code> → <code>isControlled</code> is <code>false</code> →
              the component's own <code>useState</code> is the source of truth (seeded once from{" "}
              <code>defaultOpen</code>, mirroring <code>&lt;input defaultValue&gt;</code>).
            </li>
            <li>
              <code>open</code> is passed → <code>isControlled</code> is <code>true</code> → the
              component must render exactly what <code>open</code> says and never update its own
              state — it calls <code>onOpenChange</code> instead and waits for a new prop.
            </li>
            <li>
              Unlike the built-in <code>&lt;input&gt;</code> (which React itself refuses to let
              switch modes and warns about at runtime), a plain component like this{" "}
              <code>Accordion</code> gets no such protection for free — a library author has to
              build that guard rail explicitly, as this demo's third panel does.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>

          <h3 className="theory-subhead">1. Uncontrolled</h3>
          <p className="explain-placeholder" style={{ marginTop: 0 }}>
            No <code>open</code> prop passed — this instance manages itself.
          </p>
          <Accordion
            title="Uncontrolled panel"
            defaultOpen={false}
            onOpenChange={handleUncontrolledObserve}
          >
            <p>
              This content's visibility lives in this Accordion instance's own <code>useState</code>
              . The parent only finds out via the optional <code>onOpenChange</code> callback below.
            </p>
          </Accordion>
          <p className="demo-count">
            Parent has observed <strong>{uncontrolledEvents}</strong> toggle
            {uncontrolledEvents === 1 ? "" : "s"} (via <code>onOpenChange</code>) — it still can't
            force this panel open or closed itself.
          </p>

          <h3 className="theory-subhead">2. Controlled</h3>
          <p className="explain-placeholder" style={{ marginTop: 0 }}>
            <code>open</code> + <code>onOpenChange</code> passed — the parent is fully in charge.
          </p>
          <Accordion
            title="Controlled panel"
            open={controlledOpen}
            onOpenChange={handleControlledHeaderToggle}
          >
            <p>
              This panel has no state of its own for whether it's open — it just renders the{" "}
              <code>open</code> prop below.
            </p>
          </Accordion>
          <div className="demo-buttons" style={{ marginTop: "0.5rem" }}>
            <button type="button" onClick={() => forceControlled(true)}>
              Force open (parent button)
            </button>
            <button type="button" onClick={() => forceControlled(false)}>
              Force closed (parent button)
            </button>
          </div>
          <p className="demo-count">
            Parent state (<code>controlledOpen</code>): <strong>{String(controlledOpen)}</strong>
          </p>

          <h3 className="theory-subhead">3. The mode-switching trap</h3>
          <p className="explain-placeholder" style={{ marginTop: 0 }}>
            One instance, flipping between controlled and uncontrolled on purpose.
          </p>
          <Accordion
            title="Mode-switch trap"
            open={trapControlled ? trapOpen : undefined}
            onOpenChange={trapControlled ? setTrapOpen : undefined}
          >
            <p>Careful — this instance's mode is being flipped underneath it.</p>
          </Accordion>
          <div className="demo-buttons" style={{ marginTop: "0.5rem" }}>
            <button type="button" onClick={flipTrapMode}>
              Flip to{" "}
              {trapControlled ? "uncontrolled (open={undefined})" : "controlled (open=boolean)"}
            </button>
          </div>
          <p className="demo-count">
            Currently: <strong>{trapControlled ? "controlled" : "uncontrolled"}</strong>
          </p>
          {capturedWarning && (
            <p className="explain-outcome buggy" role="alert">
              ⚠ console.error caught: {capturedWarning}
            </p>
          )}
          {!capturedWarning && (
            <p className="explain-placeholder">
              Click "Flip to..." above — this Accordion's own guard effect logs a warning the moment
              its mode changes mid-lifetime, captured here instead of only in devtools.
            </p>
          )}
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
              Click a header or button above to see the exact code that ran and why it behaved that
              way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
