import {
  Component,
  Suspense,
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Concept: use() API basics
 *
 * Layout convention for every concept package — see ./README.md and
 * hooks/use-state-basics/src/App.tsx for the reference shape:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * This concept has two sub-demos, switched with the "Mode" tabs below:
 *
 *   1. Conditional calls — use() reading a different Context (inside an
 *      if/else) or a Promise (after an early return) depending on runtime
 *      state. Both are things every other hook is forbidden from doing
 *      under the Rules of Hooks — use() is explicitly exempt.
 *   2. Data fetching — the SAME "load a profile" request implemented two
 *      ways: use(promise) inside <Suspense>/an error boundary, vs. the
 *      classic useEffect + useState(data/loading/error) dance. Toggle
 *      "Simulate failure" to compare the error model too, not just the
 *      boilerplate.
 *
 * This builds on concepts/concurrent-features/suspense-basics (which
 * covers <Suspense> boundary mechanics in depth) — this package focuses on
 * use() itself, not Suspense's fallback/streaming behavior.
 *
 * See ./README.md for the full write-up, discussion questions, and the
 * react.dev pages this was checked against via context7.
 */

type Mode = "conditional" | "fetching";

type ConditionalActionId = "audience-beginner" | "audience-expert" | "bonus-shown" | "bonus-hidden";

type FetchActionId =
  "fetch-triggered" | "manual-succeeded" | "manual-failed" | "use-succeeded" | "use-failed";

type ActionId = ConditionalActionId | FetchActionId;

interface ActionInfo {
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual code below — they're display
// copies, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const CONDITIONAL_ACTIONS: Record<ConditionalActionId, ActionInfo> = {
  "audience-beginner": {
    code: `function TipReader({ audience }) {
  let tip;
  if (audience === "beginner") {
    tip = use(BeginnerTipContext);   // <- this branch ran
  } else {
    tip = use(ExpertTipContext);
  }
  return <p>{tip}</p>;
}`,
    explanation:
      'audience is "beginner", so only the first branch runs this render, reading ' +
      "BeginnerTipContext. use() is explicitly exempt from the Rules of Hooks, so picking " +
      "between two different use() calls with a plain if/else — a different context read " +
      "on different renders — is legal.",
  },
  "audience-expert": {
    code: `function TipReader({ audience }) {
  let tip;
  if (audience === "beginner") {
    tip = use(BeginnerTipContext);
  } else {
    tip = use(ExpertTipContext);   // <- this branch ran instead
  }
  return <p>{tip}</p>;
}`,
    explanation:
      'audience flipped to "expert", so this render takes the else branch instead — a ' +
      "completely different use() call than last render. The number and identity of use() " +
      "calls is allowed to change render to render; that's true of no other hook.",
    outcome: "correct",
  },
  "bonus-shown": {
    code: `function BonusFact({ show, factPromise }) {
  if (!show) {
    return <p>Toggle "Show bonus fact" to load one.</p>; // early return
  }
  const fact = use(factPromise);   // use() called AFTER a conditional return
  return <p>{fact.text}</p>;
}`,
    explanation:
      "show flipped to true, so this render falls through the early return and reaches " +
      "use(factPromise) for the first time. A regular hook can never appear after a " +
      'conditional return like this — React throws "Rendered more hooks than during the ' +
      'previous render." use() has no such restriction.',
    outcome: "correct",
  },
  "bonus-hidden": {
    code: `function BonusFact({ show, factPromise }) {
  if (!show) {
    return <p>Toggle "Show bonus fact" to load one.</p>; // use() never reached
  }
  const fact = use(factPromise);
  return <p>{fact.text}</p>;
}`,
    explanation:
      "show is false, so the component returns before ever reaching use() this render — no " +
      "error, no warning. That asymmetry (sometimes 0 use() calls, sometimes 1) is exactly " +
      "what the Rules of Hooks normally forbid for every other hook.",
  },
};

const FETCH_ACTIONS: Record<FetchActionId, ActionInfo> = {
  "fetch-triggered": {
    code: `// Manual (remounted via key={attempt}, so loading/profile/error
// naturally reset to their useState() initial values on every attempt):
useEffect(() => {
  fetchProfile(id, shouldFail).then(
    (p) => { setProfile(p); setLoading(false); },
    (err) => { setError(err.message); setLoading(false); },
  );
}, [id]);

// use():
const profile = use(fetchProfile(id, shouldFail)); // inside <Suspense>`,
    explanation:
      "Both sides kicked off the same simulated request. The manual version has to manage " +
      "loading/error flags itself — even resetting them requires remounting the component on " +
      "every attempt, since setting them synchronously at the top of the effect is exactly the " +
      '"calling setState directly within an effect" anti-pattern react.dev warns against. The ' +
      'use() version has nothing to "start" here at all — it just calls use() on render, and ' +
      "<Suspense> shows its fallback for as long as that's pending.",
  },
  "manual-succeeded": {
    code: `fetchProfile(id, shouldFail).then((p) => {
  setProfile(p);
  setLoading(false); // three separate pieces of state to keep in sync
});`,
    explanation:
      "The request resolved, so the .then() callback manually flips loading off and stores " +
      "the profile. Nothing about this is automatic — every state transition is spelled out.",
    outcome: "correct",
  },
  "manual-failed": {
    code: `fetchProfile(id, shouldFail).then(
  (p) => { setProfile(p); setLoading(false); },
  (err) => {
    setError(err.message); // has to be remembered explicitly...
    setLoading(false);      // ...and so does this
  },
);`,
    explanation:
      "The simulated request rejected. Nothing in useState/useEffect catches this for you — " +
      "the component has to store the error itself and remember to also turn loading off, " +
      "or the UI would show a spinner forever.",
    outcome: "buggy",
  },
  "use-succeeded": {
    code: `function UseApiProfileView({ profilePromise }) {
  const profile = use(profilePromise); // resolved — render continues normally
  return <ProfileCard profile={profile} />;
}`,
    explanation:
      "The promise resolved, so use() returned the profile directly and rendering continued " +
      "as if it were synchronous. There's no loading flag to clear — <Suspense> was already " +
      "showing the fallback, and now it swaps to the real content in one step.",
    outcome: "correct",
  },
  "use-failed": {
    code: `function UseApiProfileView({ profilePromise }) {
  const profile = use(profilePromise); // rejected — throws to the nearest
  return <ProfileCard profile={profile} />; // error boundary; this line never runs
}

<ErrorBoundary fallback={(error) => <p>{error.message}</p>}>
  <Suspense fallback={<Loading />}>
    <UseApiProfileView profilePromise={profilePromise} />
  </Suspense>
</ErrorBoundary>`,
    explanation:
      "The promise rejected, so use() re-threw that rejection during render. React walks up " +
      "to the nearest error boundary above the <Suspense> and renders its fallback — no " +
      "try/catch, no error state field to remember on this component at all.",
  },
};

// ---------------------------------------------------------------------------
// 1. Conditional calls — use() reading a different Context / Promise inside
//    an if statement or after an early return.
// ---------------------------------------------------------------------------

type Audience = "beginner" | "expert";

const BEGINNER_TIP =
  "useState's setter identity is stable across renders — safe to omit from a dependency array.";
const EXPERT_TIP =
  "use() is the one API allowed to be called conditionally, in loops, or after an early " +
  "return — every other hook must run unconditionally, in the same order, every render.";

const BeginnerTipContext = createContext(BEGINNER_TIP);
const ExpertTipContext = createContext(EXPERT_TIP);

interface TipReaderProps {
  audience: Audience;
}

function TipReader({ audience }: TipReaderProps) {
  // `use()` is exempt from the Rules of Hooks, so this `if` can call it on
  // a DIFFERENT context depending on a value that changes across renders.
  // The equivalent with useContext() would violate the Rules of Hooks —
  // see the "Why useContext can't do this" note in the demo panel.
  let tip: string;
  if (audience === "beginner") {
    tip = use(BeginnerTipContext);
  } else {
    tip = use(ExpertTipContext);
  }
  return <p className="use-api-tip">{tip}</p>;
}

interface BonusFact {
  id: number;
  text: string;
}

// Cached once at module scope so the SAME promise instance is reused across
// re-renders/toggles — see the "Promises passed to use must be cached"
// pitfall in the theory panel. A brand-new promise created during render
// would make the component suspend forever, re-fetching on every attempt.
let bonusFactPromise: Promise<BonusFact> | null = null;
function fetchBonusFact(): Promise<BonusFact> {
  if (!bonusFactPromise) {
    bonusFactPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 1,
          text:
            "use() was added in React 19 as a first-class way to read a Promise or Context " +
            "from inside a component body, instead of only from a Hook call site.",
        });
      }, 900);
    });
  }
  return bonusFactPromise;
}

