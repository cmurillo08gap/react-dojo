import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Concept: Compound components
 *
 * Layout convention for every concept package — see ./README.md and
 * hooks/use-state-basics/src/App.tsx for the reference shape:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last control used,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo builds the same tabbed "Account" widget two ways, side by side:
 *
 *   - TabsMonolith  — one big component driven by a `tabs` config array
 *     plus props for every option (`disabledIds`, a per-tab `badge`). Any
 *     new per-tab feature means growing that config shape AND this
 *     component's internal render loop.
 *   - Tabs / Tabs.List / Tabs.Tab / Tabs.Panels / Tabs.Panel — a compound
 *     component sharing the active tab implicitly via createContext/
 *     useContext, so the caller composes ordinary JSX and each
 *     subcomponent reads shared state on its own. Adding a badge or a
 *     disabled tab is just a prop/child at the call site — no shared
 *     component's internals change.
 *
 * See ./README.md for the full write-up, discussion questions, and the
 * react.dev pages this was checked against (createContext, useContext,
 * "Passing Data Deeply with Context").
 */

type TabId = "profile" | "settings" | "billing";

type ActionId = "select-monolith" | "select-compound" | "restrict-monolith" | "restrict-compound";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
}

// Keep these snippets in sync with the actual code below — they're display
// copies, not derived automatically, so the reader sees exactly what ran
// without any build-time magic.
const ACTIONS: Record<ActionId, ActionInfo> = {
  "select-monolith": {
    label: "Prop-drilling: tab clicked",
    code: `function TabsMonolith({ tabs, activeId, onChange, disabledIds = [] }: TabsMonolithProps) {
  return (
    <div className="tabs-widget">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          disabled={disabledIds.includes(tab.id)}
          data-active={tab.id === activeId}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.badge !== undefined && <span className="tab-badge">{tab.badge}</span>}
        </button>
      ))}
      {tabs.find((tab) => tab.id === activeId)?.content}
    </div>
  );
}`,
    explanation:
      "Clicking a tab calls the onChange prop the parent threaded into TabsMonolith. A single " +
      "component owns the tab buttons AND the panel content, both driven entirely by the tabs " +
      "config array plus the activeId/onChange props passed down from above.",
  },
  "select-compound": {
    label: "Compound: tab clicked",
    code: `function Tab({ id, disabled, children }: TabProps) {
  const { activeId, select } = useTabsContext("Tab");
  return (
    <button disabled={disabled} data-active={id === activeId} onClick={() => select(id)}>
      {children}
    </button>
  );
}`,
    explanation:
      "Tab reads activeId and select straight from TabsContext via useContext — no activeId or " +
      "onChange prop exists on <Tabs.Tab> itself. Only the outer <Tabs> received those two " +
      "props; every subcomponent below it pulls them from context instead of being passed them " +
      "explicitly.",
  },
  "restrict-monolith": {
    label: "Prop-drilling: restrict Settings",
    code: `interface TabsMonolithProps {
  tabs: MonolithTabConfig[];
  activeId: TabId;
  onChange: (id: TabId) => void;
  disabledIds?: TabId[]; // <- had to add this prop, and an includes() check
}                        //    inside the render loop, just to disable one tab

<TabsMonolith
  tabs={MONOLITH_TABS}
  activeId={monolithActiveId}
  onChange={selectMonolith}
  disabledIds={monolithRestricted ? ["settings"] : []}
/>`,
    explanation:
      "Disabling one tab meant TabsMonolith's props AND its internal render loop both had to " +
      "grow a disabledIds concept. The next per-tab feature (a tooltip, a confirm-before-leaving " +
      "guard) needs the same treatment again — extend the config/props shape, then edit this one " +
      "component's internals a second time.",
  },
  "restrict-compound": {
    label: "Compound: restrict Settings",
    code: `<Tabs.Tab id="settings" disabled={compoundRestricted}>
  Settings
</Tabs.Tab>`,
    explanation:
      "disabled is just a normal prop passed to the one <Tabs.Tab> that needs it — it was already " +
      "part of Tab's props, so nothing about Tabs, Tabs.List, or Tabs.Panels changed. Composing a " +
      "new per-tab behavior is a call-site change only, not an edit to a shared component.",
  },
};

// ---------------------------------------------------------------------------
// 1. Prop-drilling version — one monolithic component, driven entirely by a
// config array + props. Every new per-tab feature (the "badge" below, the
// "disabledIds" list) means extending this shape and this render function.
// ---------------------------------------------------------------------------

interface MonolithTabConfig {
  id: TabId;
  label: string;
  badge?: number;
  content: ReactNode;
}

interface TabsMonolithProps {
  tabs: MonolithTabConfig[];
  activeId: TabId;
  onChange: (id: TabId) => void;
  disabledIds?: TabId[];
}

