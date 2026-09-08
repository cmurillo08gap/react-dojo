# Concept: JSX & components

**Category:** fundamentals
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- JSX isn't HTML — it's sugar for function calls. `<Greeting name="Ada" />`
  compiles (via the automatic JSX runtime) to `jsx(Greeting, { name: "Ada" })`,
  a plain function call that returns a plain JS object.
- Tag capitalization is meaningful, not stylistic: a lowercase tag compiles
  to a **string** (a host/DOM element name); a capitalized tag compiles to a
  **reference** to that identifier in scope.
- A component is nothing more than a function that returns one of those
  descriptions — but _where_ you define that function matters. Defining a
  component inside another component's body creates a **new function
  identity every render**, which React treats as a different component
  type and remounts, losing local state.

Run it:

```bash
pnpm --filter concept-jsx-and-components dev
```

Open the printed local URL. Bump both mini counters a few times, then click
"Re-render App" and compare what happens to each count.

## Key takeaways

- Always define components at module scope (or behind a stable reference),
  never inside another component's function body.
- React decides whether to reuse or remount a component instance by
  comparing the element's `type` at that position in the tree — for a
  component, `type` **is** the function object itself.
- A "different type at the same position" is a full unmount + remount: all
  local state and effects for that subtree are discarded and recreated.
- This is the same mechanism behind "preserving and resetting state" —
  position and type in the tree, not the JSX call site, determine identity.

## Discussion / interview questions

1. Why does `UnstableCounter`'s count reset when `App` re-renders, but
   `StableCounter`'s doesn't?
2. What would happen if `UnstableCounter` were defined inside `App` but
   `App` never re-rendered? Would the bug ever manifest?
3. Besides moving the definition to module scope, is there another way to
   give a component a stable identity across renders (hint: `useMemo` around
   a factory — and why is that usually the wrong tool here)?
4. Why does React use `type` (not JSX source location) to decide whether to
   reuse a component instance?

## Further reading

- [react.dev — Your First Component](https://react.dev/learn/your-first-component)
- [react.dev — Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)
- [react.dev — Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
