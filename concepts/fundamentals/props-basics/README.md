# Concept: props basics

**Category:** fundamentals
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Props flow one way, parent → child, and a child re-renders with fresh
  props whenever its parent passes new ones.
- `useState(props.value)` only reads the prop on the component's **first**
  render — it's an initializer, not a subscription. Every later prop change
  is silently ignored by that local copy.
- The fix is usually to not introduce local state at all: read `props.value`
  directly wherever it's needed.

Run it:

```bash
pnpm --filter concept-props-basics dev
```

Open the printed local URL. Click through all three "Set name to" buttons
in order and compare the two mini panels — one mirrors the prop into
`useState` (and goes stale after the first render), the other reads the
prop directly (and always stays in sync).

## Key takeaways

- Props are read-only from the child's perspective — a child changes what's
  rendered by calling a callback prop the parent gave it, not by writing to
  its own props ("props down, events up").
- `children` is just a prop populated by whatever's nested inside a
  component's JSX tags.
- Don't copy a prop into `useState` just to have "a variable for it" — that
  copy freezes at whatever the prop was on mount.
- If a component genuinely needs to _diverge_ from a prop after mount (e.g.
  an editable draft seeded from an initial value), that's a legitimate use
  of `useState(initialProp)` — just name it to make the one-time-seed intent
  obvious (`initialName`, not `name`).

## Discussion / interview questions

1. Why does `MirroredFromProp` keep showing the very first name it ever
   received, no matter how many times `App` re-renders with a new one?
2. When is copying a prop into `useState` actually the right call? What
   naming convention signals "this is a one-time seed, not a live mirror"?
3. If you needed `MirroredFromProp` to reset whenever `name` changes (not
   just once), what tool would you reach for — a `key` prop, or an effect
   that calls `setMirroredName`? What are the tradeoffs?
4. How would you rewrite `ReadsPropDirectly` so a parent-provided
   `onNameClick` callback lets the child notify the parent of an
   interaction, instead of trying to change `name` itself?

## Further reading

- [react.dev — Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [react.dev — You Might Not Need an Effect: Adjusting some state when a prop changes](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
