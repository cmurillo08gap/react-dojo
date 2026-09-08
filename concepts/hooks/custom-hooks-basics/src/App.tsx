import { useState } from "react";
import { useToggle } from "./useToggle";

/**
 * Concept: custom hooks basics
 *
 * Layout convention for every concept package — see
 * hooks/use-state-basics/src/App.tsx for the reference:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * See ./README.md for the full write-up and discussion questions.
 *
 * The demo below shows three independent widgets that all need the exact
 * same "boolean I can flip" behavior, built two ways: first with each
 * widget hand-rolling its own useState + toggle function (duplicated,
 * drifting), then rebuilt on a single shared useToggle custom hook
 * (identical, consistent). See ./useToggle.ts for the hook itself and why
 * the Rules of Hooks force this logic to live in a hook rather than a
 * plain function.
 */

type ActionId =
  | "naive-panel"
  | "naive-switch"
  | "naive-modal-open"
  | "naive-modal-close"
  | "hook-panel"
  | "hook-switch"
  | "hook-modal-open"
  | "hook-modal-close";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome: "naive" | "hook";
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  "naive-panel": {
    label: "Panel (naive)",
    code: `function NaivePanel() {
  const [open, setOpen] = useState(false);
  function toggle() {
    setOpen((o) => !o);
  }
  // ...
}`,
    explanation:
      "NaivePanel hand-rolls its own useState(false) + toggle() pair. It works, but every " +
      "widget below re-implements the same shape from scratch, with no guarantee the next " +
      "one matches it.",
    outcome: "naive",
  },
  "naive-switch": {
    label: "Switch (naive)",
    code: `function NaiveSwitch() {
  const [on, setOn] = useState(false);
  function flipSwitch() {
    // Value form, not the updater form — a DIFFERENT shape than
    // NaivePanel's toggle() for the exact same "flip a boolean" idea.
    setOn(!on);
  }
  // ...
}`,
    explanation:
      'Same "boolean I can flip" behavior as the panel, but a different function name ' +
      "(flipSwitch vs toggle) and the value form of the setter instead of the updater " +
      "form — the kind of drift that creeps in when logic is copy-pasted instead of shared.",
    outcome: "naive",
  },
  "naive-modal-open": {
    label: "Modal — open (naive)",
    code: `function NaiveModal() {
  const [isOpen, setIsOpen] = useState(false);
  function openModal() {
    setIsOpen(true);
  }
  // No closeModal() helper was ever written — see the overlay below.
  // ...
}`,
    explanation:
      "NaiveModal only grew an openModal() helper. Closing it was left as an inline call " +
      "on the overlay's own button below — a third shape again, and one genuinely missing " +
      "a piece the other two naive widgets have.",
    outcome: "naive",
  },
  "naive-modal-close": {
    label: "Modal — close (naive, inline)",
    code: `<button
  onClick={() => {
    setIsOpen(false); // no closeModal() to call — inlined here instead
  }}
>
  Close
</button>`,
    explanation:
      "Because NaiveModal never defined a closeModal() function, the overlay calls the " +
      "setter directly, inline. It's harder to reuse or test than a named helper — exactly " +
      "the kind of small inconsistency that multiplies as more widgets get copy-pasted.",
    outcome: "naive",
  },
  "hook-panel": {
    label: "Panel (useToggle)",
    code: `function HookPanel() {
  const { value: open, toggle } = useToggle(false);
  // ...
}`,
    explanation:
      "HookPanel gets its boolean-with-toggle behavior from useToggle — no local " +
      "useState, no hand-written toggle function, nothing to drift.",
    outcome: "hook",
  },
  "hook-switch": {
    label: "Switch (useToggle)",
    code: `function HookSwitch() {
  const { value: on, toggle } = useToggle(false);
  // ...
}`,
    explanation:
      "Identical shape to HookPanel — same hook, same destructured names, same toggle() " +
      "call. Drift isn't possible here because there's only one implementation to drift from.",
    outcome: "hook",
  },
  "hook-modal-open": {
    label: "Modal — open (useToggle)",
    code: `function HookModal() {
  const { value: isOpen, setOn, setOff } = useToggle(false);
  // open the modal:
  setOn();
  // ...
}`,
    explanation:
      "useToggle also exposes setOn/setOff for cases like a modal that want explicit " +
      "open/close control rather than a single toggle — still the same hook, same file.",
    outcome: "hook",
  },
  "hook-modal-close": {
    label: "Modal — close (useToggle)",
    code: `<button onClick={setOff}>Close</button>`,
    explanation:
      "setOff is a real named function returned by the hook, so the overlay's close " +
      "button has an actual helper to call — nothing inline, nothing missing.",
    outcome: "hook",
  },
};

interface WidgetProps {
  report: (id: ActionId) => void;
}

function NaivePanel({ report }: WidgetProps) {
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen((o) => !o);
    report("naive-panel");
  }

  return (
    <div className="widget" data-flavor="naive">
      <p className="widget-label">Panel (naive)</p>
      <button onClick={toggle} data-active={open}>
        {open ? "Collapse" : "Expand"}
      </button>
      {open && <p className="widget-content">Panel content — open.</p>}
    </div>
  );
}

