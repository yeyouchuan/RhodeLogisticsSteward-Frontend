import { describe, expect, it } from "vitest";
import { BENTO_GRID } from "../../src/domain/bentoDefinitions";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { buildPosterViewModel, POSTER_GRID } from "../../src/domain/posterViewModel";
import { setRoomProduct } from "../../src/domain/scheduleDocument";

describe("poster view model", () => {
  it("keeps the facility edit grid separate from the poster layout grid", () => {
    expect(BENTO_GRID).toEqual({ columns: 6, rows: 4 });
    expect(POSTER_GRID).toEqual({ columns: 12, rows: 6 });
  });

  it("builds a matrix poster with four queue lanes", () => {
    const document = createDefaultSchedule("153", 4);
    const view = buildPosterViewModel(document);

    expect(view.templateId).toBe("matrix");
    expect(view.lanes.map((lane) => lane.label)).toEqual([
      "队列 1",
      "队列 2",
      "队列 3",
      "队列 4",
    ]);
    expect(view.sections.map((section) => section.title)).toEqual(
      expect.arrayContaining(["中枢", "贸易", "赤金", "经验", "发电", "其他"]),
    );
  });

  it("builds combo lanes for the 252 combination poster", () => {
    const document = {
      ...createDefaultSchedule("252", 3),
      posterMode: "combo" as const,
    };
    const view = buildPosterViewModel(document);

    expect(view.templateId).toBe("combo");
    expect(view.lanes.map((lane) => lane.label)).toEqual([
      "A",
      "B",
      "C",
      "A+B",
      "A+C",
      "B+C",
    ]);
  });

  it("adds origin-stone sections for jade manufacturing strategies", () => {
    const base = createDefaultSchedule("342", 3);
    const manufacture = base.canvas.rooms.find(
      (room) => room.roomType === "MANUFACTURE" && room.roomIndex === 4,
    )!;
    const document = setRoomProduct(base, manufacture.roomNodeId, "OriginStone");
    const view = buildPosterViewModel(document);

    expect(view.sections.map((section) => section.title)).toEqual(
      expect.arrayContaining(["搓玉制造", "玉贸易"]),
    );
  });
});