function TabsMonolith({ tabs, activeId, onChange, disabledIds = [] }: TabsMonolithProps) {
  const activeTab = tabs.find((tab) => tab.id === activeId);
  return (
    <div className="tabs-widget">
      <div className="tabs-list" role="tablist" aria-label="Account (prop-drilling)">
        {tabs.map((tab) => {
          const disabled = disabledIds.includes(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeId}
              disabled={disabled}
              data-active={tab.id === activeId}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {tab.badge !== undefined && <span className="tab-badge">{tab.badge}</span>}
            </button>
          );
        })}
      </div>
      <div className="tabs-panel" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}

const MONOLITH_TABS: MonolithTabConfig[] = [
  {
    id: "profile",
    label: "Profile",
    content: <p>Your public profile: display name, avatar, and bio.</p>,
  },
  {
    id: "settings",
    label: "Settings",
    content: <p>Notification preferences and password.</p>,
  },
  {
    id: "billing",
    label: "Billing",
    badge: 2,
    content: <p>2 invoices are due — update your card to avoid a lapse.</p>,
  },
];

// ---------------------------------------------------------------------------
// 2. Compound component version — <Tabs> shares the active tab via context,
// so each subcomponent reads it directly and the caller composes plain JSX
// instead of passing a config array through one component's props.
// ---------------------------------------------------------------------------

