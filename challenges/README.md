# Challenges

Coding challenges you solve against a **failing test suite** (TDD style) —
not React apps to click through. Some are plain TypeScript/algorithmic
(common in the first interview round); others are React-flavored (custom
hooks, component behavior).

## Layout

```
challenges/<difficulty>/<slug>/
├── README.md                    # problem statement, constraints, reference solution (collapsed)
├── package.json
├── tsconfig.json                 # extends the root tsconfig.base.json
└── src/
    ├── solution.ts                # starter stub — implement this
    └── __tests__/solution.test.ts # run against your implementation
```

Work a challenge from the repo root:

```bash
pnpm --filter challenge-<slug> test:watch
```

Edit `src/solution.ts` until the tests in `src/__tests__/` pass, then check
the collapsed reference solution in the challenge's `README.md`.

## React component-building challenges

The packages under this folder are algorithmic/TDD-style (a failing test
suite you implement against). For the other common interview format —
"build this component from scratch" (counter, stopwatch, autocomplete,
tabs, infinite scroll, …) — see
[`../challenges-gallery/`](../challenges-gallery), a single browsable page
of those, each with a plain-English explanation and a reference test file
you implement against by hand in [`../playground/`](../playground).

## Difficulty tiers

| Tier     | Focus                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `easy`   | Array/string/object fundamentals, basic hook mechanics                                                                                                     |
| `medium` | Custom hooks, async control flow, component composition, debouncing/throttling                                                                             |
| `hard`   | Performance optimization under constraints, tricky state/race-condition bugs, mini system design (e.g. build a virtualized list, a cache, a state machine) |

## Status

| Challenge                                  | Tier | Status                 |
| ------------------------------------------ | ---- | ---------------------- |
| [`easy/flatten-array`](easy/flatten-array) | easy | 🟡 unsolved (template) |

_Add a row here as you add each new challenge package. Status: 🟡 unsolved · 🟢 solved._

## Adding a new challenge

1. Copy the layout above under `challenges/<easy\|medium\|hard>/<new-slug>/`.
2. Write the tests first (`src/__tests__/solution.test.ts`) — they define
   the spec.
3. Leave `src/solution.ts` throwing `Not implemented` (or with an obviously
   wrong starter) so the suite fails until it's solved.
4. Put the reference solution in a collapsed `<details>` block at the bottom
   of the challenge's `README.md`, not committed pre-solved in `src/`.
5. `pnpm install` from the repo root to pick up the new workspace package.
