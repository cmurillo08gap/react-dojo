import { CATEGORIES, CONCEPTS, type Category } from "../../tooling/concept-manifest";
import "./index.css";

/**
 * Gallery — lists every runnable concept, grouped by category, linking to
 * its fixed dev-server port (see tooling/concept-manifest.ts). Pure
 * navigation: it doesn't import or render any concept's actual code, so
 * every concept package stays fully standalone.
 *
 * Deliberately vanilla (no React) — this isn't a concept, just a launcher.
 */

function categoryLabel(category: Category): string {
  return category.replace(
    /(^|-)([a-z])/g,
    (_match, sep: string, letter: string) => (sep ? " " : "") + letter.toUpperCase(),
  );
}

async function isReachable(port: number): Promise<boolean> {
  try {
    // no-cors: we can't read the response, but a rejected promise reliably
    // means "nothing is listening on this port" — that's all we need.
    await fetch(`http://localhost:${port}/`, { mode: "no-cors", cache: "no-store" });
    return true;
  } catch {
    return false;
  }
}

async function refreshStatuses() {
  await Promise.all(
    CONCEPTS.map(async (concept) => {
      const reachable = await isReachable(concept.port);
      const dot = document.querySelector<HTMLElement>(`[data-port="${concept.port}"]`);
      if (dot) dot.dataset.reachable = String(reachable);
    }),
  );
}

function render() {
  const root = document.getElementById("root");
  if (!root) throw new Error("#root element not found");

  const categoriesWithConcepts = CATEGORIES.filter((category) =>
    CONCEPTS.some((concept) => concept.category === category),
  );

  root.innerHTML = `
    <main class="gallery">
      <header class="gallery-header">
        <h1>React Dojo — Concepts</h1>
        <p>
          Run <code>pnpm dev</code> from the repo root to start every concept's dev server (and
          this page) together, then click a title below — no per-package
          <code>pnpm --filter</code> needed. The dot shows whether that concept's server is
          reachable right now.
        </p>
      </header>
      <div class="gallery-categories">
        ${categoriesWithConcepts
          .map(
            (category) => `
              <section class="category">
                <h2>${categoryLabel(category)}</h2>
                <ul class="concept-list">
                  ${CONCEPTS.filter((concept) => concept.category === category)
                    .map(
                      (concept) => `
                        <li>
                          <a href="http://localhost:${concept.port}/" target="_blank" rel="noreferrer">
                            <span class="status-dot" data-port="${concept.port}"></span>
                            ${concept.title}
                          </a>
                          <span class="port">:${concept.port}</span>
                        </li>
                      `,
                    )
                    .join("")}
                </ul>
              </section>
            `,
          )
          .join("")}
      </div>
      <footer class="gallery-footer">
        <p>
          Full build status &amp; backlog: <code>docs/plans/concepts.md</code>. Adding a concept?
          Give it an entry in <code>tooling/concept-manifest.ts</code> too.
        </p>
      </footer>
    </main>
  `;

  void refreshStatuses();
  setInterval(() => void refreshStatuses(), 5000);
}

render();