function NaiveSwitch({ report }: WidgetProps) {
  const [on, setOn] = useState(false);

  function flipSwitch() {
    // Value form, not the updater form — see ACTIONS["naive-switch"].
    setOn(!on);
    report("naive-switch");
  }

  return (
    <div className="widget" data-flavor="naive">
      <p className="widget-label">Switch (naive)</p>
      <button onClick={flipSwitch} data-active={on}>
        {on ? "ON" : "OFF"}
      </button>
    </div>
  );
}

function NaiveModal({ report }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
    report("naive-modal-open");
  }

  return (
    <div className="widget" data-flavor="naive">
      <p className="widget-label">Modal (naive)</p>
      <button onClick={openModal} data-active={isOpen}>
        Open
      </button>
      {isOpen && (
        <div className="widget-overlay">
          <p>No closeModal() helper exists for this widget.</p>
          <button
            onClick={() => {
              setIsOpen(false);
              report("naive-modal-close");
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function HookPanel({ report }: WidgetProps) {
  const { value: open, toggle } = useToggle(false);

  return (
    <div className="widget" data-flavor="hook">
      <p className="widget-label">Panel (useToggle)</p>
      <button
        onClick={() => {
          toggle();
          report("hook-panel");
        }}
        data-active={open}
      >
        {open ? "Collapse" : "Expand"}
      </button>
      {open && <p className="widget-content">Panel content — open.</p>}
    </div>
  );
}

function HookSwitch({ report }: WidgetProps) {
  const { value: on, toggle } = useToggle(false);

  return (
    <div className="widget" data-flavor="hook">
      <p className="widget-label">Switch (useToggle)</p>
      <button
        onClick={() => {
          toggle();
          report("hook-switch");
        }}
        data-active={on}
      >
        {on ? "ON" : "OFF"}
      </button>
    </div>
  );
}

function HookModal({ report }: WidgetProps) {
  const { value: isOpen, setOn, setOff } = useToggle(false);

  return (
    <div className="widget" data-flavor="hook">
      <p className="widget-label">Modal (useToggle)</p>
      <button
        onClick={() => {
          setOn();
          report("hook-modal-open");
        }}
        data-active={isOpen}
      >
        Open
      </button>
      {isOpen && (
        <div className="widget-overlay">
          <p>Closing calls the hook's own setOff() — a real, shared helper.</p>
          <button
            onClick={() => {
              setOff();
              report("hook-modal-close");
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export function App() {
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  function report(id: ActionId) {
    setActiveId(id);
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Custom hooks basics</h1>
        <p>
          A custom hook is <strong>just a JavaScript function</strong> whose name starts with{" "}
          <code>use</code> and that calls other hooks. Extracting one is how you reuse{" "}
          <em>stateful</em> logic across components without duplicating it — or watching it slowly
          drift.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">What is a custom hook?</h3>
          <p>
            There is no special React API for "defining a hook." A custom hook is a regular function
            that happens to (1) have a name starting with <code>use</code> and (2) call other hooks
            — built-in ones like <code>useState</code>, or other custom hooks — inside its body.
          </p>
          <pre>
            <code>{`function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = () => setValue((v) => !v);
  return { value, toggle };
}`}</code>
          </pre>
          <p>
            Every component that calls <code>useToggle()</code> gets its <strong>own</strong>{" "}
            independent state — the hook shares the <em>logic</em>, never the data.
          </p>

          <h3 className="theory-subhead">Rules of hooks</h3>
          <ul>
            <li>
              <strong>Only call hooks at the top level.</strong> Never inside a condition, loop, or
              nested function — React matches each hook call to its state by the <em>order</em> the
              calls happen in, on every render.
            </li>
            <li>
              <strong>Only call hooks from React function components or other hooks.</strong> Not
              from a plain helper function, a class method, or an event handler declared outside a
              component.
            </li>
            <li>
              That second rule is <em>why</em> <code>useToggle</code> has to be a hook: a plain
              function can't call <code>useState</code> internally, because <code>useState</code>{" "}
              only works while React is rendering a component/hook and tracks the call by its
              position in that render. Naming it <code>useToggle</code> and calling it at the top
              level of each widget is what makes it legal — see useToggle.ts's doc comment for the
              full explanation.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p>
            Three widgets need the exact same "boolean I can flip" behavior. Try the{" "}
            <strong>naive</strong> row first — each widget re-implements it from scratch — then the{" "}
            <strong>useToggle</strong> row, where all three share one hook.
          </p>

          <h3 className="theory-subhead">Naive — duplicated, drifting logic</h3>
          <div className="widget-row">
            <NaivePanel report={report} />
            <NaiveSwitch report={report} />
            <NaiveModal report={report} />
          </div>

          <h3 className="theory-subhead">Extracted — one useToggle hook</h3>
          <div className="widget-row">
            <HookPanel report={report} />
            <HookSwitch report={report} />
            <HookModal report={report} />
          </div>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                <span className={`explain-outcome ${active.outcome}`}>
                  {active.outcome === "naive" ? "Duplicated: " : "Shared hook: "}
                </span>
                {active.explanation}
              </p>
              <pre>
                <code>{active.code}</code>
              </pre>
            </div>
          ) : (
            <p className="explain-placeholder">
              Click a widget above to see the exact code behind it and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