interface BonusFactProps {
  show: boolean;
  factPromise: Promise<BonusFact>;
}

function BonusFactReader({ show, factPromise }: BonusFactProps) {
  if (!show) {
    // Early return BEFORE use() is ever reached on this render — legal only
    // because use() doesn't have to run in the same order every time.
    return <p className="use-api-placeholder">Toggle "Show bonus fact" to load one.</p>;
  }
  const fact = use(factPromise);
  return <p className="use-api-tip">{fact.text}</p>;
}

interface ConditionalDemoProps {
  onAction: (id: ConditionalActionId) => void;
}

function ConditionalDemo({ onAction }: ConditionalDemoProps) {
  const [audience, setAudience] = useState<Audience>("beginner");
  const [showBonusFact, setShowBonusFact] = useState(false);

  function selectAudience(next: Audience) {
    setAudience(next);
    onAction(next === "beginner" ? "audience-beginner" : "audience-expert");
  }

  function toggleBonusFact() {
    const next = !showBonusFact;
    setShowBonusFact(next);
    onAction(next ? "bonus-shown" : "bonus-hidden");
  }

  return (
    <div>
      <p className="demo-label">1. Conditional context read (inside an if/else)</p>
      <div className="demo-buttons">
        <button onClick={() => selectAudience("beginner")} data-active={audience === "beginner"}>
          Audience: Beginner
        </button>
        <button onClick={() => selectAudience("expert")} data-active={audience === "expert"}>
          Audience: Expert
        </button>
      </div>
      <BeginnerTipContext value={BEGINNER_TIP}>
        <ExpertTipContext value={EXPERT_TIP}>
          <TipReader audience={audience} />
        </ExpertTipContext>
      </BeginnerTipContext>

      <p className="demo-label" style={{ marginTop: "1.1rem" }}>
        2. Conditional promise read (after an early return)
      </p>
      <div className="demo-buttons">
        <button onClick={toggleBonusFact} data-active={showBonusFact}>
          {showBonusFact ? "Hide bonus fact" : "Show bonus fact"}
        </button>
      </div>
      <Suspense fallback={<p className="pending-tag">Loading bonus fact…</p>}>
        <BonusFactReader show={showBonusFact} factPromise={fetchBonusFact()} />
      </Suspense>

      <p className="demo-label" style={{ marginTop: "1.1rem" }}>
        Why useContext() can't do this
      </p>
      <pre>
        <code>{`function TipReaderBroken({ audience }) {
  if (audience === "beginner") {
    // ❌ React Hook "useContext" is called conditionally. React Hooks
    //    must be called in the exact same order in every component render.
    return <p>{useContext(BeginnerTipContext)}</p>;
  }
  return <p>{useContext(ExpertTipContext)}</p>;
}`}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Data fetching — use(promise) + Suspense/error boundary vs. the manual
//    useEffect + useState(data/loading/error) pattern.
// ---------------------------------------------------------------------------

interface Profile {
  id: number;
  name: string;
  bio: string;
}

const PROFILE: Profile = {
  id: 1,
  name: "Ada Lovelace",
  bio: "Wrote notes describing an algorithm for Babbage's Analytical Engine — often called the first published computer program.",
};

// Small resource-cache helper `use()` can consume — similar in spirit to
// concepts/concurrent-features/suspense-basics's resource cache, but pared
// down to just what use() actually needs: the SAME promise instance
// returned for a given key across re-renders. use() itself already
// understands a promise's pending/fulfilled/rejected states, so there's no
// need for the manual status/dispatcher machinery older "wrapPromise"
// patterns (built for throw-based Suspense before use() existed) required.
const profileCache = new Map<string, Promise<Profile>>();

function fetchProfileResource(shouldFail: boolean, attempt: number): Promise<Profile> {
  const key = `${shouldFail}:${attempt}`;
  let promise = profileCache.get(key);
  if (!promise) {
    promise = new Promise<Profile>((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error("Network error: could not load profile."));
        } else {
          resolve(PROFILE);
        }
      }, 1200);
    });
    profileCache.set(key, promise);
  }
  return promise;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey: unknown;
  onError: (error: Error) => void;
  fallback: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// React has no Hook-based error boundary — componentDidCatch and
