# Playground

A free-form React + Vite sandbox — plain JS/JSX, no TypeScript, no lesson,
no README status table entry, no rules. Use it to try out your own code,
poke at a React API, or reproduce something you're debugging elsewhere in
the repo.

Unlike `concepts/`, this package is **not** meant to teach anything, isn't
type-checked, and isn't linked from the gallery — it's scratch space you're
expected to overwrite.

## Run it

```bash
pnpm --filter playground dev
```

Opens at [http://localhost:5200](http://localhost:5200). Edit
`src/App.jsx` and save — Vite hot-reloads instantly.

## Test it

Vitest + React Testing Library are already wired up, the same way
`challenges/` and `concepts/testing/` use them — this is the base for
future challenges that require an implementation *and* passing tests, not
just a running app.

```bash
pnpm --filter playground test        # run once
pnpm --filter playground test:watch  # rerun on change
```

`src/__tests__/App.test.jsx` is a starter test for the starter
`App.jsx` — query by accessible role/name (`getByRole`), drive
interaction with `userEvent`, and replace both once you're working on
your own component.
