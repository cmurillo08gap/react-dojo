# Challenge: Flatten Array

**Difficulty:** easy
**Category:** array / recursion
**Status:** template — unsolved (`src/solution.ts` throws `Not implemented`)

## Problem

Implement `flattenArray(input, depth = 1)` that flattens a nested array up to
`depth` levels, **without** using the built-in `Array.prototype.flat`.

```ts
flattenArray([1, [2, 3], [4]]); // [1, 2, 3, 4]
flattenArray([1, [2, [3, [4]]]], 2); // [1, 2, 3, [4]]
flattenArray([1, [2, [3, [4, [5]]]]], Infinity); // [1, 2, 3, 4, 5]
```

## Constraints

- Do not use `Array.prototype.flat` / `flatMap`.
- `depth` may be `Infinity`.
- Must not mutate the input array.

## Running the tests

```bash
pnpm --filter challenge-flatten-array test        # run once
pnpm --filter challenge-flatten-array test:watch   # watch mode while iterating
```

## Follow-up questions (often asked live)

1. What's the time/space complexity of your solution?
2. How would you implement this iteratively, without recursion (avoiding a
   call-stack overflow on very deep input)?
3. How does this relate to how React reconciles nested arrays of children?

<details>
<summary>Reference solution (try it yourself first)</summary>

```ts
export function flattenArray(input: unknown[], depth: number = 1): unknown[] {
  if (depth <= 0) return input.slice();

  const result: unknown[] = [];
  for (const item of input) {
    if (Array.isArray(item)) {
      result.push(...flattenArray(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}
```

</details>
