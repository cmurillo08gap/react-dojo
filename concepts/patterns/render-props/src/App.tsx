import { useState } from "react";
import { MouseTracker, type MousePosition } from "./MouseTracker";
import { useMouseTracker } from "./useMouseTracker";

/**
 * Concept: render props
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
 * The demo below tracks the cursor's position inside a box — the exact
 * same stateful logic — built two ways: first as a render-props component
 * that owns the state/effect and shares it via a function passed as
 * `children` (./MouseTracker.tsx, the pre-hooks pattern), then as a
 * `useMouseTracker` custom hook called directly (./useMouseTracker.ts).
 * Move the mouse into either box to see the exact code behind it.
 */

type ImplId = "render-props" | "hook";

interface ImplInfo {
  id: ImplId;
  label: string;
  code: string;
  explanation: string;
}

// Keep these snippets in sync with MouseTracker.tsx / useMouseTracker.ts —
// they're display copies, not derived automatically, so the reader sees
// exactly what ran without any build-time magic.
const ACTIONS: Record<ImplId, ImplInfo> = {
  "render-props": {
    id: "render-props",
    label: "Render props",
    code: `function MouseTracker({ children }) {
  const surfaceRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = surfaceRef.current;
    function handleMouseMove(event) {
      const rect = node.getBoundingClientRect();
      setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    }
    node.addEventListener("mousemove", handleMouseMove);
    return () => node.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // "children" is called as a function, not rendered as JSX directly —
  // this is the render prop.
  return <div ref={surfaceRef}>{children(pos)}</div>;
}

// consumer:
<MouseTracker>
  {(pos) => <Dot pos={pos} />}
</MouseTracker>`,
    explanation:
      "MouseTracker owns the state and effect, then hands the position to whatever " +
      "function you pass as children. It works, but every consumer inherits an extra " +
      "wrapper component (and DOM node) in the tree — MouseTracker only knows how to " +
      "track one surface, so tracking a second thing means nesting a second MouseTracker.",
  },
  hook: {
    id: "hook",
    label: "Custom hook",
    code: `function useMouseTracker() {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = ref.current;
    function handleMouseMove(event) {
      const rect = node.getBoundingClientRect();
      setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    }
    node.addEventListener("mousemove", handleMouseMove);
    return () => node.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return { ref, pos };
}

// consumer — no wrapper component, attaches to its own element:
const { ref, pos } = useMouseTracker();
return <div ref={ref}><Dot pos={pos} /></div>;`,
    explanation:
      "The identical tracking logic, called directly inside the component that needs " +
      "it — no wrapper component, no function-as-children indirection. Tracking a " +
      "second thing (or combining it with another custom hook) is just one more hook " +
      "call, not another level of nesting.",
  },
};

function Dot({ pos }: { pos: MousePosition }) {
  return (
    <div
      className="tracker-dot"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      aria-hidden="true"
    />
  );
}

function Coords({ pos }: { pos: MousePosition }) {
  return (
    <p className="tracker-coords">
      x: <strong>{Math.round(pos.x)}</strong>, y: <strong>{Math.round(pos.y)}</strong>
    </p>
  );
}

interface TrackerBoxProps {
  onEnter: () => void;
}

function RenderPropsTrackerBox({ onEnter }: TrackerBoxProps) {
  return (
    <div className="tracker-box" data-flavor="render-props" onMouseEnter={onEnter}>
      <p className="tracker-label">Render props (&lt;MouseTracker&gt;)</p>
      <MouseTracker>
        {(pos) => (
          <>
            <Dot pos={pos} />
            <Coords pos={pos} />
          </>
        )}
      </MouseTracker>
    </div>
  );
}

function HookTrackerBox({ onEnter }: TrackerBoxProps) {
  const { ref, pos } = useMouseTracker();
  return (
    <div className="tracker-box" data-flavor="hook" onMouseEnter={onEnter}>
      <p className="tracker-label">Custom hook (useMouseTracker)</p>
      <div className="tracker-surface" ref={ref}>
        <Dot pos={pos} />
        <Coords pos={pos} />
      </div>
    </div>
  );
}

