import { describe, expect, it } from "vitest";
import {
  BENTO_GRID,
  bentoLayoutIds,
  bentoRoomDefinitions,
  getBentoLayoutCounts,
  getRequiredTotalRoomCount,
} from "../../src/domain/bentoDefinitions";

describe("bento definitions", () => {
  it("uses the coarse 6 by 4 canvas grid", () => {
    expect(BENTO_GRID).toEqual({ columns: 6, rows: 4 });
  });

  it("expands every supported layout into exact trading/manufacturing/power counts", () => {
    const expected = {
      "153": [1, 5, 3],
      "243": [2, 4, 3],
      "252": [2, 5, 2],
      "333": [3, 3, 3],
      "342": [3, 4, 2],
    } as const;

    for (const layoutId of bentoLayoutIds) {
      const counts = getBentoLayoutCounts(layoutId);

      expect([counts.TRADING, counts.MANUFACTURE, counts.POWER]).toEqual(expected[layoutId]);
      expect(counts.CONTROL).toBe(1);
      expect(counts.MEETING).toBe(1);
      expect(counts.HIRE).toBe(1);
    }
  });

  it("defines operator capacity for the included facility set", () => {
    expect(bentoRoomDefinitions.CONTROL.slotCount).toBe(5);
    expect(bentoRoomDefinitions.MEETING.slotCount).toBe(2);
    expect(bentoRoomDefinitions.MANUFACTURE.slotCount).toBe(3);
    expect(bentoRoomDefinitions.TRADING.slotCount).toBe(3);
    expect(bentoRoomDefinitions.POWER.slotCount).toBe(1);
    expect(bentoRoomDefinitions.HIRE.slotCount).toBe(1);
    expect(getRequiredTotalRoomCount("243")).toBe(12);
  });

  it("defines resize limits for large, medium, and fixed facilities", () => {
    expect(bentoRoomDefinitions.CONTROL.defaultSize).toEqual({ w: 2, h: 1 });
    expect(bentoRoomDefinitions.CONTROL.maxSize).toEqual({ w: 3, h: 3 });
    expect(bentoRoomDefinitions.CONTROL.maxArea).toBe(6);

    expect(bentoRoomDefinitions.TRADING.defaultSize).toEqual({ w: 1, h: 1 });
    expect(bentoRoomDefinitions.TRADING.maxSize).toEqual({ w: 2, h: 2 });
    expect(bentoRoomDefinitions.MANUFACTURE.defaultSize).toEqual({ w: 1, h: 1 });
    expect(bentoRoomDefinitions.MANUFACTURE.maxSize).toEqual({ w: 2, h: 2 });

    expect(bentoRoomDefinitions.POWER.resizable).toBe(false);
    expect(bentoRoomDefinitions.MEETING.resizable).toBe(false);
    expect(bentoRoomDefinitions.HIRE.resizable).toBe(false);
  });
});
