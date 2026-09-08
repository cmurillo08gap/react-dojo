# Concept: conditional rendering

**Category:** fundamentals
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- The three common ways to conditionally render in JSX: `&&`, the ternary
  operator, and an early `return` from the component.
- The classic `&&` trap: `{count && <Badge />}` short-circuits to
  `count` itself when it's falsy — not to `false`. React renders `false`,
  `null`, and `undefined` as nothing, but a falsy **number** like `0` (or an
  empty string) gets rendered as literal text.
- The fix: make sure the left-hand side of `&&` is always an actual
  boolean (`count > 0 && <Badge />`), or use a ternary with an explicit
  `null` branch.

Run it:

```bash
pnpm --filter concept-conditional-rendering dev
```

Open the printed local URL. Use −1/+1 to drive the count down to exactly 0
and compare the two badge slots — one shows a stray "0", the other shows
nothing.

## Key takeaways

- `{cond && <X/>}` renders `cond` itself when it's falsy, not `false` — a
  falsy non-boolean (`0`, `""`, `NaN`) shows up as visible text.
- Coerce to a real boolean before `&&` (`count > 0 && ...`, `!!items.length && ...`,
  `Boolean(x) && ...`) whenever the value being checked isn't already one.
- A ternary with an explicit `null`/`undefined` branch sidesteps the trap
  entirely and is often clearer when there are two real branches to render.
- An early `return null` (or a fallback element) at the top of a component
  is usually the cleanest option when the condition gates the _entire_
  component, not just a fragment of its output.

## Discussion / interview questions

1. Why does `{count && <Badge/>}` render "0" specifically at `count === 0`,
   and not at any other count?
2. Would `{items.length && <List items={items} />}` have the same bug for
   an empty array? What about `{items && <List items={items} />}` where
   `items` could be `null`?
3. When would you prefer an early `return null` over a ternary or `&&`
   inside the JSX?
4. Is `{cond ? <X/> : null}` ever meaningfully different from
   `{cond && <X/>}` beyond the falsy-value trap?

## Further reading

- [react.dev — Conditional Rendering](https://react.dev/learn/conditional-rendering)