export function App() {
  const [activeId, setActiveId] = useState<ImplId | null>(null);

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Render props</h1>
        <p>
          Before hooks existed, sharing <strong>stateful logic</strong> between components usually
          meant wrapping it in a component that called a function prop — often named{" "}
          <code>children</code> or <code>render</code> — with whatever state it owned. Move your
          mouse into each box below: both track the exact same "cursor position inside this element"
          logic, one written as a render prop, the other as a custom hook.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">The render-props pattern</h3>
          <p>
            A component that owns some state/effect and, instead of rendering fixed JSX, calls a
            function it received as a prop — passing that function the state so the <em>caller</em>{" "}
            decides what to render with it. When that function is passed as <code>children</code>{" "}
            (rather than a prop literally named <code>render</code>), it's written as a function
            between the component's open/close tags:
          </p>
          <pre>
            <code>{`<MouseTracker>
  {(pos) => <Cursor position={pos} />}
</MouseTracker>`}</code>
          </pre>
          <p>
            This is just JSX-as-props taken one step further — <code>children</code> is an ordinary
            prop, and there's nothing stopping it from being a function instead of rendered
            elements.
          </p>

          <h3 className="theory-subhead">The custom hook alternative</h3>
          <p>
            A custom hook is <strong>just a function</strong> whose name starts with{" "}
            <code>use</code> and that calls other hooks internally — here, <code>useState</code> and{" "}
            <code>useEffect</code>. Per react.dev's "Reusing Logic with Custom Hooks," custom hooks
            let components share <em>stateful logic</em>, not state itself — each call gets its own
            independent state, exactly like each <code>&lt;MouseTracker&gt;</code> instance does.
          </p>

          <h3 className="theory-subhead">Why hooks displaced most render-prop use cases</h3>
          <ul>
            <li>
              <strong>No extra component in the tree.</strong> <code>&lt;MouseTracker&gt;</code>{" "}
              always renders its own wrapper element, whether the consumer wants one or not.{" "}
              <code>useMouseTracker()</code> returns a ref the consumer attaches to an element it
              was already rendering.
            </li>
            <li>
              <strong>Composing several pieces of logic doesn't nest.</strong> Two custom hooks are
              two calls side by side; two render-props components sharing one subtree have to nest
              inside each other ("wrapper hell"). React's own docs describe hooks as something you
              can "compose together, pass data between them, and reuse... between components" —
              nesting isn't part of that story.
            </li>
            <li>
              <strong>Simpler types, no naming collisions.</strong> A hook's return value is a plain
              object/tuple; a render prop's signature has to be threaded through generics, and two
              libraries both wanting the <code>children</code>-as-function slot can't compose at
              all.
            </li>
          </ul>

          <h3 className="theory-subhead">Where render props still earn their place</h3>
          <p>
            react.dev's own <code>Children</code> reference still documents render props for cases
            where a <em>library-controlled</em> component decides <em>when</em> and{" "}
            <em>how many times</em> to call your function — a list component calling{" "}
            <code>renderRow(id, index)</code> once per row it decides to render, for example.
            Headless UI libraries lean on this: the library owns the behavior (open/closed,
            selection, positioning) and hands your function the JSX-shaped state to render, because
            it — not you — controls the loop or timing that decides when to call it.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p>
            Move the mouse into each box — the dot and the coordinates below it come from the exact
            same tracking logic in both.
          </p>
          <div className="tracker-row">
            <RenderPropsTrackerBox onEnter={() => setActiveId("render-props")} />
            <HookTrackerBox onEnter={() => setActiveId("hook")} />
          </div>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                <span className={`explain-outcome ${active.id}`}>{active.label}: </span>
                {active.explanation}
              </p>
              <pre>
                <code>{active.code}</code>
              </pre>
            </div>
          ) : (
            <p className="explain-placeholder">
              Move your mouse into a box above to see the exact code behind it and why it's
              structured that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
