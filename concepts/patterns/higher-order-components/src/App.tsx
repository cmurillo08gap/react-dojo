import { useMemo, useState, type ComponentType, type FC, type ReactNode } from "react";

/**
 * Concept: Higher-order components
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
 *
 * This package builds the SAME "loading" behavior twice — once as a HOC
 * (`withLoading`), once as a custom hook (`useLoading`) — to make the
 * naming-collision/wrapper-hell pitfalls that motivated moving away from
 * HOCs concrete instead of theoretical. See both implementations below.
 */

// ---------------------------------------------------------------------------
// Implementation 1: the HOC. A function that takes a component and returns
// a NEW component wrapping it — the classic pre-hooks way to share behavior
// across components without repeating the logic in each one.
// ---------------------------------------------------------------------------

interface InjectedLoadingProps {
  isLoading: boolean;
}

/**
 * `withLoading` injects an `isLoading` prop's worth of behavior: when true,
 * it renders a fallback instead of `Component`; otherwise it forwards every
 * other prop through untouched.
 *
 * `P` stays a real generic (not `any`) so every caller keeps its own prop
 * types end to end — see the cast inside for the one place that needs a
 * narrow, commented assertion instead.
 */
function withLoading<P extends object>(Component: ComponentType<P>): FC<P & InjectedLoadingProps> {
  const Wrapped: FC<P & InjectedLoadingProps> = (props) => {
    const { isLoading, ...rest } = props;
    if (isLoading) {
      return (
        <div className="loading-fallback" role="status">
          Loading…
        </div>
      );
    }
    // `rest` has had exactly the injected `isLoading` key stripped off,
    // which structurally leaves `P` again — but TypeScript can't prove that
    // generically for an arbitrary `P` (it only sees "P & InjectedLoadingProps
    // minus one key"), so this documents the invariant with a targeted
    // assertion instead of widening the whole function to `any`.
    return <Component {...(rest as unknown as P)} />;
  };
  // Without this, every component wrapped by withLoading shows up in
  // devtools as generic "Wrapped" — losing the real component's identity.
  // This line is the manual workaround hooks don't need at all.
  Wrapped.displayName = `WithLoading(${Component.displayName ?? "Component"})`;
  return Wrapped;
}

/** A second illustrative HOC, used below only to demonstrate "wrapper hell" when composed with `withLoading`. */
function withTheme<P extends object>(Component: ComponentType<P>): FC<P> {
  const Themed: FC<P> = (props) => (
    <div className="theme-wrapper">
      <Component {...props} />
    </div>
  );
  Themed.displayName = `WithTheme(${Component.displayName ?? "Component"})`;
  return Themed;
}

interface SaveButtonProps {
  label: string;
  // This button's OWN concern: is ITS save action currently in flight? Note
  // this is the exact same prop name (`isLoading`) that withLoading's
  // injected prop uses for an entirely different concern ("should the
  // wrapper hide me behind a fallback"). That collision is the whole point
  // of this demo — see the "Toggle saving" explanation below.
  isLoading?: boolean;
  onSave: () => void;
}

const SaveButtonBase: FC<SaveButtonProps> = ({ label, isLoading, onSave }) => (
  <div className="save-button-wrap">
    <button className="save-button" onClick={onSave} disabled={isLoading}>
      {isLoading ? "Saving…" : label}
    </button>
    <p className="debug-readout">
      SaveButton's own <code>isLoading</code> prop: <code>{String(isLoading)}</code>
    </p>
  </div>
);
SaveButtonBase.displayName = "SaveButton";

const SaveButtonWithLoading = withLoading(SaveButtonBase);

// Wrapper hell in miniature: composing two HOCs stacks two extra components
// in the tree (Themed → Wrapped → SaveButtonBase) for one visible button,
// and their displayName wrapping concatenates the same way.
const SaveButtonWithLoadingAndTheme = withTheme(SaveButtonWithLoading);

// ---------------------------------------------------------------------------
// Implementation 2: the custom hook. Same visible loading behavior, called
// directly inside a normal component — no wrapper component in the tree,
// no prop injection, so no name to collide with anything.
// ---------------------------------------------------------------------------

