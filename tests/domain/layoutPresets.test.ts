import { describe, expect, it } from "vitest";
import { bentoLayoutIds, getBentoLayoutCounts } from "../../src/domain/bentoDefinitions";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { queueCountOptions } from "../../src/domain/queueLimits";

describe("bento layout presets", () => {
  it("creates valid schedules for all supported bento layouts", () => {
    for (const layoutId of bentoLayoutIds) {
      const document = createDefaultSchedule(layoutId, 3);
      const counts = getBentoLayoutCounts(layoutId);
      const expectedRoomCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

      expect(document.version).toBe(2);
      expect(document.layoutId).toBe(layoutId);
      expect(document.canvas.rooms).toHaveLength(expectedRoomCount);
      expect(document.queues).toHaveLength(3);
      expect(document.queues[0].roomAssignments).toHaveLength(expectedRoomCount);
    }
  });

  it("creates the right number of empty slots for 243", () => {
    const document = createDefaultSchedule("243", 2);

    expect(document.canvas.rooms).toHaveLength(12);
    expect(document.queues[0].roomAssignments.flatMap((assignment) => assignment.operators)).toHaveLength(
      29,
    );
  });

  it("clamps schedules to the supported queue range", () => {
    expect(createDefaultSchedule("243", 0).queueCount).toBe(1);
    expect(createDefaultSchedule("243", 4).queueCount).toBe(4);
    expect(createDefaultSchedule("243", 5).queues).toHaveLength(4);
  });

  it("shares room nodes across 1 to 4 queues", () => {
    for (const layoutId of bentoLayoutIds) {
      for (const queueCount of queueCountOptions) {
        const document = createDefaultSchedule(layoutId, queueCount);
        const roomIds = document.canvas.rooms.map((room) => room.roomNodeId);

        expect(document.queues).toHaveLength(queueCount);
        expect(
          document.queues.every((queue) =>
            queue.roomAssignments.every((assignment) => roomIds.includes(assignment.roomNodeId)),
          ),
        ).toBe(true);
      }
    }
  });
});
