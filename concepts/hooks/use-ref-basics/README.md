# Concept: `useRef` basics

**Category:** hooks
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- `useRef(initialValue)` returns a mutable object — `{ current: initialValue }`
  — that persists for the full lifetime of the component instance.
- Reading or writing `ref.current` is a **plain JavaScript mutation**: React
  is never notified, so it never schedules a re-render because of it. A
  value that should drive the UI belongs in `useState`, not a ref.
- The ref object's identity is **stable** across renders, same as a
  `useState` setter — safe to omit from a dependency array.
- Refs are also the right tool for **DOM access** — holding a node so you
  can call its imperative API (`.focus()`, `.select()`, `.scrollIntoView()`)
  directly. In React 19, `ref` is a normal prop your own function
  components can accept without `forwardRef`.

Run it:

```bash
pnpm --filter concept-use-ref-basics dev
```

Open the printed local URL. The page shows a theory panel, the interactive
demo, and a "What just happened" panel that updates with the exact code
that ran and why.

The demo has two parts:

1. **Ref counter vs. state counter** — click `+1 (ref)` a few times; the
   number shown for it never moves, even though `refCount.current` really
   is going up, because that number is only ever the ref's **last
   revealed** value, not a live read of it — reading `ref.current`
   directly during render is unsafe in React (it can tear under
   concurrent rendering), so this demo never does that. Click `+1 (state)`
   and its number updates immediately, because `setStateCount` schedules a
   re-render. Then click **Reveal ref value**, which reads
   `refCount.current` from inside its event handler (safe) and copies it
   into state before triggering a re-render. That's the whole lesson made
   visible: mutating a ref never causes a render, and the only safe way to
   get its value onto the screen is to explicitly copy it into state from
   outside of render.
2. **A real DOM ref** — a text input plus a "Focus input" button that
   calls `inputRef.current?.focus()` / `.select()` directly. No state, no
   re-render — just reaching into the DOM, which is exactly the case a
   ref is built for.

## Key takeaways

- Mutating `ref.current` does **not** trigger a re-render — React isn't
  notified of changes to a plain object, so the screen only reflects a
  ref's value the next time something else causes a render.
- Don't mutate a ref that's read **during render** for anything visual —
  if the UI needs to reflect a value, use `useState` (or `useReducer`).
- Good uses for a ref: values that must survive re-renders without
  driving the UI (timer ids, previous values, mutable flags read inside
  event handlers), and holding onto a DOM node for imperative access.
- In React 19, `ref` is just a prop — a function component can declare it
  in its props and forward it to a DOM element without `forwardRef`.

## Discussion / interview questions

1. Why doesn't the `useRef` counter's displayed number change when you
   click `+1 (ref)`, but it _does_ change after you click **Reveal ref
   value**?
2. When would you choose a ref over state for a value in an event
   handler? Give an example where using state instead would cause an
   avoidable extra re-render.
3. What's wrong with reading `ref.current` directly in JSX to render a
   value that changes over time (outside of a DOM node)?
4. Before React 19, why did passing a ref into your own function
   component require `forwardRef`? What changed?

## Further reading

- [react.dev — `useRef`](https://react.dev/reference/react/useRef)
- [react.dev — Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)
- [react.dev — Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [react.dev — `useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle) (notes that in React 19+, `ref` is a standard prop)
