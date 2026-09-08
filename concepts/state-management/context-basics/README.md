# Concept: Context basics

**Category:** state-management
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- **Prop drilling**: passing a value (and an updater callback) as props
  through intermediate components that never use it themselves — they only
  forward it — down to a leaf several levels deep that actually reads and
  changes it.
- **`createContext` + `useContext`**: the same value and updater made
  available directly to that leaf via a provider at the top of the tree,
  with the intermediate components carrying no props for it at all.
- **The memoization pitfall**: a context value provided as a fresh object
  literal (`{ label }`) on every provider render, vs. the same object
  memoized with `useMemo`. The unmemoized version forces every subscribed
  consumer to re-render whenever the provider re-renders for *any* reason —
  even a `React.memo`-wrapped consumer with no props at all — because
  `Object.is(oldValue, newValue)` is `false` for a brand-new object even
  when its contents are unchanged. The memoized version keeps the same
  object reference across unrelated re-renders, so its consumer bails out.

Run it:

```bash
pnpm --filter concept-context-basics dev
```

Open the printed local URL. The page shows a theory panel, the interactive
demo, and a "What just happened" panel that updates with the exact code
that ran and why. Use the **Mode** tabs in the demo panel to switch between
the three sub-demos:

1. **Prop drilling** — click "Rename to Grace"/"Rename to Ada" and note the
   component chain shown above the card (`DrillingDemo → DrillingLayout →
   DrillingSidebar → DrillingProfileCard`); `DrillingLayout` and
   `DrillingSidebar` both take `userName`/`onRename` props purely to pass
   them on.
2. **Context** — same rename buttons, same visual result, but
   `ContextLayout` and `ContextSidebar` take no props at all — only
   `ContextProfileCard` calls `useUserContext()`.
3. **Memoization pitfall** — click "Re-render providers (unrelated
   state)" repeatedly and watch the two render-count badges: the
   **unmemoized** consumer's count climbs every click; the **memoized**
   consumer's count stays put, even though both providers re-rendered.

## Key takeaways

- Prop drilling isn't wrong — it's the default, and often the simplest and
  most explicit option for one or two levels. It becomes a real problem
  when many intermediate components exist only to forward a value they
  don't otherwise use, or when that value needs to reach a component
  several refactors deep.
- `useContext(SomeContext)` reads the value from the **nearest** provider
  above the calling component and subscribes that component to future
  changes — intermediate components need no awareness that the context
  exists.
- React 19 lets a context object be rendered directly as a provider
  (`<SomeContext value={...}>`); the older `<SomeContext.Provider>` form
  still works but is on a path to deprecation.
- Every consumer of a context re-renders whenever the value passed to its
  provider changes identity (`Object.is`), regardless of whether the data
  inside it is logically the same. A fresh `{ ... }`/`[ ... ]`/`() => {}`
  literal built inline in the provider's render body is a *new* value every
  time, even with identical contents.
- `useMemo(() => ({ ... }), deps)` keeps the same object reference across
  renders where `deps` hasn't changed, letting consumers — including ones
  wrapped in `React.memo` — bail out of re-rendering when the provider
  re-renders for an unrelated reason.
- `React.memo` only stops a component from re-rendering due to unchanged
  **props**; it does not stop a re-render triggered by a **context value**
  the component reads changing identity. The two are separate mechanisms
  that happen to combine well once the context value itself is stable.

## Discussion / interview questions

1. When is prop drilling actually the better choice over reaching for
   context? (Hint: think about how many levels, how many consumers, and
   how explicit you want the data flow to stay.)
2. Why does wrapping a context-consuming component in `React.memo` *not*,
   by itself, prevent it from re-rendering when the provider above it
   re-renders?
3. If a context's value is `{ user, setUser }` and only `user` ever
   changes, what's the tradeoff of splitting it into two separate contexts
   (one for `user`, one for `setUser`) instead of memoizing one combined
   object?
4. `useReducer` is often paired with context for shared state (`dispatch`
   has a stable identity for free). How does that sidestep part of the
   memoization pitfall shown here?

## Further reading

- [react.dev — Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [react.dev — `createContext`](https://react.dev/reference/react/createContext)
- [react.dev — `useContext`](https://react.dev/reference/react/useContext)
- [react.dev — `memo`](https://react.dev/reference/react/memo) (see "Updating
  a memoized component with context")
- [react.dev — React 19: `<Context>` as a provider](https://react.dev/blog/2024/12/05/react-19#context-as-a-provider)