interface TabsContextValue {
  activeId: TabId;
  select: (id: TabId) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(componentName: string): TabsContextValue {
  const value = useContext(TabsContext);
  if (!value) {
    // Guards against the compound pattern's main downside: these
    // subcomponents only work inside a <Tabs> provider — see README.md's
    // discussion questions.
    throw new Error(`<Tabs.${componentName}> must be rendered inside a <Tabs> parent.`);
  }
  return value;
}

interface TabsProps {
  activeId: TabId;
  onChange: (id: TabId) => void;
  children: ReactNode;
}

function TabsRoot({ activeId, onChange, children }: TabsProps) {
  // Memoized so the context value keeps the same identity across renders
  // that don't actually change activeId/onChange — an inline object literal
  // here would give every consumer a "new" value (by Object.is) on every
  // render of TabsRoot, forcing them all to re-render regardless. See the
  // theory panel and README.md for the react.dev source on this.
  const value = useMemo<TabsContextValue>(
    () => ({ activeId, select: onChange }),
    [activeId, onChange],
  );
  return <TabsContext value={value}>{children}</TabsContext>;
}

function TabsList({ children }: { children: ReactNode }) {
  return (
    <div className="tabs-list" role="tablist" aria-label="Account (compound)">
      {children}
    </div>
  );
}

interface TabProps {
  id: TabId;
  disabled?: boolean;
  children: ReactNode;
}

function Tab({ id, disabled, children }: TabProps) {
  const { activeId, select } = useTabsContext("Tab");
  return (
    <button
      type="button"
      role="tab"
      aria-selected={id === activeId}
      disabled={disabled}
      data-active={id === activeId}
      onClick={() => select(id)}
    >
      {children}
    </button>
  );
}

function TabPanels({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

interface TabPanelProps {
  id: TabId;
  children: ReactNode;
}

function TabPanel({ id, children }: TabPanelProps) {
  const { activeId } = useTabsContext("Panel");
  if (id !== activeId) return null;
  return (
    <div className="tabs-panel" role="tabpanel">
      {children}
    </div>
  );
}

// Functions are objects, so a plain function component can carry static
// properties — this is what makes `<Tabs.List>`, `<Tabs.Tab>`, etc. valid
// JSX while `Tabs` itself stays a normal, callable component.
const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab,
  Panels: TabPanels,
  Panel: TabPanel,
});

// ---------------------------------------------------------------------------

export function App() {
  const [monolithActiveId, setMonolithActiveId] = useState<TabId>("profile");
  const [compoundActiveId, setCompoundActiveId] = useState<TabId>("profile");
  const [monolithRestricted, setMonolithRestricted] = useState(false);
  const [compoundRestricted, setCompoundRestricted] = useState(false);
  const [activeId, setActiveId] = useState<ActionId | null>(null);

  function selectMonolith(id: TabId) {
    setMonolithActiveId(id);
    setActiveId("select-monolith");
  }

  function selectCompound(id: TabId) {
    setCompoundActiveId(id);
    setActiveId("select-compound");
  }

  function restrictMonolith(next: boolean) {
    setMonolithRestricted(next);
    setActiveId("restrict-monolith");
  }

  function restrictCompound(next: boolean) {
    setCompoundRestricted(next);
    setActiveId("restrict-compound");
  }

  const active = activeId ? ACTIONS[activeId] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>Compound components</h1>
        <p>
          A <code>{"<Tabs>"}</code> widget can be built as one monolithic component that takes a
          config array and a prop for every option, or as a family of small components that share
          state <strong>implicitly via Context</strong> — letting the caller compose plain JSX
          instead of threading options through a single giant component.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">The compound components pattern</h3>
          <p>
            Compound components are a set of components designed to be used together — like{" "}
            <code>{"<select>"}</code>/<code>{"<option>"}</code> in HTML — where a parent manages
            shared state and its children read or update that state without it being passed to them
            as explicit props. The consumer composes the pieces freely in JSX, instead of
            configuring one component through a big props object.
          </p>

          <h3 className="theory-subhead">
            Sharing state with <code>createContext</code> / <code>useContext</code>
          </h3>
          <pre>
            <code>{`const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ activeId, onChange, children }: TabsProps) {
  const value = useMemo(() => ({ activeId, select: onChange }), [activeId, onChange]);
  return <TabsContext value={value}>{children}</TabsContext>;
}

function Tab({ id, children }: TabProps) {
  const { activeId, select } = useContext(TabsContext)!; // reads it directly
  ...
}`}</code>
          </pre>
          <ul>
            <li>
              <code>createContext(defaultValue)</code> makes a context object outside any component;{" "}
              <code>defaultValue</code> is only used when there's no matching provider above the
              reading component (this demo passes <code>null</code> and throws instead, see "Key
              rules" below).
            </li>
            <li>
              React 19 lets a context object be rendered directly as a provider (
              <code>{"<TabsContext value={...}>"}</code>) — the older{" "}
              <code>{"<TabsContext.Provider>"}</code> still works but is on a path to deprecation.
            </li>
            <li>
              <code>useContext(TabsContext)</code> always returns the value from the{" "}
              <em>nearest</em> provider above the calling component, and React automatically
              re-renders that component whenever the value changes — no intermediate component needs
              to know <code>TabsContext</code> exists.
            </li>
          </ul>

          <h3 className="theory-subhead">Provider value identity</h3>
          <p>
            A component consuming context re-renders whenever the provider passes a <em>new</em>{" "}
            value, compared with <code>Object.is</code>. An inline object literal (
            <code>{"{ activeId, select }"}</code>) is a new value on every render of the provider,
            even when nothing meaningful changed — wrapping it in <code>useMemo</code> (and any
            function inside it in <code>useCallback</code>) keeps the same reference across renders
            where <code>activeId</code>/<code>onChange</code> didn't change, so consumers can skip
            re-rendering.
          </p>

          <h3 className="theory-subhead">Key rules</h3>
          <ul>
            <li>
              Before reaching for context at all, react.dev suggests two cheaper options: pass props
              explicitly (it's more verbose but makes data flow obvious), or restructure components
              to accept <code>children</code> so a value only has to reach the component that
              actually renders it. Context is for when neither of those is practical — exactly the
              case here, where an arbitrary number of <code>Tabs.Tab</code>/<code>Tabs.Panel</code>{" "}
              pairs all need the same state.
            </li>
            <li>
              A subcomponent that calls <code>useContext</code> and gets back the default (or{" "}
              <code>null</code>) value is a sign it was rendered outside its provider. This demo's{" "}
              <code>useTabsContext</code> throws a clear error in that case, instead of silently
              rendering broken UI.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <p>
            The same "Account" tabs, built two ways. Click tabs and each column's checkbox — the{" "}
            <strong>What just happened</strong> panel below shows exactly what ran.
          </p>

          <div className="tabs-columns">
            <div>
              <p className="tabs-column-label">
                <span className="pattern-badge" data-pattern="drilling">
                  prop-drilling
                </span>
                <code>{"<TabsMonolith tabs={...} />"}</code>
              </p>
              <label className="access-toggle">
                <input
                  type="checkbox"
                  checked={monolithRestricted}
                  onChange={(e) => restrictMonolith(e.target.checked)}
                />
                Simulate restricted access (disable Settings)
              </label>
              <TabsMonolith
                tabs={MONOLITH_TABS}
                activeId={monolithActiveId}
                onChange={selectMonolith}
                disabledIds={monolithRestricted ? ["settings"] : []}
              />
            </div>

            <div>
              <p className="tabs-column-label">
                <span className="pattern-badge" data-pattern="compound">
                  compound + context
                </span>
                <code>{"<Tabs> ... </Tabs>"}</code>
              </p>
              <label className="access-toggle">
                <input
                  type="checkbox"
                  checked={compoundRestricted}
                  onChange={(e) => restrictCompound(e.target.checked)}
                />
                Simulate restricted access (disable Settings)
              </label>
              <Tabs activeId={compoundActiveId} onChange={selectCompound}>
                <Tabs.List>
                  <Tabs.Tab id="profile">Profile</Tabs.Tab>
                  <Tabs.Tab id="settings" disabled={compoundRestricted}>
                    Settings
                  </Tabs.Tab>
                  <Tabs.Tab id="billing">
                    Billing <span className="tab-badge">2</span>
                  </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panels>
                  <Tabs.Panel id="profile">
                    <p>Your public profile: display name, avatar, and bio.</p>
                  </Tabs.Panel>
                  <Tabs.Panel id="settings">
                    <p>Notification preferences and password.</p>
                  </Tabs.Panel>
                  <Tabs.Panel id="billing">
                    <p>2 invoices are due — update your card to avoid a lapse.</p>
                  </Tabs.Panel>
                </Tabs.Panels>
              </Tabs>
            </div>
          </div>
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
              Click a tab or a checkbox above to see the exact code that ran and why it behaved that
              way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