// getDerivedStateFromError only exist on class components as of this
// writing, so this is the one class in this package. It's the minimal
// plumbing use(promise)'s rejection path needs (per react.dev: "If the
// Promise is rejected, the nearest Error Boundary will handle the error"),
// not itself what this concept is teaching.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Mirrors react-error-boundary's `resetKeys` prop (see react.dev's
    // "Displaying an error with an Error Boundary" example): a new
    // resetKey means the caller wants to try rendering children again.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  override render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}

interface UseApiProfileViewProps {
  profilePromise: Promise<Profile>;
  onSettle: (id: ActionId) => void;
}

function UseApiProfileView({ profilePromise, onSettle }: UseApiProfileViewProps) {
  const profile = use(profilePromise);
  // Only reached on renders where use() resolved without throwing, so this
  // useEffect call is consistent across every render this component
  // actually completes — the render(s) where use() suspended never counted
  // as this component instance rendering at all.
  useEffect(() => {
    onSettle("use-succeeded");
  }, [profile, onSettle]);
  return (
    <div className="profile-card">
      <p className="profile-name">{profile.name}</p>
      <p className="profile-bio">{profile.bio}</p>
    </div>
  );
}

interface ManualProfileViewProps {
  shouldFail: boolean;
  attempt: number;
  onSettle: (id: ActionId) => void;
}

