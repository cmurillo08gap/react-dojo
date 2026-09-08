# Working in `concepts/`

- One concept = one small, runnable idea. If you're tempted to demonstrate
  three hooks in one app, that's three concept packages, not one.
- Follow the layout in [`README.md`](README.md) exactly — a learner should
  be able to predict where anything lives after seeing one example.
- Write the `README.md` to match `hooks/use-state-basics/README.md`'s
  shape: what it demonstrates, how to run it, key takeaways, 2-4 discussion
  questions, further reading. Write it _before or alongside_ the code, not
  as an afterthought.
- The running app itself must show **theory + interactive demo + a "what
  just happened" code panel** together on one page — see
  [In-app layout](README.md#in-app-layout) and
  `hooks/use-state-basics/src/App.tsx` for the reference shape. Don't ship
  a concept that's only a README with a bare demo bolted on.
- Prefer code that demonstrates a **contrast** (buggy vs. correct, naive vs.
  optimized) over code that just shows the happy path — that's what makes a
  concept memorable and interview-relevant. See the
  `incrementTwiceUnsafely`/`incrementTwiceSafely` pattern in the example.
- Update the status table in `README.md` when you add one.
- See [`../docs/plans/concepts.md`](../docs/plans/concepts.md) for the
  current build status and the full scoped backlog of planned packages per
  category — check it before inventing a new concept from scratch.
- Every concept package runs on a **fixed dev port** (not Vite's default
  auto-picked one) so [`../gallery/`](../gallery) can link to it reliably.
  When adding a package: give it the next free port in its category's
  block from [`../tooling/concept-manifest.ts`](../tooling/concept-manifest.ts)
  (the scheme is documented at the top of that file), set it as a literal
  in the new package's `vite.config.ts` (`server: { port, strictPort: true }`
  — copy the pattern from an existing concept's `vite.config.ts`), and add
  a matching entry to the manifest so the gallery picks it up.

## Browsing concepts without `pnpm --filter` per package

`pnpm dev` from the repo root already starts every package's dev server
concurrently (including the gallery, since it's a normal workspace
package with a `dev` script) — open the gallery
(`http://localhost:5300` once running) instead of remembering individual
`pnpm --filter concept-<slug> dev` commands. See
[`../gallery/src/main.ts`](../gallery/src/main.ts) for how it works: plain
vanilla TS reading `tooling/concept-manifest.ts`, no framework, and no
import of any concept's actual code — it's pure navigation, so concept
packages stay fully standalone.

## Parallelizing across categories with subagents

Concept packages are independent — no package imports another — so it's
safe to fan out multiple subagents to build different categories (or
different packages within a category) at the same time.

- Give each subagent one category (or a handful of packages) and scope it
  to `<category>/*` only — never have two subagents touch the same
  package directory.
- Don't have subagents edit shared files concurrently — `README.md`'s
  status table, `../docs/plans/concepts.md`, and
  `../tooling/concept-manifest.ts` will conflict if written to in parallel
  (and a manifest port collision between two subagents' packages breaks
  the gallery). Have each subagent report back what it built and which
  port it used; apply those doc/manifest updates once, serially, from the
  orchestrating session after they finish.
- Run `pnpm install` once, after all new `package.json` files exist —
  not per subagent — concurrent installs can corrupt `pnpm-lock.yaml`.
  Same for the repo-wide `pnpm lint`/`pnpm typecheck`/`pnpm format`: let
  each subagent verify only its own package(s) (`pnpm --filter <name>
typecheck`, etc.), then run the full-repo checks once at the end.
