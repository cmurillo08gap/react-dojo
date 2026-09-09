import { Suspense, useCallback, useEffect, useState } from "react";

/**
 * Concept: Suspense basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last button pressed,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo puts two implementations of "fetch a profile after a simulated
 * ~1.2s network delay" side by side:
 *
 *   - "Manual isLoading" — a plain component that does useEffect +
 *     useState(true), fetches with a fake async function, and conditionally
 *     renders a spinner vs. the loaded content itself. This is the "do it
 *     by hand" approach most learners reach for first.
 *   - "Suspense" — a component that reads a tiny resource cache
 *     (wrapPromise) which THROWS the pending promise while data isn't
 *     ready. React catches that throw, shows the nearest <Suspense
 *     fallback>, and retries rendering the component once the promise
 *     settles. The component itself never touches a loading flag.
 *
 * Each side has its own "Reload" button that starts a brand new fetch, so
 * you can watch the Suspense boundary fall back to its loading UI again on
 * demand, not just on first mount.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

interface Profile {
  name: string;
  bio: string;
  loadNumber: number;
}

const DELAY_MS = 1200;

let manualLoadCounter = 0;
function fetchProfileManual(): Promise<Profile> {
  manualLoadCounter += 1;
  const loadNumber = manualLoadCounter;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "Ada Lovelace",
        bio: "Wrote the first published algorithm intended for a machine.",
        loadNumber,
      });
    }, DELAY_MS);
  });
}

let suspenseLoadCounter = 0;
function fetchProfileSuspense(): Promise<Profile> {
  suspenseLoadCounter += 1;
  const loadNumber = suspenseLoadCounter;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "Grace Hopper",
        bio: "Popularized the idea of machine-independent programming languages.",
        loadNumber,
      });
    }, DELAY_MS);
  });
}

// --- The resource-cache helper that makes "suspending" possible ----------
//
// Plain promises aren't something a component can render directly — this
// is the classic hand-rolled "resource" wrapper react.dev's older Suspense
// examples used to illustrate the mechanics: reading it either returns the
// resolved value, re-throws the rejection, or — while the promise is still
// pending — throws THE PROMISE ITSELF. Throwing a promise during render is
// exactly what "a component suspends" means: React's reconciler catches
// it, treats the subtree as "not ready yet," and retries the render when
// the promise settles.
type Resource<T> = { read(): T };

function wrapPromise<T>(promise: Promise<T>): Resource<T> {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  let error: unknown;

  const suspender = promise.then(
    (value) => {
      status = "success";
      result = value;
    },
    (err: unknown) => {
      status = "error";
      error = err;
    },
  );

  return {
    read() {
      if (status === "pending") throw suspender;
      if (status === "error") throw error;
      return result;
    },
  };
}

function createProfileResource(): Resource<Profile> {
  return wrapPromise(fetchProfileSuspense());
}

type PhaseId = "manual-start" | "manual-loaded" | "suspense-start" | "suspense-loaded";

interface PhaseInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

// Keep these snippets in sync with the actual code below — they're display
// copies, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const PHASES: Record<PhaseId, PhaseInfo> = {
  "manual-start": {
    label: "Manual: reload clicked",
    code: `// Reloading remounts ManualProfile (key={manualKey} where it's rendered),
// so isLoading's own useState(true) initial value covers the reset — no
// setIsLoading(true) call needed inside the effect itself.
function ManualProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfileManual().then((p) => {
      setProfile(p);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <Spinner />;
  return <ProfileCard profile={profile} />;
}`,
    explanation:
      "The component owns the loading flag itself: isLoading starts true, the effect kicks " +
      "off the fetch, and a spinner renders in the meantime. That bookkeeping is manual — the " +
      "component author has to get it right, and a fresh mount (one per reload) is what " +
      "resets it, rather than an explicit setState call.",
  },
  "manual-loaded": {
    label: "Manual: fetch resolved",
    code: `fetchProfileManual().then((p) => {
  setProfile(p);
  setIsLoading(false); // component explicitly flips its own flag back off
});`,
    explanation:
      "Once the promise resolves, the component sets its own state twice — profile and " +
      "isLoading — and only then does the real content replace the spinner.",
  },
  "suspense-start": {
    label: "Suspense: reload clicked",
    code: `function reloadSuspense() {
  // A brand-new resource is PENDING from the moment it's created, so the
  // next render of <SuspenseProfile> immediately suspends again.
  setResource(createProfileResource());
}

function SuspenseProfile({ resource }) {
  const profile = resource.read(); // throws the pending promise
  return <ProfileCard profile={profile} />;
}`,
    explanation:
      "SuspenseProfile never sets a loading flag — resource.read() just throws the pending " +
      "promise straight out of render. React catches that throw, unmounts the suspended " +
      "subtree, and shows the nearest <Suspense fallback> instead.",
  },
  "suspense-loaded": {
    label: "Suspense: promise resolved, retried",
    code: `<Suspense fallback={<Spinner />}>
  <SuspenseProfile resource={resource} />
</Suspense>

// Once the wrapped promise resolves, React retries rendering
// SuspenseProfile. This time resource.read() returns the value instead of
// throwing, so React swaps the fallback back out for the real content.`,
    explanation:
      "React was listening on the thrown promise. Once it resolved, React re-rendered " +
      "SuspenseProfile from scratch — this time resource.read() returns a value instead of " +
      "throwing, so the fallback is replaced by the real content.",
    outcome: "correct",
  },
};

function Spinner({ label }: { label: string }) {
  return (
    <p className="status-line">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <div className="resource-box">
      <p>
        <strong>{profile.name}</strong> (load #{profile.loadNumber})
      </p>
      <p>{profile.bio}</p>
    </div>
  );
}

function ManualProfile({ onPhase }: { onPhase: (id: PhaseId) => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;
    onPhase("manual-start");
    fetchProfileManual().then((p) => {
      if (cancelled) return;
      setProfile(p);
      setIsLoading(false);
      onPhase("manual-loaded");
    });
    return () => {
      cancelled = true;
    };
    // No `reloadKey` dependency needed: this component is remounted (via
    // `key={manualKey}` where it's rendered below) on every reload, so
    // `isLoading`'s useState(true) initial value already covers the reset —
    // calling setIsLoading(true) by hand here would be exactly the "calling
    // setState directly within an effect" anti-pattern react.dev warns
    // against.
  }, [onPhase]);

  if (isLoading) return <Spinner label="Loading profile…" />;
  // Safe: profile is always set by the time isLoading flips to false above.
  return <ProfileCard profile={profile!} />;
}

function SuspenseProfile({
  resource,
  onLoaded,
}: {
  resource: Resource<Profile>;
  onLoaded: () => void;
}) {
  const profile = resource.read();

  // This effect only ever runs once resource.read() returns a value instead
  // of throwing — i.e. only on a successful, committed render. There's no
  // equivalent "did we just finish loading" flag for this component to
  // manage by hand.
  useEffect(() => {
    onLoaded();
  }, [profile, onLoaded]);

  return <ProfileCard profile={profile} />;
}

export function App() {
  const [activePhase, setActivePhase] = useState<PhaseId | null>(null);

  const [manualKey, setManualKey] = useState(0);
  const [suspenseResource, setSuspenseResource] = useState<Resource<Profile>>(() =>
    createProfileResource(),
  );

  const onManualPhase = useCallback((id: PhaseId) => setActivePhase(id), []);
  const onSuspenseLoaded = useCallback(() => setActivePhase("suspense-loaded"), []);

  function reloadManual() {
    setManualKey((k) => k + 1);
  }

  function reloadSuspense() {
    setActivePhase("suspense-start");
    setSuspenseResource(createProfileResource());
  }

  const active = activePhase ? PHASES[activePhase] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Suspense basics</h1>
        <p>
          <code>{"<Suspense fallback={...}>"}</code> lets a component <strong>suspend</strong> —
          throw a promise instead of rendering — while React shows a fallback and retries once the
          promise settles. Compare that against the "do it by hand" version: a plain{" "}
          <code>isLoading</code> boolean set from a <code>useEffect</code>.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">What "suspending" means</h3>
          <p>
            Per react.dev, <code>{"<Suspense>"}</code> "lets you display a fallback until its
            children have finished loading." A component suspends by throwing something React
            recognizes as not-ready-yet (a pending promise, or a lazy import) instead of returning
            JSX.
          </p>
          <ul>
            <li>
              React catches that throw, walks up to the <strong>nearest parent</strong>{" "}
              <code>{"<Suspense>"}</code> boundary, and renders its <code>fallback</code> in place
              of the suspended subtree.
            </li>
            <li>
              When the thrown promise resolves, React <strong>retries</strong> rendering the
              suspended component — it doesn't resume mid-function, it re-runs it from the top.
            </li>
            <li>
              Nested components don't need to be direct children of the boundary — per react.dev,
              "any nested components that fetch data will share the closest parent Suspense
              boundary."
            </li>
          </ul>

          <h3 className="theory-subhead">
            <code>React.lazy</code> is Suspense's built-in use case
          </h3>
          <p>
            <code>lazy(load)</code> "lets you defer loading a component's code until it is rendered
            for the first time." The component it returns suspends (throws the in-flight dynamic
            import) until that import resolves, so react.dev requires it to be rendered inside a{" "}
            <code>{"<Suspense>"}</code> boundary:
          </p>
          <pre>
            <code>{`const MarkdownPreview = lazy(() => import("./MarkdownPreview.js"));

<Suspense fallback={<Loading />}>
  <MarkdownPreview />
</Suspense>`}</code>
          </pre>
          <p>
            React.dev also warns against declaring a <code>lazy</code> component inside another
            component — doing so recreates it (and resets its state) on every re-render, so declare
            it at module scope instead.
          </p>

          <h3 className="theory-subhead">Nesting boundaries</h3>
          <p>
            By default, react.dev notes, "the entire tree inside a Suspense component is treated as
            a single unit" — one suspension anywhere inside shows that one fallback for the whole
            subtree. Nesting boundaries lets different parts of the UI reveal themselves
            independently as each finishes, instead of the whole page waiting on the slowest piece.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p>
            Both panels below fetch a profile after a simulated {DELAY_MS}ms network delay. Click
            each <strong>Reload</strong> button and compare how the loading state is produced.
          </p>

          <div className="variant-panel">
            <h3>Manual isLoading</h3>
            <div className="demo-buttons">
              <button type="button" onClick={reloadManual}>
                Reload
              </button>
            </div>
            <ManualProfile key={manualKey} onPhase={onManualPhase} />
          </div>

          <div className="variant-panel">
            <h3>Suspense</h3>
            <div className="demo-buttons">
              <button type="button" onClick={reloadSuspense}>
                Reload
              </button>
            </div>
            <Suspense fallback={<Spinner label="Loading profile… (Suspense fallback)" />}>
              <SuspenseProfile resource={suspenseResource} onLoaded={onSuspenseLoaded} />
            </Suspense>
          </div>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                {active.outcome && (
                  <span className={`explain-outcome ${active.outcome}`}>
                    {active.outcome === "buggy" ? "⚠ Buggy: " : "✓ Idiomatic: "}
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
              Click a "Reload" button above to see the exact code that ran and why it behaved that
              way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
