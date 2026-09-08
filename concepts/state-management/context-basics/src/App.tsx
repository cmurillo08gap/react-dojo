import { createContext, memo, useContext, useMemo, useState, type Context, type ReactNode } from "react";

/**
 * Concept: Context basics
 *
 * Layout convention for every concept package — see ./README.md and
 * hooks/use-state-basics/src/App.tsx for the reference shape:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last button pressed,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * This concept has three sub-demos, switched with the "Mode" tabs below —
 * each is its own small tree at least three components deep:
 *
 *   1. Prop drilling      — a value threaded through components that never
 *                            use it themselves, just forward it.
 *   2. Context            — the same value read directly with useContext,
 *                            skipping every intermediate component entirely.
 *   3. Memoization pitfall — an unmemoized vs. a useMemo'd context value,
 *                            and how that changes whether a memoized
 *                            consumer re-renders when the provider does.
 *
 * See ./README.md for the full write-up, discussion questions, and the
 * react.dev pages this was checked against.
 */

type Mode = "drilling" | "context" | "pitfall";
type ActionId = "drill-rename" | "context-rename" | "pitfall-rerender";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
}

// Keep these snippets in sync with the actual code below — they're display
// copies, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  "drill-rename": {
    label: "Rename (prop drilling)",
    code: `function DrillingLayout({ userName, onRename }: DrillingProps) {
  // Doesn't use userName itself — just forwards it one level down.
  return <DrillingSidebar userName={userName} onRename={onRename} />;
}

function DrillingSidebar({ userName, onRename }: DrillingProps) {
  // Same here — another pass-through hop with no use for the value.
  return <DrillingProfileCard userName={userName} onRename={onRename} />;
}

function DrillingProfileCard({ userName, onRename }: DrillingProps) {
  // The only component that actually reads or changes userName.
  return <button onClick={() => onRename("Grace")}>Rename to Grace</button>;
}`,
    explanation:
      "userName and onRename are declared as props on DrillingLayout and DrillingSidebar " +
      "purely so DrillingProfileCard, two levels further down, can read and update them. " +
      "Neither intermediate component uses the value itself — inserting a fourth layer, or " +
      "renaming the prop, means editing every file in between.",
  },
  "context-rename": {
    label: "Rename (context)",
    code: `const UserContext = createContext<UserContextValue | null>(null);

function ContextLayout() {
  // No userName prop anywhere in this file.
  return <ContextSidebar />;
}

function ContextSidebar() {
  return <ContextProfileCard />;
}

function ContextProfileCard() {
  const { userName, setUserName } = useUserContext(); // reads context directly
  return <button onClick={() => setUserName("Grace")}>Rename to Grace</button>;
}`,
    explanation:
      "ContextLayout and ContextSidebar never mention userName at all — the <UserContext> " +
      "provider higher up the tree makes the value available to any descendant that calls " +
      "useUserContext(), no matter how many components sit in between. Renaming pulled the " +
      "value straight from context in the leaf, skipping every intermediate component.",
  },
  "pitfall-rerender": {
    label: "Re-render providers (unrelated state)",
    code: `// BUGGY: a brand-new object every render, even though "label" itself
// never changes.
const unmemoizedValue = { label: "static label" };

// CORRECT: the same object reference across renders, because the
// dependency array ([]) never changes.
const memoizedValue = useMemo(() => ({ label: "static label" }), []);`,
    explanation:
      'Clicking the button only updates "tick", state neither consumer reads — but that still ' +
      "re-renders PitfallDemo, which recreates unmemoizedValue as a brand-new object. " +
      "Object.is(oldValue, newValue) is false, so React re-renders every consumer subscribed " +
      "to that context, even though label is identical — its render count goes up. " +
      "memoizedValue keeps the exact same reference across renders, so its memoized consumer " +
      "sees an unchanged context value (and no props at all) and bails out entirely — its " +
      "render count doesn't move.",
  },
};

// ---------------------------------------------------------------------------
// 1. Prop drilling — a value threaded through components that don't use it.
// ---------------------------------------------------------------------------

interface DrillingProps {
  userName: string;
  onRename: (name: string) => void;
}

function DrillingLayout({ userName, onRename }: DrillingProps) {
  // Doesn't use userName itself — just forwards it one level down.
  return <DrillingSidebar userName={userName} onRename={onRename} />;
}

function DrillingSidebar({ userName, onRename }: DrillingProps) {
  // Same here — another pass-through hop with no use for the value.
  return <DrillingProfileCard userName={userName} onRename={onRename} />;
}

function DrillingProfileCard({ userName, onRename }: DrillingProps) {
  return (
    <div className="demo-card">
      <p>
        Signed in as <strong>{userName}</strong>
      </p>
      <div className="demo-buttons">
        <button onClick={() => onRename("Grace")}>Rename to Grace</button>
        <button onClick={() => onRename("Ada")}>Rename to Ada</button>
      </div>
    </div>
  );
}

interface DrillingDemoProps {
  onAction: (id: ActionId) => void;
}

