# Concept: Suspense basics

**Category:** concurrent-features
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- `<Suspense fallback={...}>` "lets you display a fallback until its
  children have finished loading" (react.dev). A component **suspends** by
  throwing something React recognizes as not-ready-yet — a pending
  promise, or a lazy import — instead of returning JSX for that render.
- React catches that throw, walks up to the nearest parent `<Suspense>`
  boundary, and renders its `fallback` in place of the suspended subtree.
  When the thrown promise resolves, React **retries** the render from
  scratch — it doesn't resume mid-function.
- The demo contrasts that against the "do it by hand" version most
  learners reach for first: a component with `useState(true)` +
  `useEffect` that fetches, then explicitly flips `isLoading` back to
  `false` and conditionally renders a spinner vs. the real content itself.
  Both sides fetch the same kind of data after a simulated 1.2s delay —
  only the mechanism for showing the loading state differs.
- `React.lazy(load)` is Suspense's other built-in use case: it "lets you
  defer loading a component's code until it is rendered for the first
  time," and the component it returns suspends until the dynamic
  `import()` resolves — so it must be rendered inside a `<Suspense>`
  boundary too.

Run it:

```bash
pnpm --filter concept-suspense-basics dev
```

Open the printed local URL (fixed at `http://localhost:5341`). The page
shows a theory panel, the interactive demo, and a "What just happened"
panel that updates with the exact code that ran and why. In the demo:

1. On load, both the **Manual isLoading** and **Suspense** panels fetch
   their profile — watch the spinner in each for ~1.2s before the content
   appears.
2. Click **Reload** under **Manual isLoading**. The component itself sets
   `isLoading` back to `true`, fetches again, then flips it to `false` once
   the promise resolves — all state it manages explicitly.
3. Click **Reload** under **Suspense**. A brand-new resource is created
   that's pending from the moment it exists, so the very next render of
   `SuspenseProfile` throws it immediately — the `<Suspense>` boundary
   falls back to its loading UI on its own, with no `isLoading` flag
   anywhere in that component.

## Key takeaways

- "Suspending" literally means throwing — a pending promise (or, for
  `lazy`, an in-flight dynamic import) thrown during render instead of the
  component returning its usual JSX.
- The nearest parent `<Suspense fallback={...}>` catches that throw and
  swaps in the fallback for the whole suspended subtree; per react.dev,
  "any nested components that fetch data will share the closest parent
  Suspense boundary" even if they aren't its direct children.
- A resolved thrown promise doesn't resume the component — React **retries
  the render** from the top. The second time through, reading the resource
  returns the value instead of throwing, so the real content commits.
- The hand-rolled `wrapPromise` resource-cache pattern in this demo is the
  classic mechanism for making a plain promise "suspend-able": `read()`
  returns the value once resolved, re-throws the error once rejected, and
  throws the promise itself while still pending.
- `React.lazy` components must always render inside a `<Suspense>`
  boundary, and should be declared at module scope — declaring one inside
  another component recreates it (and resets its state) on every
  re-render.
- Nesting `<Suspense>` boundaries lets independent parts of a page reveal
  themselves as each one finishes, instead of the whole tree waiting on
  the single slowest piece — by default, everything inside one boundary is
  treated "as a single unit."

## Discussion / interview questions

1. What does it actually mean for a component to "suspend"? Walk through
   what `resource.read()` does on the first render (pending), and what's
   different about the render that eventually shows real content.
2. Why does the `<Suspense>` version in this demo need zero `isLoading`
   state inside `SuspenseProfile`, while the manual version needs to
   manage it explicitly? What did React take over?
3. Why must `React.lazy` components be declared at module scope instead of
   inside the component that renders them?
4. If two sibling components inside the same `<Suspense>` boundary both
   suspend, does the boundary wait for both before revealing content, or
   does it reveal each independently? How would nesting boundaries change
   that?

## Further reading

- [react.dev — `<Suspense>`](https://react.dev/reference/react/Suspense)
- [react.dev — `lazy`](https://react.dev/reference/react/lazy)
