# Concept: custom hooks basics

**Category:** hooks
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- A custom hook is **just a JavaScript function** whose name starts with
  `use` and that calls other hooks internally — there's no separate
  "define a hook" API in React beyond that convention.
- Extracting a custom hook lets independent components **share stateful
  logic** without sharing state — each caller of `useToggle()` still gets
  its own, independent `value`.
- The **Rules of Hooks** — only call hooks at the top level (never inside a
  condition, loop, or nested function), and only call hooks from React
  function components or other hooks (never a plain helper function) —
  aren't arbitrary style rules. They're why the toggle logic _has_ to live
  in a hook: `useState` only works while React is rendering a
  component/hook and tracks each call by its position in that render, so a
  non-hook function could never call it safely.

Run it:

```bash
pnpm --filter concept-custom-hooks-basics dev
```

Open the printed local URL. The page shows a theory panel, the interactive
demo, and a "What just happened" panel that updates with the exact code
that ran and why. The demo has two rows of three widgets each (a
collapsible panel, a switch, and a modal overlay) — all three need the
same "boolean I can flip" behavior:

- **Naive row** — each widget hand-rolls its own `useState(false)` plus a
  locally-defined toggle function. The three implementations drift:
  `NaivePanel`'s `toggle()`, `NaiveSwitch`'s `flipSwitch()` (which also
  quietly uses the value form of the setter instead of the updater form),
  and `NaiveModal`, which only ever grew an `openModal()` helper — closing
  it is inlined on the overlay's button because no `closeModal()` was ever
  written.
- **Hook row** — the same three widgets rebuilt on one shared
  `useToggle(initial?: boolean)` hook (in `src/useToggle.ts`), returning
  `{ value, toggle, setOn, setOff }`. All three widgets now have
  identical, consistent shapes, and the modal gets a real `setOff` helper
  for its close button instead of an inline setter call.

Click through both rows and compare the explanations in "What just
happened" — same interaction, very different amount of duplicated logic.

## Key takeaways

- A custom hook shares **logic**, not **state** — every component calling
  `useToggle()` gets its own independent boolean.
- Naming a function `use...` is a convention that both humans and tooling
  (the `eslint-plugin-react-hooks` rule, the React Compiler) rely on to
  know it's allowed to call other hooks and must itself follow the Rules
  of Hooks.
- A hook can call other hooks (including other custom hooks) — that's the
  entire mechanism. It cannot be called from a plain function, a class
  method, or conditionally/inside a loop.
- Extracting duplicated `useState` + handler logic into a hook the moment
  you notice two components doing the same stateful thing prevents the
  kind of drift shown in the naive row above (different function names,
  a missing helper, an inconsistent setter form).

## Discussion / interview questions

1. Why can't the toggle logic live in a plain function like
   `function makeToggle() { return useState(false); }` called from inside
   an event handler?
2. What's the difference between two components each calling
   `useToggle(false)` versus two components receiving the _same_
   `{ value, toggle }` object as a prop? Which one shares state, and which
   shares only logic?
3. `NaiveSwitch` uses `setOn(!on)` instead of `setOn((o) => !o)`. Under
   what circumstances would that value-form call produce a different (and
   wrong) result, versus the click-by-click behavior seen here?
4. How does the `use` naming convention let ESLint's
   `eslint-plugin-react-hooks` and the React Compiler enforce the Rules of
   Hooks automatically? What would break if `useToggle` were named
   `toggleHook` instead?

## Further reading

- [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [react.dev — Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [react.dev — Building Your Own Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks#extracting-your-own-custom-hook-from-a-component)