function useLoading(isLoading: boolean): ReactNode {
  // useMemo is representative of the derived-value work a real custom hook
  // does (here: memoizing the fallback element) — it shows this hook
  // participates in a normal render like any other hook, rather than being
  // some special-cased "higher-order hook" that wraps another hook (that's
  // an anti-pattern React's own rules call out explicitly — see README).
  return useMemo(
    () =>
      isLoading ? (
        <div className="loading-fallback" role="status">
          Loading…
        </div>
      ) : null,
    [isLoading],
  );
}

interface SaveButtonHookProps {
  label: string;
  pageLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
}

function SaveButtonHook({ label, pageLoading, isSaving, onSave }: SaveButtonHookProps) {
  const fallback = useLoading(pageLoading);
  if (fallback) return fallback;
  return (
    <div className="save-button-wrap">
      <button className="save-button" onClick={onSave} disabled={isSaving}>
        {isSaving ? "Saving…" : label}
      </button>
      <p className="debug-readout">
        SaveButtonHook's own <code>isSaving</code> prop: <code>{String(isSaving)}</code>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo wiring — the "what just happened" panel below.
// ---------------------------------------------------------------------------

type ActionId = "toggle-page-loading" | "toggle-saving";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual implementations above — they're
// display copies, not derived automatically, so the reader sees exactly what
// ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  "toggle-page-loading": {
    label: "Toggle page loading",
    code: `// Both sides replace the button with the same spinner — this IS the one
// thing HOCs are naturally good at: a single, unambiguous "not ready yet"
// flag with nothing else competing for the name.

// HOC:
<SaveButtonWithLoading isLoading={pageLoading} label="Save profile" onSave={onSave} />

// Hook:
const fallback = useLoading(pageLoading);
if (fallback) return fallback;`,
    explanation:
      "Toggling only page loading looks identical either way. withLoading's injected isLoading " +
      "prop and useLoading's returned fallback both swap in the same spinner, because there's no " +
      "second concern fighting for the name yet.",
  },
  "toggle-saving": {
    label: "Toggle saving",
    code: `// HOC: Wrapped ALWAYS destructures "isLoading" off props for its own gate —
// SaveButtonBase's own "isLoading" (meaning "is MY save pending") is never
// forwarded. There is no prop name left to carry "saving" through.
function Wrapped(props) {
  const { isLoading, ...rest } = props;  // <- consumes isLoading entirely
  if (isLoading) return <Spinner />;
  return <Component {...rest} />;         // SaveButtonBase never sees isLoading
}

// Hook: "isSaving" is a normal, uniquely-named prop. Nothing strips it,
// because there's no wrapper component sitting between caller and callee.
function SaveButtonHook({ pageLoading, isSaving, onSave, label }) {
  const fallback = useLoading(pageLoading);
  if (fallback) return fallback;
  return <button disabled={isSaving}>{isSaving ? "Saving…" : label}</button>;
}`,
    explanation:
      "This is the naming collision. withLoading's contract requires a prop called isLoading, and " +
      "SaveButtonBase independently wants a prop with that exact same natural name for its own " +
      '"is my save pending" state. Only one isLoading can exist on the wrapped element, and the ' +
      "wrapper always wins — so on the HOC side, SaveButtonBase's own isLoading prop reads " +
      'undefined no matter how "saving" changes, and the button never shows "Saving…". The hook ' +
      "has no wrapper stripping props, so pageLoading and isSaving stay two independently named " +
      "values that both reach the component intact.",
    outcome: "buggy",
  },
};

