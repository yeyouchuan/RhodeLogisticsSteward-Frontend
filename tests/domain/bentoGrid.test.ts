import { describe, expect, it } from "vitest";
import { canPlaceRect, clampRect, rectsOverlap, snapRect } from "../../src/domain/bentoGrid";

describe("bento grid", () => {
  it("snaps and clamps rectangles to the 6 x 4 grid", () => {
    expect(snapRect({ x: 1.4, y: 2.6, w: 4.4, h: 2.2 })).toEqual({ x: 1, y: 3, w: 4, h: 2 });
    expect(clampRect({ x: 5, y: 3, w: 4, h: 4 }, { w: 1, h: 1 })).toEqual({
      x: 2,
      y: 0,
      w: 4,
      h: 4,
    });
  });

  it("applies maximum size and area limits while preserving single-axis span choices", () => {
    expect(
      clampRect(
        { x: 0, y: 0, w: 5, h: 3 },
        { w: 1, h: 1 },
        { maxSize: { w: 3, h: 3 }, maxArea: 6 },
      ),
    ).toEqual({ x: 0, y: 0, w: 3, h: 2 });

    expect(
      clampRect(
        { x: 4, y: 3, w: 3, h: 3 },
        { w: 1, h: 1 },
        { maxSize: { w: 2, h: 2 } },
      ),
    ).toEqual({ x: 4, y: 2, w: 2, h: 2 });
  });

  it("detects overlap and edge-touching correctly", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 4, h: 3 }, { x: 3, y: 2, w: 4, h: 3 })).toBe(true);
    expect(rectsOverlap({ x: 0, y: 0, w: 4, h: 3 }, { x: 4, y: 0, w: 4, h: 3 })).toBe(false);
  });

  it("rejects placements outside bounds or on existing rooms", () => {
    const existing = [{ x: 0, y: 0, w: 2, h: 1 }];

    expect(canPlaceRect({ x: 2, y: 0, w: 2, h: 1 }, existing)).toBe(true);
    expect(canPlaceRect({ x: 1, y: 0, w: 2, h: 1 }, existing)).toBe(false);
    expect(canPlaceRect({ x: 5, y: 0, w: 2, h: 1 }, existing)).toBe(false);
  });
});
