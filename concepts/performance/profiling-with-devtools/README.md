# Concept: Profiling with the Profiler API

**Category:** performance
**Difficulty:** intermediate
**Status:** template — expand as you work through it

## What this demonstrates

- React ships a built-in [`<Profiler>`](https://react.dev/reference/react/Profiler)
  component. Wrap any subtree in it, give it an `id` and an `onRender`
  callback, and React calls that callback with timing data every time
  something inside commits.
- `onRender` receives `id`, `phase` (`"mount"` / `"update"` /
  `"nested-update"`), `actualDuration`, `baseDuration`, `startTime`, and
  `commitTime`. The demo logs the first four of these into a live table.
- The single most useful comparison: **`actualDuration` vs.
  `baseDuration`**. While nothing is memoized they track closely — nothing
  gets skipped, so "what actually happened" equals "the worst case."
  Once memoization is doing real work, `actualDuration` drops well below
  `baseDuration`, and that gap _is_ the savings.
- This package is about **finding** a rendering problem, not fixing it. The
  demo tree is deliberately over-rendering (a "Tick" button re-renders
  three children regardless of whether their own data changed) so you can
  watch that show up in the numbers before reaching for `React.memo` — see
  `performance/react-memo-basics` and `performance/list-virtualization` for
  the actual fixes.

Run it:

```bash
pnpm --filter concept-profiling-with-devtools dev
```

Open the printed local URL (fixed at `http://localhost:5354`). Click
**Tick** a few times in "Unoptimized" mode and watch the commit log: every
click adds one row, and `actual (ms)` sits close to `base (ms)` because
nothing was skipped. Switch to "Optimized" and click Tick again —
`actual (ms)` should drop noticeably below `base (ms)`, because `Greeting`
and `ExpensiveList` are now bailing out via `React.memo`. `TickCounter`
still shows up every time in both modes, because its own prop (`tick`)
genuinely changed — memoization only skips renders when props are
_unchanged_, not renders you'd simply like to avoid.

> **Development-mode caveat:** this demo runs under `<StrictMode>`, and
> Vite serves it unminified/unbundled, so the absolute millisecond values
> you see are noisier and higher than a production build. Compare the
> _relative_ difference between "Unoptimized" and "Optimized" for the same
> number of ticks, not the raw numbers against some external benchmark.

### Next step: do the same thing with React DevTools

The in-app table above only reports what this page explicitly wrapped in
`<Profiler>`. The real tool for this job is the **React DevTools** browser
extension's Profiler tab, which instruments the _entire_ component tree
automatically — no manual wrapping — and adds a flame graph, a ranked
chart, and a "why did this render" breakdown per component. Try it against
this same demo:

1. Install the extension — [Chrome](https://chromestore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   or [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
   — then reload this page with its DevTools panel open. Two new tabs
   appear: **⚛️ Components** and **⚛️ Profiler**.
2. Open the **Profiler** tab and click the record button (a circle, top
   left). Make sure "Unoptimized" mode is selected in the demo, then click
   **Tick** two or three times. Click record again to stop.
3. You'll see a **flame graph**: one bar per commit along the top
   timeline, and inside each commit a bar per component, sized by how long
   it took to render. In "Unoptimized" mode, `TickCounter`, `Greeting`,
   and `ExpensiveList` should all light up on every commit.
4. Switch the chart type to **Ranked** (top toolbar) to see the same
   commit's components sorted by render time instead of by tree position —
   useful for spotting the single most expensive component at a glance.
5. Click on `Greeting` or `ExpensiveList` in either view and look at the
   right-hand panel: DevTools tells you **"Why did this render?"** — for
   an unmemoized component under a re-rendering parent, the answer is
   simply "the parent component rendered."
6. Clear the profile, switch the demo to "Optimized," record again, and
   click Tick a few more times. `Greeting` and `ExpensiveList` should
   mostly disappear from the flame graph on repeat commits — memoized
   components React didn't need to re-render aren't drawn at all — while
   `TickCounter` keeps showing up, same as in the in-app table.

This is the workflow you'd actually use on a real app: profile first,
identify which components are re-rendering more than they need to, _then_
decide whether `React.memo`, `useMemo`, virtualization, or something else
is the right fix.

## Key takeaways

- `<Profiler>` is for **programmatic** instrumentation — e.g. shipping
  real render-timing metrics to an analytics backend — not for everyday
  exploration. Reach for React DevTools' Profiler tab for that instead.
- `actualDuration` includes memoization bail-outs; `baseDuration` doesn't.
  The gap between them is the concrete, measurable payoff of memoizing a
  subtree — a much more convincing argument in a code review than "this
  feels slow."
- `phase` distinguishes a normal `"update"` from a `"nested-update"` (a
  state update fired from inside a descendant's own commit) — useful for
  spotting render loops caused by effects that set state unconditionally.
- Multiple `<Profiler>` components can nest to measure independent
  subtrees; `id` is how you tell their log entries apart afterward.
- Profiling numbers are relative, not absolute — always compare "before"
  vs. "after" the same interaction, ideally in a production build, rather
  than trusting a single raw millisecond figure.

## Discussion / interview questions

1. Why does `TickCounter` keep re-rendering on every tick even in
   "Optimized" mode, while `Greeting` and `ExpensiveList` stop? What does
   that say about what `React.memo` actually optimizes for?
2. What's the difference between the `"update"` and `"nested-update"`
   phases, and what kind of bug would show up as a stream of
   `"nested-update"` commits?
3. Why might `actualDuration` in this demo be closer to `baseDuration`
   than you'd expect from a "10x speedup" story you've read online? (Hint:
   what does running under Vite's dev server plus `<StrictMode>` do to
   these numbers?)
4. If you were adding `<Profiler>` instrumentation to a production app to
   catch regressions automatically, where would you send the data from
   `onRender`, and what threshold would make you say "this got slower"?

## Further reading

- [react.dev — `<Profiler>`](https://react.dev/reference/react/Profiler)
- [react.dev — React Developer Tools](https://react.dev/learn/react-developer-tools)
- [react.dev — `React.memo`](https://react.dev/reference/react/memo)
- `performance/react-memo-basics` — why wrapping a child in `React.memo`
  skips its re-render, and the fresh-prop pitfall that defeats it.
- `performance/list-virtualization` — the fix for a different kind of
  render cost (too many DOM nodes at once) that profiling would surface
  the same way this demo's `ExpensiveList` does.
