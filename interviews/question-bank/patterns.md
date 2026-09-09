# Question bank: Component patterns

Tags: `compound-components` `render-props` `hoc` `controlled-components`

---

### Design a `<Tabs>`/`<Tab>`-style compound-component API. How do the pieces share state without the parent prop-drilling every option down?

- **Difficulty:** medium
- **Discussion points:** the pieces (`Tabs`, `Tabs.List`, `Tabs.Tab`,
  `Tabs.Panels`, `Tabs.Panel`) share implicit state (which tab is active)
  via Context set up internally by the top-level `Tabs` component, so
  consumers compose the pieces they want without threading every option
  through props. Contrast with a single monolithic `<Tabs items={[...]}
/>` config-array component: fewer pieces, but every customization (a
  disabled tab, custom tab content) has to be plumbed through the one
  props object.
- **Follow-ups:**
  - What's the cost of the compound-components approach vs. the monolith
    (API surface, discoverability, what happens if a consumer renders the
    pieces in a nonsensical order)?

---

### Render props vs. custom hooks for sharing stateful logic — why did hooks displace most render-prop use cases, and is render props ever still the right call?

- **Difficulty:** medium
- **Discussion points:** a render-prop component (e.g. `<MouseTracker>`
  taking a function-as-children) and the equivalent custom hook
  (`useMouseTracker()`) can drive identical UI — the hook version avoids
  the extra component-tree nesting/wrapping and lets the consumer render
  whatever markup it wants directly. Render props still show up in
  headless UI libraries, where the library needs to control markup-free
  behavior/state while a consumer supplies all the rendering.
- **Follow-ups:**
  - Show the same behavior wired both ways — what's actually different in
    the JSX a consumer writes?

---

### Walk through a naming-collision bug a `withLoading` HOC could introduce, and how a `useLoading` hook avoids it. What's "wrapper hell"?

- **Difficulty:** medium
- **Discussion points:** a HOC that injects an `isLoading` prop can
  silently collide with (shadow, or be shadowed by) a wrapped component's
  own same-named prop — order-of-spread-dependent and easy to miss. A hook
  called directly inside the component has no such collision risk since
  it's not injecting anything through props. "Wrapper hell": stacking
  several HOCs (`withTheme(withLoading(SaveButton))`) produces a deep,
  hard-to-inspect component tree and mangled `displayName`s in DevTools.
- **Follow-ups:**
  - Are HOCs still current React guidance, or has something replaced them
    as the recommended way to share this kind of logic?

---

### Design a reusable `<Accordion>` that can be used either controlled or self-managed (uncontrolled). What's the convention for detecting which mode it's in, and what's missing compared to a native `<input>`?

- **Difficulty:** medium/hard
- **Discussion points:** the common convention is "controlled if the
  relevant prop (e.g. `expandedId`) is defined, uncontrolled otherwise" —
  checked once, typically at mount. Unlike `<input>`, React has no
  built-in warning if a custom component's consumer flips between the two
  modes across its lifetime (e.g. passing `expandedId` on some renders and
  omitting it on others) — that has to be caught with your own guard
  (e.g. a `useEffect` comparing the mode across renders and logging a
  `console.error`) if you want the same safety net `<input>` gets for
  free.
- **Follow-ups:**
  - Why does React warn natively for `<input>`'s controlled/uncontrolled
    switch but not for an arbitrary custom component's equivalent?

---

### Are HOCs still part of current React guidance? What's recommended instead for sharing cross-cutting logic?

- **Difficulty:** easy/medium
- **Discussion points:** current React docs no longer present HOCs as a
  recommended pattern (the only mention is generally a warning against
  dynamically creating "higher-order Hooks," not an endorsement of HOCs
  themselves) — custom hooks are the recommended way to extract and reuse
  stateful logic across components, without the wrapping/naming-collision
  costs above.
- **Follow-ups:**
  - Would you refactor an existing HOC-heavy codebase, or leave working
    HOCs alone and just stop writing new ones?
