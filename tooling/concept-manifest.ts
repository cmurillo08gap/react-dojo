// Single source of truth for every runnable concept package's location,
// title, and fixed dev-server port. The `gallery/` package reads this file
// directly to render its links; each concept's own `vite.config.ts` sets
// this same port as a literal (see the comment there) so no concept
// package needs a runtime dependency on this file just to boot.
//
// Port scheme: every category gets a reserved ten-port block,
// `5300 + 10 * categoryIndex` (index from CATEGORIES below). Port
// `5300` itself (fundamentals' block base) is reserved for the gallery.
// The first concept added to a category takes block + 1, the next
// block + 2, and so on — up to 9 concepts per category before the block
// runs out of room (widen the scheme first if that ever happens).
//
// Adding a concept? Add its port here (via categoryPortBase + next free
// offset) AND as the literal `server.port` in its own vite.config.ts —
// see CLAUDE.md's "Working in concepts/" section.

export const GALLERY_PORT = 5300;

export const CATEGORIES = [
  "fundamentals",
  "hooks",
  "state-management",
  "forms-and-actions",
  "concurrent-features",
  "performance",
  "patterns",
  "testing",
  "architecture",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function categoryPortBase(category: Category): number {
  return 5300 + CATEGORIES.indexOf(category) * 10;
}

export interface ConceptManifestEntry {
  category: Category;
  slug: string;
  title: string;
  packageName: string;
  port: number;
}

export const CONCEPTS: ConceptManifestEntry[] = [
  {
    category: "fundamentals",
    slug: "jsx-and-components",
    title: "JSX & components",
    packageName: "concept-jsx-and-components",
    port: 5301,
  },
  {
    category: "fundamentals",
    slug: "props-basics",
    title: "Props basics",
    packageName: "concept-props-basics",
    port: 5302,
  },
  {
    category: "fundamentals",
    slug: "rendering-lists-and-keys",
    title: "Rendering lists & keys",
    packageName: "concept-rendering-lists-and-keys",
    port: 5303,
  },
  {
    category: "fundamentals",
    slug: "conditional-rendering",
    title: "Conditional rendering",
    packageName: "concept-conditional-rendering",
    port: 5304,
  },
  {
    category: "hooks",
    slug: "use-state-basics",
    title: "useState basics",
    packageName: "concept-use-state-basics",
    port: 5311,
  },
  {
    category: "hooks",
    slug: "use-effect-basics",
    title: "useEffect basics",
    packageName: "concept-use-effect-basics",
    port: 5312,
  },
  {
    category: "hooks",
    slug: "use-ref-basics",
    title: "useRef basics",
    packageName: "concept-use-ref-basics",
    port: 5313,
  },
  {
    category: "hooks",
    slug: "use-memo-basics",
    title: "useMemo basics",
    packageName: "concept-use-memo-basics",
    port: 5314,
  },
  {
    category: "hooks",
    slug: "use-callback-basics",
    title: "useCallback basics",
    packageName: "concept-use-callback-basics",
    port: 5315,
  },
  {
    category: "hooks",
    slug: "custom-hooks-basics",
    title: "Custom hooks basics",
    packageName: "concept-custom-hooks-basics",
    port: 5316,
  },
  {
    category: "state-management",
    slug: "lifting-state-up",
    title: "Lifting state up",
    packageName: "concept-lifting-state-up",
    port: 5321,
  },
  {
    category: "state-management",
    slug: "context-basics",
    title: "Context basics",
    packageName: "concept-context-basics",
    port: 5322,
  },
  {
    category: "state-management",
    slug: "use-reducer-basics",
    title: "useReducer basics",
    packageName: "concept-use-reducer-basics",
    port: 5323,
  },
  {
    category: "state-management",
    slug: "external-store-sync",
    title: "External store sync",
    packageName: "concept-external-store-sync",
    port: 5324,
  },
  {
    category: "forms-and-actions",
    slug: "controlled-vs-uncontrolled-inputs",
    title: "Controlled vs. uncontrolled inputs",
    packageName: "concept-controlled-vs-uncontrolled-inputs",
    port: 5331,
  },
  {
    category: "forms-and-actions",
    slug: "form-actions-basics",
    title: "Form Actions basics",
    packageName: "concept-form-actions-basics",
    port: 5332,
  },
  {
    category: "forms-and-actions",
    slug: "use-action-state-basics",
    title: "useActionState basics",
    packageName: "concept-use-action-state-basics",
    port: 5333,
  },
  {
    category: "forms-and-actions",
    slug: "use-form-status-basics",
    title: "useFormStatus basics",
    packageName: "concept-use-form-status-basics",
    port: 5334,
  },
  {
    category: "forms-and-actions",
    slug: "use-optimistic-basics",
    title: "useOptimistic basics",
    packageName: "concept-use-optimistic-basics",
    port: 5335,
  },
  {
    category: "concurrent-features",
    slug: "suspense-basics",
    title: "Suspense basics",
    packageName: "concept-suspense-basics",
    port: 5341,
  },
  {
    category: "concurrent-features",
    slug: "use-transition-basics",
    title: "useTransition basics",
    packageName: "concept-use-transition-basics",
    port: 5342,
  },
  {
    category: "concurrent-features",
    slug: "use-deferred-value-basics",
    title: "useDeferredValue basics",
    packageName: "concept-use-deferred-value-basics",
    port: 5343,
  },
  {
    category: "concurrent-features",
    slug: "use-api-basics",
    title: "use() API basics",
    packageName: "concept-use-api-basics",
    port: 5344,
  },
  {
    category: "performance",
    slug: "react-memo-basics",
    title: "React.memo basics",
    packageName: "concept-react-memo-basics",
    port: 5351,
  },
  {
    category: "performance",
    slug: "code-splitting-lazy",
    title: "Code-splitting with React.lazy",
    packageName: "concept-code-splitting-lazy",
    port: 5352,
  },
  {
    category: "performance",
    slug: "list-virtualization",
    title: "List virtualization",
    packageName: "concept-list-virtualization",
    port: 5353,
  },
  {
    category: "performance",
    slug: "profiling-with-devtools",
    title: "Profiling with the Profiler API",
    packageName: "concept-profiling-with-devtools",
    port: 5354,
  },
  {
    category: "patterns",
    slug: "compound-components",
    title: "Compound components",
    packageName: "concept-compound-components",
    port: 5361,
  },
  {
    category: "patterns",
    slug: "render-props",
    title: "Render props",
    packageName: "concept-render-props",
    port: 5362,
  },
  {
    category: "patterns",
    slug: "controlled-vs-uncontrolled-components",
    title: "Controlled vs. uncontrolled components",
    packageName: "concept-controlled-vs-uncontrolled-components",
    port: 5363,
  },
  {
    category: "patterns",
    slug: "higher-order-components",
    title: "Higher-order components",
    packageName: "concept-higher-order-components",
    port: 5364,
  },
  {
    category: "testing",
    slug: "rtl-basics",
    title: "RTL basics",
    packageName: "concept-rtl-basics",
    port: 5371,
  },
  {
    category: "testing",
    slug: "testing-async-ui",
    title: "Testing async UI",
    packageName: "concept-testing-async-ui",
    port: 5372,
  },
  {
    category: "testing",
    slug: "mocking-basics",
    title: "Mocking basics",
    packageName: "concept-mocking-basics",
    port: 5373,
  },
  {
    category: "testing",
    slug: "accessible-queries",
    title: "Accessible queries",
    packageName: "concept-accessible-queries",
    port: 5374,
  },
];
