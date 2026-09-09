# Concepts

Each concept is a **small, runnable, self-contained package** — a real React
app (Vite + TypeScript), not just prose. The goal is to read the code, run
it, break it, and answer the discussion questions in its `README.md`.

## Layout

```
concepts/<category>/<slug>/
├── README.md         # explanation, key takeaways, discussion questions
├── package.json
├── vite.config.ts     # 2-line wrapper around tooling/vite-react.config.ts
├── tsconfig.json       # extends the root tsconfig.base.json
├── index.html
└── src/
    ├── main.tsx
    └── App.tsx
```

Run any concept from the repo root:

```bash
pnpm --filter concept-<slug> dev
```

## In-app layout

Every concept's `App.tsx` renders three things together on one page — a
learner shouldn't have to alt-tab to the README mid-demo:

1. **Theory panel** — condensed explanation, always visible (the short
   version of the README's "What this demonstrates"/"Key takeaways").
2. **Interactive demo** — the actual behavior to click through.
3. **"What just happened" panel** — reacts to whichever control was last
   used, showing the exact code that ran plus a sentence on why it behaved
   that way. Keep the displayed code snippet as a plain string constant
   next to the real handler (not derived via `.toString()` — that breaks
   under minification) and a comment reminding you to keep them in sync.

[`hooks/use-state-basics`](hooks/use-state-basics) is the reference
implementation of this layout (see its `src/App.tsx` and `src/index.css`)
— copy its shape for new concepts, the same way you copy its README shape.

## Categories

| Category              | Covers                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------- |
| `fundamentals`        | JSX, components, props, rendering, keys, lists, conditional rendering                   |
| `hooks`               | `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, custom hooks               |
| `state-management`    | Context, `useReducer`, lifting state, external stores                                   |
| `forms-and-actions`   | Controlled inputs, React 19 Actions, `useActionState`, `useFormStatus`, `useOptimistic` |
| `concurrent-features` | Suspense, transitions (`useTransition`, `useDeferredValue`), the `use()` API            |
| `performance`         | Memoization, code-splitting, virtualization, profiling                                  |
| `patterns`            | Compound components, render props, controlled/uncontrolled, HOCs                        |
| `testing`             | React Testing Library, Vitest, mocking, accessibility queries                           |
| `architecture`        | Project structure, data-fetching patterns, Server Components (conceptually)             |

## Status

| Concept                                                                          | Category     | Status        |
| -------------------------------------------------------------------------------- | ------------ | ------------- |
| [`hooks/use-state-basics`](hooks/use-state-basics)                               | hooks        | ✅ scaffolded |
| [`hooks/use-effect-basics`](hooks/use-effect-basics)                             | hooks        | ✅ scaffolded |
| [`hooks/use-ref-basics`](hooks/use-ref-basics)                                   | hooks        | ✅ scaffolded |
| [`hooks/use-memo-basics`](hooks/use-memo-basics)                                 | hooks        | ✅ scaffolded |
| [`hooks/use-callback-basics`](hooks/use-callback-basics)                         | hooks        | ✅ scaffolded |
| [`hooks/custom-hooks-basics`](hooks/custom-hooks-basics)                         | hooks        | ✅ scaffolded |
| [`fundamentals/jsx-and-components`](fundamentals/jsx-and-components)             | fundamentals | ✅ scaffolded |
| [`fundamentals/props-basics`](fundamentals/props-basics)                         | fundamentals | ✅ scaffolded |
| [`fundamentals/rendering-lists-and-keys`](fundamentals/rendering-lists-and-keys) | fundamentals | ✅ scaffolded |
| [`fundamentals/conditional-rendering`](fundamentals/conditional-rendering)       | fundamentals | ✅ scaffolded |
| [`state-management/lifting-state-up`](state-management/lifting-state-up)         | state-management | ✅ scaffolded |
| [`state-management/context-basics`](state-management/context-basics)             | state-management | ✅ scaffolded |
| [`state-management/use-reducer-basics`](state-management/use-reducer-basics)     | state-management | ✅ scaffolded |
| [`state-management/external-store-sync`](state-management/external-store-sync) | state-management | ✅ scaffolded |
| [`forms-and-actions/controlled-vs-uncontrolled-inputs`](forms-and-actions/controlled-vs-uncontrolled-inputs) | forms-and-actions | ✅ scaffolded |
| [`forms-and-actions/form-actions-basics`](forms-and-actions/form-actions-basics) | forms-and-actions | ✅ scaffolded |
| [`forms-and-actions/use-action-state-basics`](forms-and-actions/use-action-state-basics) | forms-and-actions | ✅ scaffolded |
| [`forms-and-actions/use-form-status-basics`](forms-and-actions/use-form-status-basics) | forms-and-actions | ✅ scaffolded |
| [`forms-and-actions/use-optimistic-basics`](forms-and-actions/use-optimistic-basics) | forms-and-actions | ✅ scaffolded |
| [`concurrent-features/suspense-basics`](concurrent-features/suspense-basics) | concurrent-features | ✅ scaffolded |
| [`concurrent-features/use-transition-basics`](concurrent-features/use-transition-basics) | concurrent-features | ✅ scaffolded |
| [`concurrent-features/use-deferred-value-basics`](concurrent-features/use-deferred-value-basics) | concurrent-features | ✅ scaffolded |
| [`concurrent-features/use-api-basics`](concurrent-features/use-api-basics) | concurrent-features | ✅ scaffolded |

_Add a row here as you add each new concept package._

## Adding a new concept

1. Copy the layout above under `concepts/<category>/<new-slug>/`.
2. Reuse `tooling/vite-react.config.ts` from the `vite.config.ts` wrapper —
   don't hand-roll a new Vite config per package.
3. Extend the root `tsconfig.base.json`.
4. Write the `README.md` first: what it demonstrates, key takeaways,
   2-4 discussion/interview questions, links to react.dev.
5. `pnpm install` from the repo root to pick up the new workspace package.
