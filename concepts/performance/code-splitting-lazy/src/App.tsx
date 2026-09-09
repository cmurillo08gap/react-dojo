import { Suspense, lazy, useState } from "react";
import { EagerPanel } from "./EagerPanel";

/**
 * Concept: Code-splitting with React.lazy
 *
 * Layout convention for every concept package — same shape as
 * hooks/use-state-basics/src/App.tsx:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last button pressed,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

// HeavyPanel is never statically imported anywhere in this package — the
// only path to its code is this dynamic import() inside React.lazy(), which
// is what lets Vite give it its own chunk on `pnpm build`. The artificial
// setTimeout delay exists purely so the Suspense fallback is reliably
// visible in this demo, even on a fast local dev server where the real
// network fetch would otherwise resolve too quickly to notice.
const LazyPanel = lazy(() =>
  new Promise((resolve) => setTimeout(resolve, 1200)).then(() => import("./HeavyPanel")),
);

type ActionId = "eager" | "lazy";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  eager: {
    label: "Toggle eager panel",
    code: `import { EagerPanel } from "./EagerPanel";

// A normal static import at the top of App.tsx — EagerPanel's code is
// already part of the main bundle before this button is ever clicked.
<EagerPanel />`,
    explanation:
      "EagerPanel is a plain, statically-imported component, so Vite bundled its code into " +
      "the main chunk whether or not you ever open this panel. Toggling it is instant because " +
      "there's no fetching or parsing left to do — it already happened on page load.",
  },
  lazy: {
    label: "Show lazy panel",
    code: `const LazyPanel = lazy(() =>
  new Promise((resolve) => setTimeout(resolve, 1200)).then(() =>
    import("./HeavyPanel"),
  ),
);

<Suspense fallback={<Spinner />}>
  <LazyPanel />
</Suspense>`,
    explanation:
      "React.lazy() wraps a dynamic import(), which Vite turns into a separate chunk on " +
      "build — HeavyPanel's code is only fetched and parsed the first time it's actually " +
      "rendered. Suspense shows the fallback while that import() promise is pending.",
  },
};

function Spinner() {
  return (
    <div className="spinner-row" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>Loading HeavyPanel chunk…</span>
    </div>
  );
}

export function App() {
  const [eagerVisible, setEagerVisible] = useState(false);
  const [lazyVisible, setLazyVisible] = useState(false);
  const [lazyShowCount, setLazyShowCount] = useState(0);
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  function toggleEager() {
    setActiveId("eager");
    setEagerVisible((visible) => !visible);
  }

  function toggleLazy() {
    setActiveId("lazy");
    setLazyVisible((visible) => {
      const next = !visible;
      if (next) setLazyShowCount((count) => count + 1);
      return next;
    });
  }

  const active = activeId ? ACTIONS[activeId] : null;
  const isRepeatLazyShow = activeId === "lazy" && lazyVisible && lazyShowCount > 1;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Code-splitting with React.lazy</h1>
        <p>
          A single bundle is simple but means every visitor downloads code for views they may never
          open. <code>React.lazy</code> plus <code>Suspense</code> lets you defer a component's code
          to its own chunk, fetched only when it's actually rendered.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">One bundle vs. many chunks</h3>
          <p>
            By default, a bundler like Vite/Rollup walks every static <code>import</code> from your
            entry point and concatenates the reachable code into one main JS file. That's fine for
            small apps, but it means a rarely-used view — an admin table, a chart, a settings modal
            — ships to <em>every</em> visitor, even the ones who never open it.
          </p>
          <pre>
            <code>{`const Comments = lazy(() => import('./Comments'));

<Suspense fallback={<Spinner />}>
  <Comments />
</Suspense>`}</code>
          </pre>
          <ul>
            <li>
              <code>React.lazy</code> takes a function that returns a dynamic <code>import()</code>{" "}
              — a promise that resolves to the module.
            </li>
            <li>
              A dynamic <code>import()</code> call is the signal a bundler looks for to split that
              module into its own chunk, fetched over the network on demand instead of at page load.
            </li>
            <li>
              <code>Suspense</code>'s <code>fallback</code> renders while that promise is pending —
              this is the same <code>Suspense</code> mechanism data-fetching libraries use, but here
              it's guarding a code fetch, not a data fetch (see{" "}
              <code>concurrent-features/suspense-basics</code> for that other use case).
            </li>
          </ul>

          <h3 className="theory-subhead">The trade-off</h3>
          <ul>
            <li>
              Eager (static) import: zero loading state, but the code ships up front even if unused.
            </li>
            <li>
              Lazy (dynamic) import: smaller main bundle, but the UI must handle a pending state —
              missing a <code>Suspense</code> boundary around a lazy component throws at render
              time.
            </li>
            <li>
              Once a lazy module's <code>import()</code> resolves, the browser's module cache keeps
              it resolved — remounting the same lazy component later doesn't re-fetch or re-suspend.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-buttons">
            <button onClick={toggleEager} data-active={activeId === "eager"}>
              {eagerVisible ? "Hide eager panel" : "Show eager panel"}
            </button>
            <button onClick={toggleLazy} data-active={activeId === "lazy"}>
              {lazyVisible ? "Hide lazy panel" : ACTIONS.lazy.label}
            </button>
          </div>

          <div className="demo-slot">
            {eagerVisible && <EagerPanel />}
            {lazyVisible && (
              <Suspense fallback={<Spinner />}>
                <LazyPanel />
              </Suspense>
            )}
          </div>

          {lazyShowCount > 0 && (
            <p className="cache-note">
              Lazy panel shown {lazyShowCount} time{lazyShowCount > 1 ? "s" : ""} this session.{" "}
              {lazyShowCount > 1
                ? "Notice the fallback no longer appears — the module is already in the cache."
                : "Hide it and show it again to see the fallback disappear on the second load."}
            </p>
          )}
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                {active.explanation}
                {isRepeatLazyShow &&
                  " This time there was no fallback at all — the dynamic import() already " +
                    "resolved once, so the module cache serves HeavyPanel synchronously and " +
                    "Suspense never has anything to wait on."}
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