function ManualProfileView({ shouldFail, attempt, onSettle }: ManualProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchProfileResource(shouldFail, attempt).then(
      (result) => {
        if (!active) return;
        setProfile(result);
        setLoading(false);
        onSettle("manual-succeeded");
      },
      (err: Error) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
        onSettle("manual-failed");
      },
    );
    return () => {
      active = false;
    };
    // shouldFail is intentionally NOT a dependency: this component is
    // remounted (via `key={attempt}` where it's rendered below) on every new
    // fetch, so this effect only ever runs once per mount and reads
    // shouldFail's value at that moment — matching the checkbox's own label,
    // "takes effect on the next fetch," instead of refetching the instant
    // the checkbox is toggled. Resetting loading/error/profile by hand
    // (rather than via `useState`'s initial values) would also mean calling
    // setState synchronously at the top of the effect, which is exactly the
    // "Avoid calling setState() directly within an effect" anti-pattern
    // react.dev warns about — remounting sidesteps it entirely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, onSettle]);

  if (loading) return <p className="pending-tag">Loading profile…</p>;
  if (error) return <p className="error-banner">{error}</p>;
  if (!profile) return null;
  return (
    <div className="profile-card">
      <p className="profile-name">{profile.name}</p>
      <p className="profile-bio">{profile.bio}</p>
    </div>
  );
}

interface FetchDemoProps {
  onAction: (id: ActionId) => void;
}

