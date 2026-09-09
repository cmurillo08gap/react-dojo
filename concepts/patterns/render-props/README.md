# Concept: Render props

**Category:** patterns
**Difficulty:** intermediate
**Status:** template — expand as you work through it

## What this demonstrates

- The **render-props pattern**: a component (`<MouseTracker>`) owns some
  state and an effect internally, and instead of rendering fixed JSX,
  calls a function passed to it as `children` — handing that function the
  state so the caller decides what to render with it. This is the
  pre-hooks way to share _stateful logic_ between components.
- The **identical logic extracted into a custom hook** (`useMouseTracker`)
  instead — called directly inside the component that needs it, with no
  wrapper component and no function-as-children indirection.
- Both implementations track the cursor's position inside a box using the
  exact same `useState` + `useEffect` + `mousemove` listener code — move
  the mouse into either box in the demo to see them behave identically.

Run it:

```bash
pnpm --filter concept-render-props dev
```

Open the printed local URL. The page shows a theory panel, the
interactive demo (two tracked boxes, one per implementation), and a "What
just happened" panel that shows the exact code behind whichever box you
last moved the mouse into.

## Key takeaways

- A render prop is just a prop whose value is a **function** — passing it
  as `children` (a function between a component's open/close tags) is the
  same idea as passing it under any other prop name (often `render`).
- A custom hook is **just a function** whose name starts with `use` and
  that calls other hooks internally — there's no separate "hook API" to
  learn beyond that naming/calling convention.
- Custom hooks share **stateful logic, not state itself** — every call
  gets independent state, exactly like every `<MouseTracker>` instance
  does.
- Hooks displaced most render-prop use cases because they avoid an extra
  wrapper component in the tree and compose by calling more hooks side by
  side, instead of nesting more wrapper components inside each other.
- Render props/function-as-children are still the right tool when a
  **library-controlled** component — not your code — decides when and how
  many times to call your function (e.g. rendering one row per item a
  list component iterates), which is exactly the shape headless UI
  libraries use to hand you JSX-shaped state from a component they
  control.

## Discussion / interview questions

1. Why did hooks displace most render-prop use cases? Be specific about
   what changes in the component tree and in how you compose two pieces
   of shared logic.
2. What's a case where render props/function-as-children is still useful
   today even with hooks available — for example, when a library needs to
   hand you JSX-shaped state from a component it controls, like a
   headless UI library rendering one row per item, or Context's legacy
   `<Context.Consumer>` API?
3. `<MouseTracker>` renders its own wrapper `<div>` around whatever
   `children(pos)` returns. What are the concrete downsides of that extra
   node/component — for CSS layout, for React DevTools' component tree,
   and for composing two independent pieces of shared state on the same
   element?
4. Both implementations here declare `useState` and `useEffect` a second
   time, duplicated between `MouseTracker.tsx` and `useMouseTracker.ts`.
   In a real codebase, would you keep both, or should the render-props
   version be rewritten to call the hook internally? What would that
   change (or not change) about the render-props/hook contrast?

## Further reading

- [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [react.dev — Passing Props to a Component (the `children` prop)](https://react.dev/learn/passing-props-to-a-component)
- [react.dev — `Children` reference (render-prop examples: `renderRow`, `renderContent`)](https://react.dev/reference/react/Children)
