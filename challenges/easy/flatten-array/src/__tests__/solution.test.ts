import { describe, expect, it } from "vitest";
import { flattenArray } from "../solution";

describe("flattenArray", () => {
  it("does not mutate flat arrays", () => {
    expect(flattenArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("flattens one level by default", () => {
    expect(flattenArray([1, [2, 3], [4]])).toEqual([1, 2, 3, 4]);
  });

  it("flattens to the requested depth only", () => {
    expect(flattenArray([1, [2, [3, [4]]]], 2)).toEqual([1, 2, 3, [4]]);
  });

  it("fully flattens with Infinity", () => {
    expect(flattenArray([1, [2, [3, [4, [5]]]]], Infinity)).toEqual([1, 2, 3, 4, 5]);
  });

  it("preserves empty slots as-is (no implicit compaction)", () => {
    expect(flattenArray([1, [], 2])).toEqual([1, 2]);
  });
});
