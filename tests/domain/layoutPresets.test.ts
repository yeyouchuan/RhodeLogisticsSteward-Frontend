import { describe, expect, it } from "vitest";
import { layoutPresets } from "../../src/data/layoutPresets";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { queueCountOptions } from "../../src/domain/queueLimits";

describe("layout presets", () => {
  it("creates valid schedules for all presets", () => {
    for (const preset of layoutPresets) {
      const document = createDefaultSchedule(preset.id, preset.defaultQueueCount);
      const expectedRoomCount = preset.columns.reduce(
        (sum, column) => sum + column.roomsPerQueue.length,
        0,
      );

      expect(document.layoutId).toBe(preset.id);
      expect(document.queues).toHaveLength(preset.defaultQueueCount);
      expect(document.queues[0].roomAssignments).toHaveLength(expectedRoomCount);
      expect(document.queues[0].roomAssignments.every((assignment) => assignment.assignmentId)).toBe(
        true,
      );
    }
  });

  it("creates the right number of empty slots", () => {
    const preset = layoutPresets.find((item) => item.id === "243")!;
    const document = createDefaultSchedule("243", 2);
    const expectedSlots = preset.columns
      .flatMap((column) => column.roomsPerQueue)
      .reduce((sum, room) => sum + room.slotCount, 0);

    expect(document.queues[0].roomAssignments.flatMap((assignment) => assignment.operators)).toHaveLength(
      expectedSlots,
    );
  });

  it("clamps schedules to the supported queue range", () => {
    expect(createDefaultSchedule("243", 0).queueCount).toBe(1);
    expect(createDefaultSchedule("243", 4).queueCount).toBe(3);
    expect(createDefaultSchedule("243", 5).queues).toHaveLength(3);
  });

  it("provides canvas profiles and complete rooms for 1 to 3 queues", () => {
    for (const preset of layoutPresets) {
      const expectedRoomCount = preset.columns.reduce(
        (sum, column) => sum + column.roomsPerQueue.length,
        0,
      );

      expect(Object.keys(preset.canvasProfile.queueProfiles).sort()).toEqual(["1", "2", "3"]);

      for (const queueCount of queueCountOptions) {
        const document = createDefaultSchedule(preset.id, queueCount);

        expect(document.queues).toHaveLength(queueCount);
        expect(document.queues.every((queue) => queue.roomAssignments.length === expectedRoomCount)).toBe(
          true,
        );
        expect(
          document.queues.every((queue) =>
            queue.roomAssignments.every((assignment) => assignment.operators.length > 0),
          ),
        ).toBe(true);
      }
    }
  });
});