function FetchDemo({ onAction }: FetchDemoProps) {
  const [shouldFail, setShouldFail] = useState(false);
  const [attempt, setAttempt] = useState(0);

  function refetch() {
    setAttempt((a) => a + 1);
    onAction("fetch-triggered");
  }

  const profilePromise = fetchProfileResource(shouldFail, attempt);

  return (
    <div>
      <label className="failure-toggle">
        <input
          type="checkbox"
          checked={shouldFail}
          onChange={(e) => setShouldFail(e.target.checked)}
        />
        Simulate failure (takes effect on the next fetch)
      </label>
      <div className="demo-buttons">
        <button onClick={refetch}>Fetch profile (attempt {attempt + 1})</button>
      </div>

      <div className="fetch-columns">
        <div>
          <p className="demo-label">Manual: useEffect + useState</p>
          <ManualProfileView
            key={attempt}
            shouldFail={shouldFail}
            attempt={attempt}
            onSettle={onAction}
          />
        </div>
        <div>
          <p className="demo-label">use() + Suspense + error boundary</p>
          <ErrorBoundary
            resetKey={attempt}
            onError={() => onAction("use-failed")}
            fallback={(error) => <p className="error-banner">{error.message}</p>}
          >
            <Suspense fallback={<p className="pending-tag">Loading profile…</p>}>
              <UseApiProfileView profilePromise={profilePromise} onSettle={onAction} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function App() {
  const [mode, setMode] = useState<Mode>("conditional");
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  function selectMode(next: Mode) {
    setMode(next);
    setActiveId(null);
  }

  const active =
    activeId && mode === "conditional" && activeId in CONDITIONAL_ACTIONS
      ? CONDITIONAL_ACTIONS[activeId as ConditionalActionId]
      : activeId && mode === "fetching" && activeId in FETCH_ACTIONS
        ? FETCH_ACTIONS[activeId as FetchActionId]
        : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>use() API basics</h1>
        <p>
          <code>use()</code> reads a value from a Promise or a Context, from directly inside a
          component's render body. Unlike every other Hook, it can be called{" "}
          <strong>conditionally</strong> — inside an <code>if</code>, after an early return, or in a
          loop — and reading a Promise with it integrates with <code>{"<Suspense>"}</code> and error
          boundaries instead of manual loading/error state.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Reading a Promise or a Context</h3>
          <pre>
            <code>{`const value = use(promiseOrContext);`}</code>
          </pre>
          <ul>
            <li>
              <code>use(promise)</code> — unwraps a Promise. If it's still pending, the component{" "}
              <strong>suspends</strong>, and the nearest <code>{"<Suspense>"}</code> boundary above
              shows its fallback until it settles.
            </li>
            <li>
              <code>use(context)</code> — reads a Context's current value, exactly like{" "}
              <code>useContext(context)</code> would: the nearest provider above the calling
              component, or the default value if there is none.
            </li>
            <li>
              <code>use</code> is a regular import from <code>"react"</code>, but React
              intentionally does <em>not</em> call it a "Hook" in its own naming — it's designed to
              be called from places Hooks normally can't be.
            </li>
          </ul>

          <h3 className="theory-subhead">The Rules-of-Hooks exception</h3>
          <ul>
            <li>
              Per React's own eslint-plugin-react-hooks docs: "The <code>use</code> hook is an
              exception to the standard Rules of Hooks and can be called conditionally or within
              loops." <code>useState</code>, <code>useContext</code>, <code>useEffect</code>, and
              every other Hook must run{" "}
              <strong>unconditionally, in the same order, every render</strong> — <code>use()</code>{" "}
              is exempt from that rule.
            </li>
            <li>
              It still has its own restrictions: it must be called from inside a component or
              another Hook (not from a plain function or event handler), and it can{" "}
              <strong>never be wrapped in a try/catch block</strong> — <code>use()</code> relies on
              throwing internally to integrate with Suspense/error boundaries, so a surrounding{" "}
              <code>catch</code> would swallow that.
            </li>
          </ul>

          <h3 className="theory-subhead">Reading a Promise safely</h3>
          <ul>
            <li>
              A promise passed to <code>use()</code> <strong>must be cached</strong> — reused across
              re-renders — not created fresh during render. A brand-new promise every render means
              the component suspends forever, since it's always waiting on a promise that never gets
              the chance to resolve from React's point of view.
            </li>
            <li>
              On rejection, <code>use()</code> re-throws that rejection during render, and React
              walks up to the <strong>nearest error boundary</strong> to handle it — the same class
              component API (<code>componentDidCatch</code>/<code>getDerivedStateFromError</code>)
              used for any other render-time error, since React doesn't have a Hook-based error
              boundary as of this writing.
            </li>
            <li>
              In a Server Component, the same job is normally done with a plain <code>await</code>{" "}
              at the top of the function. Client Components can't <code>await</code> during render,
              which is exactly the gap <code>use()</code> fills for them.
            </li>
          </ul>

          <h3 className="theory-subhead">
            vs. <code>useContext</code> / manual <code>useEffect</code> fetching
          </h3>
          <ul>
            <li>
              For Context, <code>use()</code> and <code>useContext</code> read the exact same value
              from the exact same provider — the only difference is that <code>use()</code> can be
              called conditionally and <code>useContext</code> cannot.
            </li>
            <li>
              For data fetching, the classic pattern — <code>useState</code> for the data,{" "}
              <code>useState</code> for a loading flag, <code>useState</code> for an error, and a{" "}
              <code>useEffect</code> to kick the request off and keep all three in sync — puts the
              loading/error UI decisions inside the component itself. <code>use(promise)</code>{" "}
              moves those decisions up to whichever <code>{"<Suspense>"}</code>/error boundary wraps
              it, and the component body only has to handle the success case.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>

          <p className="demo-label">Mode</p>
          <div className="demo-buttons variant-toggle">
            <button onClick={() => selectMode("conditional")} data-active={mode === "conditional"}>
              1. Conditional calls
            </button>
            <button onClick={() => selectMode("fetching")} data-active={mode === "fetching"}>
              2. Data fetching
            </button>
          </div>

          {mode === "conditional" && <ConditionalDemo onAction={(id) => setActiveId(id)} />}
          {mode === "fetching" && <FetchDemo onAction={(id) => setActiveId(id)} />}
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
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
              Use a control above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