export function App() {
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  function run(id: ActionId) {
    setActiveId(id);
    if (id === "toggle-page-loading") setPageLoading((v) => !v);
    if (id === "toggle-saving") setSaving((v) => !v);
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Higher-order components</h1>
        <p>
          A <strong>higher-order component (HOC)</strong> is a function that takes a component and
          returns a new one wrapping it — the pre-hooks way to share behavior. It works by{" "}
          <em>injecting props</em>, which is exactly what creates the naming-collision and
          wrapper-hell problems custom hooks were built to avoid.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">The HOC pattern</h3>
          <pre>
            <code>{`function withLoading(Component) {
  return function Wrapped(props) {
    if (props.isLoading) return <Spinner />;
    return <Component {...props} />;
  };
}`}</code>
          </pre>
          <ul>
            <li>
              A HOC is <strong>just a function</strong>: <code>Component in, Component out</code>.
              By convention it's named <code>withXxx</code>.
            </li>
            <li>
              It adds a wrapper component to the tree and typically <strong>injects props</strong>{" "}
              the wrapped component reads — here, <code>isLoading</code>.
            </li>
            <li>
              react.dev's current docs do <strong>not</strong> document HOCs as a pattern — they
              predate hooks and are mostly covered by React's legacy docs now (see Further reading).
              The one mention in the current docs is a warning against dynamically creating a{" "}
              <em>"higher-order Hook"</em> at render time — called out explicitly as bad practice.
            </li>
          </ul>

          <h3 className="theory-subhead">Why hooks replaced most of this</h3>
          <p>
            react.dev's{" "}
            <a
              href="https://react.dev/learn/reusing-logic-with-custom-hooks"
              target="_blank"
              rel="noreferrer"
            >
              Reusing Logic with Custom Hooks
            </a>{" "}
            guide frames a custom hook as just a function whose name starts with <code>use</code>{" "}
            that can call other hooks — extracted so multiple components can share stateful logic
            without sharing the state itself.
          </p>
          <pre>
            <code>{`function useLoading(isLoading) {
  return isLoading ? <Spinner /> : null;
}`}</code>
          </pre>
          <ul>
            <li>
              Called <strong>directly inside</strong> the component that needs it — no wrapper
              component, no extra layer in React DevTools.
            </li>
            <li>
              Nothing is destructured away before the component's own props reach it, so there's{" "}
              <strong>no name to collide</strong> with.
            </li>
            <li>
              No <code>displayName</code> gymnastics: the component keeps its own identity in
              devtools instead of showing up as <code>WithLoading(WithTheme(...))</code>.
            </li>
          </ul>

          <h3 className="theory-subhead">Wrapper hell</h3>
          <p>
            Composing HOCs — <code>withTheme(withLoading(SaveButton))</code> — stacks one real
            component in the tree per HOC. The demo renders that exact composition; its computed{" "}
            <code>displayName</code> is <code>{SaveButtonWithLoadingAndTheme.displayName}</code>,
            three layers deep for one visible button.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p>
            Both columns below render the <em>same</em> loading behavior for the same button. Toggle
            each control and compare — the collision only shows up on the "saving" toggle.
          </p>
          <div className="demo-toggles">
            <button
              onClick={() => run("toggle-page-loading")}
              data-active={activeId === "toggle-page-loading"}
            >
              Toggle page loading ({pageLoading ? "on" : "off"})
            </button>
            <button onClick={() => run("toggle-saving")} data-active={activeId === "toggle-saving"}>
              Toggle saving ({saving ? "on" : "off"})
            </button>
          </div>

          <div className="impl-columns">
            <div className="impl-column">
              <h3>
                HOC: <code>withLoading(SaveButton)</code>
              </h3>
              <SaveButtonWithLoading
                isLoading={pageLoading}
                label="Save profile"
                onSave={() => {}}
              />
            </div>
            <div className="impl-column">
              <h3>
                Hook: <code>useLoading</code> inside <code>SaveButtonHook</code>
              </h3>
              <SaveButtonHook
                pageLoading={pageLoading}
                isSaving={saving}
                label="Save profile"
                onSave={() => {}}
              />
            </div>
          </div>

          <div className="wrapper-hell">
            <h3>Composed HOCs ("wrapper hell")</h3>
            <SaveButtonWithLoadingAndTheme
              label="Composed example"
              isLoading={false}
              onSave={() => {}}
            />
            <p className="debug-readout">
              Tree here is <code>Themed → Wrapped → SaveButtonBase</code> — React DevTools shows its
              name as <code>{SaveButtonWithLoadingAndTheme.displayName}</code>.
            </p>
          </div>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                {active.outcome && (
                  <span className={`explain-outcome ${active.outcome}`}>
                    {active.outcome === "buggy" ? "⚠ Naming collision: " : "✓ Correct: "}
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
              Click a toggle above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
