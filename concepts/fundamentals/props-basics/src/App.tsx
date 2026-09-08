import { useState } from "react";

/**
 * Concept: props basics
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
 */

const NAMES = ["Ada", "Grace", "Rex"] as const;
type Name = (typeof NAMES)[number];

// 🐛 Copies the incoming prop into local state ONCE, on mount. Every
// re-render after that reads the stale local copy — the prop keeps
// changing, but this component never notices.
function MirroredFromProp({ name }: { name: Name }) {
  const [mirroredName] = useState(name);
  return (
    <div className="mini-counter" data-flavor="unstable">
      <p className="mini-label">useState(props.name)</p>
      <p className="mini-count">{mirroredName}</p>
    </div>
  );
}

// ✅ Reads the prop directly on every render — no local copy to go stale.
function ReadsPropDirectly({ name }: { name: Name }) {
  return (
    <div className="mini-counter" data-flavor="stable">
      <p className="mini-label">props.name (direct)</p>
      <p className="mini-count">{name}</p>
    </div>
  );
}

type ActionId = Name;

interface ActionInfo {
  code: string;
  explanation: string;
}

// Keep this snippet in sync with the actual components above — it's a
// display copy, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const CHANGE_NAME_CODE = `function MirroredFromProp({ name }) {
  // Only reads "name" on the FIRST render — every value passed after
  // that is ignored.
  const [mirroredName] = useState(name);
  return <p>{mirroredName}</p>;
}

function ReadsPropDirectly({ name }) {
  // Always reflects the current prop, because there's no local copy.
  return <p>{name}</p>;
}`;

export function App() {
  const [nameIndex, setNameIndex] = useState(0);
  const [activeId, setActiveId] = useState<ActionId | null>(null);
  const currentName = NAMES[nameIndex] ?? NAMES[0];

  function changeNameTo(id: ActionId, index: number) {
    setNameIndex(index);
    setActiveId(id);
  }

  const active: ActionInfo | null = activeId
    ? {
        code: CHANGE_NAME_CODE,
        explanation:
          nameIndex === 0
            ? `App's name prop is now "${currentName}" (the first value both children ever ` +
              `saw, so they still agree).`
            : `App's name prop is now "${currentName}". The mirrored child is still showing ` +
              `"${NAMES[0]}" — the value it copied into useState on its very first render — ` +
              `while the direct-read child correctly shows "${currentName}".`,
      }
    : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Props basics</h1>
        <p>
          Props flow one way: <strong>parent → child</strong>. A child re-renders with fresh props
          whenever its parent gives it new ones — but only if the child actually reads the prop each
          render, instead of copying it into its own state.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Passing props</h3>
          <p>
            Props are just the arguments to a component function — passed as attributes in JSX, read
            as a single object parameter (usually destructured).
          </p>
          <pre>
            <code>{`<Greeting name="Ada" />
function Greeting({ name }) { return <p>Hi, {name}</p>; }`}</code>
          </pre>
          <ul>
            <li>
              Props are <strong>read-only</strong> from the child's perspective — the child never
              assigns to them directly. To change what a parent renders, the child calls a callback
              prop the parent passed down ("props down, events up").
            </li>
            <li>
              <code>children</code> is just a prop like any other — whatever's nested between a
              component's JSX tags.
            </li>
            <li>
              Destructuring supports defaults: <code>{'function Btn({ kind = "primary" })'}</code>.
            </li>
          </ul>

          <h3 className="theory-subhead">Don't mirror props into state</h3>
          <ul>
            <li>
              <code>useState(props.value)</code> only reads <code>props.value</code> on the{" "}
              <em>initial</em> render — the hook's argument is an initializer, not a subscription.
            </li>
            <li>
              If a component just needs to display the current prop, read it directly — don't route
              it through <code>useState</code> at all.
            </li>
            <li>
              Local state should hold something the component <em>owns</em> (an input draft, a
              toggle) — not a copy of data its parent already tracks.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="mini-counter-row">
            <MirroredFromProp name={currentName} />
            <ReadsPropDirectly name={currentName} />
          </div>
          <div className="demo-buttons">
            {NAMES.map((name, index) => (
              <button
                key={name}
                onClick={() => changeNameTo(name, index)}
                data-active={activeId === name}
              >
                Set name to "{name}"
              </button>
            ))}
          </div>
          <p className="demo-hint">
            Click through all three names in order and compare the two panels above.
          </p>
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
              Click a name above to change App's <code>name</code> prop and see how each child
              responds.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
