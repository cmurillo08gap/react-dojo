# Concept: Higher-order components

**Category:** patterns
**Difficulty:** intermediate
**Status:** template — expand as you work through it

## What this demonstrates

- A **higher-order component (HOC)** is a plain function that takes a
  component and returns a new component wrapping it — the pre-hooks way to
  share behavior across components. By convention it's named `withXxx`
  (here, `withLoading`).
- HOCs work by **injecting props** into the component they wrap. That's
  exactly what creates the pitfall this package demonstrates: `withLoading`
  needs a prop named `isLoading` to decide whether to render a fallback —
  and the wrapped component may independently want a prop with that exact
  same natural name for something else entirely. Only one `isLoading` can
  exist on the wrapped element, and the wrapper always wins, so the wrapped
  component's own prop is silently swallowed.
- The same "loading" behavior expressed as a **custom hook** (`useLoading`)
  called directly inside a normal component has no wrapper, no injected
  prop, and therefore no name to collide with.
- Composing HOCs (`withTheme(withLoading(SaveButton))`) stacks one real
  component per HOC in the tree — "wrapper hell" — and buries the real
  component's identity in devtools behind concatenated `displayName`s
  (`WithTheme(WithLoading(SaveButton))`) that have to be maintained by hand.

Run it:

```bash
pnpm --filter concept-higher-order-components dev
```

Open the printed local URL. Toggle "page loading" first — both the HOC and
hook columns behave identically. Then toggle "saving" — the hook column
correctly disables the button and shows "Saving…"; the HOC column doesn't
change at all, because `SaveButton`'s own `isLoading` prop can never reach
it once wrapped. The "what just happened" panel explains why after each
click, and the demo panel's "Composed HOCs" section shows the wrapper-hell
`displayName` a composed HOC produces at runtime.

## Key takeaways

- A HOC is `Component => Component`; a custom hook is `(...) => value`. The
  hook never adds a component to the tree, so it can't shadow or strip a
  prop the way a HOC's injected prop can.
- Naming collisions between a HOC's injected props and the wrapped
  component's own props aren't a hypothetical edge case — any prop name a
  HOC picks (`isLoading`, `data`, `theme`, …) is also a name some wrapped
  component might reasonably want for its own unrelated purpose, and
  whichever one owns the wrapper element's actual prop wins.
- Composing multiple HOCs multiplies this risk and adds a real component
  per HOC to the tree, each needing its own manually-maintained
  `displayName` to stay debuggable — hooks don't add components to the tree
  at all, so there's no identity to obscure and no `displayName` to write.
- react.dev's current docs (verified via context7 against `/reactjs/react.dev`)
  do not document HOCs as a pattern — the only related mention is a rule
  against dynamically creating a _"higher-order Hook"_ at render time,
  called out as bad practice. The
  [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
  guide is the current, actively-documented replacement for the class of
  problems HOCs used to solve.

## Discussion / interview questions

1. What naming collisions or wrapper-hell issues can HOCs introduce when
   composed? Walk through what happens when two HOCs both want to inject a
   prop called `data`.
2. Why do custom hooks not need `displayName` gymnastics or
   `forwardRef`-style ref-forwarding workarounds the way HOCs often do?
3. `withLoading`'s `Wrapped` component always destructures `isLoading` off
   `props` before forwarding the rest. Why does that make it structurally
   impossible for the wrapped component to ever receive its own same-named
   prop, no matter what value the caller passes?
4. If you had to migrate an existing `withLoading(Component)` call site to
   `useLoading`, what would change at the call site itself (props passed
   in, JSX structure, ref forwarding) versus just inside the
   implementation?

## Further reading

- [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [react.dev — Keeping Components Pure / component composition basics via Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [react.dev — Rules of Hooks reference](https://react.dev/reference/rules/react-calls-components-and-hooks)
  (source of the "don't write higher-order Hooks" anti-pattern note cited above)
- [React legacy docs — Higher-Order Components](https://legacy.reactjs.org/docs/higher-order-components.html)
  — **not** part of current react.dev; context7's react.dev source has no
  HOC-specific page, confirming this is a pre-hooks pattern documented only
  in the legacy/archived docs, not presented as a current recommendation.