function DrillingDemo({ onAction }: DrillingDemoProps) {
  const [userName, setUserName] = useState("Ada");

  function rename(next: string) {
    setUserName(next);
    onAction("drill-rename");
  }

  return (
    <div>
      <p className="demo-path">
        DrillingDemo → DrillingLayout → DrillingSidebar → <strong>DrillingProfileCard</strong>
      </p>
      <DrillingLayout userName={userName} onRename={rename} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Context — the same value, read directly via useContext.
// ---------------------------------------------------------------------------

interface UserContextValue {
  userName: string;
  setUserName: (name: string) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function useUserContext(): UserContextValue {
  const value = useContext(UserContext);
  if (!value) throw new Error("useUserContext must be used within a <UserContext> provider");
  return value;
}

function ContextLayout() {
  // No userName prop anywhere in this file.
  return <ContextSidebar />;
}

function ContextSidebar() {
  return <ContextProfileCard />;
}

function ContextProfileCard() {
  const { userName, setUserName } = useUserContext();
  return (
    <div className="demo-card">
      <p>
        Signed in as <strong>{userName}</strong>
      </p>
      <div className="demo-buttons">
        <button onClick={() => setUserName("Grace")}>Rename to Grace</button>
        <button onClick={() => setUserName("Ada")}>Rename to Ada</button>
      </div>
    </div>
  );
}

interface ContextDemoProps {
  onAction: (id: ActionId) => void;
}

function ContextDemo({ onAction }: ContextDemoProps) {
  const [userName, setUserName] = useState("Ada");

  function rename(next: string) {
    setUserName(next);
    onAction("context-rename");
  }

  // Bundling the setter with the value keeps ContextLayout/ContextSidebar
  // ignorant of both. This is exactly the kind of inline object literal the
  // memoization pitfall demo below warns about — fine here because nothing
  // above this provider ever re-renders it for unrelated reasons, but worth
  // wrapping in useMemo the moment that stops being true.
  const value: UserContextValue = { userName, setUserName: rename };

  return (
    <div>
      <p className="demo-path">
        ContextDemo (provider) → ContextLayout → ContextSidebar →{" "}
        <strong>ContextProfileCard</strong>
      </p>
      <UserContext value={value}>
        <ContextLayout />
      </UserContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Memoization pitfall — unmemoized vs. memoized context value.
// ---------------------------------------------------------------------------

interface CounterContextValue {
  label: string;
}

const UnmemoizedCounterContext = createContext<CounterContextValue | null>(null);
const MemoizedCounterContext = createContext<CounterContextValue | null>(null);

function useCounterContext(ctx: Context<CounterContextValue | null>): CounterContextValue {
  const value = useContext(ctx);
  if (!value) throw new Error("useCounterContext must be used within its provider");
  return value;
}

// Counts "did this component's function body actually run again?" by
// comparing the context value's identity across renders — the same
// "adjust state while rendering" idiom hooks/use-callback-basics's
// MemoizedChild uses for props, applied to a context value instead.
// Mutating a ref during render is deliberately avoided (see
// hooks/use-ref-basics for why that's unsafe) — a plain state comparison
// stays correct even under <StrictMode>'s dev-only double render, because
// the second invocation of the same render sees the already-updated
// comparison state and skips re-incrementing.
function useRenderCount(value: CounterContextValue): number {
  const [renderCount, setRenderCount] = useState(1);
  const [prevValue, setPrevValue] = useState(() => value);
  if (value !== prevValue) {
    setPrevValue(value);
    setRenderCount((c) => c + 1);
  }
  return renderCount;
}

interface PitfallWrapperProps {
  children: ReactNode;
}

// A plain pass-through layer, just like DrillingLayout/DrillingSidebar above
// — included so both consumers sit at the same nesting depth as the other
// two demos. It reads no context and holds no state, so its own re-renders
// are irrelevant to the render counts below; what matters is only whether
// the memoized consumer underneath it gets called again.
function PitfallWrapper({ children }: PitfallWrapperProps) {
  return <div className="pitfall-wrapper">{children}</div>;
}

// Wrapped in memo with no props of its own: the only thing that can make
// this re-render is the context value it subscribes to changing identity.
const UnmemoizedConsumer = memo(function UnmemoizedConsumer() {
  const value = useCounterContext(UnmemoizedCounterContext);
  const renderCount = useRenderCount(value);
  return (
    <div className="pitfall-consumer" data-variant="buggy">
      <p className="mini-label">Unmemoized consumer</p>
      <p className="mini-count">{renderCount}</p>
      <p className="pitfall-value">"{value.label}"</p>
    </div>
  );
});
UnmemoizedConsumer.displayName = "UnmemoizedConsumer";

const MemoizedConsumer = memo(function MemoizedConsumer() {
  const value = useCounterContext(MemoizedCounterContext);
  const renderCount = useRenderCount(value);
  return (
    <div className="pitfall-consumer" data-variant="correct">
      <p className="mini-label">Memoized consumer</p>
      <p className="mini-count">{renderCount}</p>
      <p className="pitfall-value">"{value.label}"</p>
    </div>
  );
});
MemoizedConsumer.displayName = "MemoizedConsumer";

interface PitfallDemoProps {
  onAction: (id: ActionId) => void;
}

function PitfallDemo({ onAction }: PitfallDemoProps) {
  const [tick, setTick] = useState(0);

  // BUGGY: a brand-new object every render, even though "label" itself
  // never changes.
  const unmemoizedValue: CounterContextValue = { label: "static label" };

  // CORRECT: the same object reference across renders, because the
  // dependency array ([]) never changes.
  const memoizedValue = useMemo<CounterContextValue>(() => ({ label: "static label" }), []);

  function handleRerender() {
    // Unrelated to either context value, and read by neither consumer —
    // exists purely to force PitfallDemo (the provider owner) to re-render.
    setTick((t) => t + 1);
    onAction("pitfall-rerender");
  }

  return (
    <div>
      <p className="demo-path">
        PitfallDemo (two providers) → PitfallWrapper → <strong>*Consumer</strong>
      </p>
      <div className="demo-buttons">
        <button onClick={handleRerender}>Re-render providers (tick = {tick})</button>
      </div>
      <div className="pitfall-columns">
        <div>
          <p className="demo-label">Unmemoized value — new object every render</p>
          <UnmemoizedCounterContext value={unmemoizedValue}>
            <PitfallWrapper>
              <UnmemoizedConsumer />
            </PitfallWrapper>
          </UnmemoizedCounterContext>
        </div>
        <div>
          <p className="demo-label">Memoized value — same object via useMemo</p>
          <MemoizedCounterContext value={memoizedValue}>
            <PitfallWrapper>
              <MemoizedConsumer />
            </PitfallWrapper>
          </MemoizedCounterContext>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function App() {
  const [mode, setMode] = useState<Mode>("drilling");
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  function selectMode(next: Mode) {
    setMode(next);
    setActiveId(null);
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Context basics</h1>
        <p>
          Passing a value through several components that don't use it themselves —{" "}
          <strong>prop drilling</strong> — works, but it couples every intermediate component to a
          value it has no interest in. <code>createContext</code>/<code>useContext</code> let a
          value skip straight from a provider to whichever descendant actually reads it.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Prop drilling</h3>
          <p>
            Passing a prop down through components that only forward it — never read it — so a
            much deeper descendant can use it. It works, but every intermediate component's
            signature grows to carry values it doesn't care about, and inserting or removing a
            layer means editing every file in between.
          </p>

          <h3 className="theory-subhead">
            <code>createContext</code> / <code>useContext</code>
          </h3>
          <pre>
            <code>{`const ThemeContext = createContext(defaultValue);

function App() {
  return (
    <ThemeContext value={theme}>
      <Page />
    </ThemeContext>
  );
}

function DeepChild() {
  const theme = useContext(ThemeContext); // reads it directly
}`}</code>
          </pre>
          <ul>
            <li>
              <code>createContext(defaultValue)</code> makes a context object outside any
              component; <code>defaultValue</code> is only used when there's no matching provider
              above the reading component.
            </li>
            <li>
              React 19 lets a context object be rendered directly as a provider (
              <code>&lt;ThemeContext value=...&gt;</code>) — the older{" "}
              <code>&lt;ThemeContext.Provider&gt;</code> still works but is on a path to
              deprecation.
            </li>
            <li>
              <code>useContext(ThemeContext)</code> reads the value from the nearest provider
              above the calling component in the tree, and subscribes that component to future
              changes — no intermediate component needs to know the context exists.
            </li>
          </ul>

          <h3 className="theory-subhead">The re-render pitfall</h3>
          <ul>
            <li>
              Every consumer of a context re-renders whenever the provider passes a{" "}
              <em>new value</em>, compared with <code>Object.is</code> — a fresh
              object/array/function literal counts as "new" even if its contents are identical to
              last time.
            </li>
            <li>
              A provider component that re-renders for an unrelated reason (some other state
              changing) recreates an inline <code>{"{ value, setValue }"}</code> object on every
              pass, forcing every consumer to re-render too — even ones a{" "}
              <code>React.memo</code> wraps.
            </li>
            <li>
              Wrapping that object in <code>useMemo</code> (with the right dependency array) keeps
              the same reference across renders where nothing meaningful changed, so consumers can
              bail out.
            </li>
            <li>
              This isn't specific to <code>React.memo</code> — a memoized consumer still
              re-renders when the context <em>it reads</em> changes identity; memoization only
              stops re-renders caused by unrelated prop changes, not by context.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>

          <p className="demo-label">Mode</p>
          <div className="demo-buttons variant-toggle">
            <button onClick={() => selectMode("drilling")} data-active={mode === "drilling"}>
              1. Prop drilling
            </button>
            <button onClick={() => selectMode("context")} data-active={mode === "context"}>
              2. Context
            </button>
            <button onClick={() => selectMode("pitfall")} data-active={mode === "pitfall"}>
              3. Memoization pitfall
            </button>
          </div>

          {mode === "drilling" && <DrillingDemo onAction={(id) => setActiveId(id)} />}
          {mode === "context" && <ContextDemo onAction={(id) => setActiveId(id)} />}
          {mode === "pitfall" && <PitfallDemo onAction={(id) => setActiveId(id)} />}
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
              Click a button above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
