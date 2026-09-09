# Concept: Compound components

**Category:** patterns
**Difficulty:** intermediate
**Status:** template — expand as you work through it

## What this demonstrates

- A **compound component** family (`<Tabs>` + `<Tabs.List>` + `<Tabs.Tab>` +
  `<Tabs.Panels>` + `<Tabs.Panel>`) sharing the active tab **implicitly**
  via `createContext`/`useContext`, so the caller composes ordinary JSX
  and each subcomponent reads shared state on its own — no prop
  threading between them.
- The same feature built the opposite way: `<TabsMonolith tabs={[...]} />`,
  one component that owns every tab button and panel, driven entirely by a
  config array and a prop for each option (`disabledIds`, a per-tab
  `badge`).
- A concrete case of the contrast: disabling the "Settings" tab. In the
  monolith, that means `TabsMonolith`'s props _and_ its internal render
  loop both grow a `disabledIds` concept. In the compound version, it's a
  single `disabled` prop on the one `<Tabs.Tab>` that needs it — nothing
  shared changes.
- Why a Context **Provider's `value`** should generally be memoized
  (`useMemo` for the object, `useCallback` for any function inside it)
  when it's built from an object literal — an unmemoized value is a "new"
  value (by `Object.is`) on every render of the provider, which re-renders
  every consumer regardless of whether anything meaningful changed.

Run it:

```bash
pnpm --filter concept-compound-components dev
```

Open the printed local URL. The page shows a theory panel, the two
implementations side by side in the interactive demo, and a "What just
happened" panel that updates with the exact code that ran — click tabs and
each column's "Simulate restricted access" checkbox, and compare what each
implementation had to do.

## Key takeaways

- Compound components let a parent manage shared state while its children
  read or update that state without it being passed to them as explicit
  props — closer to how `<select>`/`<option>` work in HTML than to a
  single configurable component.
- `createContext(defaultValue)` creates the context; `useContext` reads
  the value from the nearest provider above the calling component and
  automatically re-renders that component when it changes. React 19 lets
  you render the context object itself as the provider
  (`<TabsContext value={...}>`) instead of `<TabsContext.Provider>`.
- Before reaching for context, react.dev suggests two cheaper
  alternatives: pass props explicitly, or restructure components to accept
  `children` so a value only has to reach the component that renders it.
  Context earns its place once a value needs to reach an arbitrary,
  unknown number of descendants — exactly the `Tabs.Tab`/`Tabs.Panel`
  situation here.
- A subcomponent that only works inside its parent's provider should say
  so loudly: this demo's `useTabsContext` throws a clear error if
  `useContext` comes back empty, instead of silently rendering broken UI.

## Discussion / interview questions

1. Why does prop-drilling get worse as the monolithic component grows, and
   how does the compound pattern avoid it?
2. What's the downside of the compound pattern — e.g. subcomponents only
   work inside the parent's Context, and there are order/nesting
   assumptions a type system won't catch for you (e.g. rendering
   `<Tabs.Tab>` outside `<Tabs>` entirely)?
3. Why does the demo wrap the context's `value` in `useMemo`? What would
   change if `<Tabs>` passed `{ activeId, select: onChange }` as an inline
   object literal instead?
4. `TabsMonolith` and `Tabs` end up rendering visually identical tab bars.
   If a design system needed a hundred configurable tab options, which
   approach would you rather maintain, and why?

## Further reading

- [react.dev — `createContext`](https://react.dev/reference/react/createContext)
- [react.dev — `useContext`](https://react.dev/reference/react/useContext)
- [react.dev — Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
