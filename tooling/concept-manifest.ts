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
];
