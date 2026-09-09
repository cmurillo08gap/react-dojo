# Concept: List virtualization

**Category:** performance
**Difficulty:** intermediate
**Status:** template — expand as you work through it

## What this demonstrates

- Rendering a long list **naively** — one real `<Row>` DOM node per item —
  means the browser mounts and paints every item regardless of whether it's
  ever scrolled into view. At a few thousand rows this shows up as visible
  jank on scroll.
- **Windowing** (a.k.a. virtualization) tracks scroll position and derives,
  from `scrollTop`, `itemHeight`, and the container's height, which slice of
  row indices is currently visible — then renders only that slice, plus a
  small **overscan** buffer, no matter how large the underlying dataset is.
- A full-height spacer (`totalCount * itemHeight`) keeps the scrollbar the
  same size it would be if every row were real, while the visible slice is
  translated to `startIndex * itemHeight` so nothing jumps.
- This concept **hand-rolls** the windowing math instead of depending on a
  library, so the index arithmetic is visible rather than hidden behind an
  abstraction — see "Further reading" for the libraries that implement this
  same pattern in production.

Run it:

```bash
pnpm --filter concept-list-virtualization dev
```

Open the printed local URL (fixed dev port `5353`). The page shows a theory
panel, the interactive demo, and a "what just happened" panel that reacts to
the active mode.

- Toggle between **Naive** and **Virtualized** and watch the "Rows mounted"
  counter: a constant `5000` in naive mode vs. a small number that hovers
  around 15–25 in virtualized mode as you scroll.
- In virtualized mode, scroll the list and watch the "what just happened"
  panel's live `startIndex`/`endIndex` readout track your scroll position.
- Open your browser's **Elements/DOM inspector** in each mode and expand the
  scroll container — you'll see 5,000 `<div class="row">` nodes in naive
  mode and only a couple dozen in virtualized mode. That's ground truth
  beyond the in-app counter (which is just this demo's proxy for DOM node
  count, since you can't measure real paint jank from inside the app).
- If you have a device or a CPU-throttling DevTools profile handy, _feel_
  the scroll: naive mode gets noticeably janky under throttling, while
  virtualized mode stays smooth because it's always working with the same
  small number of mounted nodes.

## Key takeaways

- The core trick is arithmetic, not magic: `startIndex` and `endIndex` are
  computed directly from `scrollTop`, a fixed `itemHeight`, and the
  container's height — no library required to understand or implement the
  basic version.
- The visible range is **derived in render**, not synchronized via
  `useEffect` — it's a pure computation from `scrollTop`/`mode` and the
  fixed constants, so there's no external system to synchronize with and no
  reason to pay for an extra render pass.
- **Overscan** (rendering a handful of rows beyond the strict viewport
  edges) trades a few extra mounted nodes for eliminating the blank flash a
  fast scroll would otherwise cause for one frame.
- The spacer + translate approach keeps the scrollbar's size and the
  content's visual position correct without ever mounting the rows that
  produce that height — the DOM only ever holds the small visible slice.
- A plain `onScroll` → `setState` handler is good enough for a teaching
  demo; production code typically throttles this (e.g. via
  `requestAnimationFrame`) to avoid scheduling a render on every
  scroll-fired pixel delta.

## Discussion / interview questions

1. Why does virtualization need a spacer element sized to
   `totalCount * itemHeight` instead of just rendering the visible slice
   directly inside the scroll container?
2. What breaks about this fixed-`itemHeight` approach if rows have variable,
   content-dependent heights? How do production virtualization libraries
   handle that case?
3. Why is it fine (even preferable) to compute `startIndex`/`endIndex`
   directly during render here, rather than in a `useEffect` that calls
   `setState` after reading `scrollTop`?
4. What would you measure, and how, to prove virtualization actually
   improved scroll performance beyond the in-app "rows mounted" counter this
   demo uses as a proxy?

## Further reading

- [react.dev — Render and Commit](https://react.dev/learn/render-and-commit)
- react.dev doesn't have a dedicated virtualization API — windowing isn't a
  built-in React feature, it's a rendering pattern implemented in userland.
  Production apps typically reach for a library that implements this same
  index math (plus variable row heights, horizontal lists, sticky rows,
  etc.) rather than hand-rolling it — see
  [`react-window`](https://github.com/bvaughn/react-window) and
  [`@tanstack/react-virtual`](https://tanstack.com/virtual/latest), which
  this concept deliberately hand-rolls instead of depending on.
