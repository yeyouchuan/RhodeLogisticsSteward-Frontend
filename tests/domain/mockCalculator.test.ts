import { describe, expect, it } from "vitest";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { calculateProductionSummary, calculateRoomPaperEfficiency } from "../../src/domain/mockCalculator";

describe("mock calculator", () => {
  it("is deterministic", () => {
    const document = createDefaultSchedule("243", 3);

    expect(calculateProductionSummary(document)).toEqual(calculateProductionSummary(document));
  });

  it("keeps manual room labels first", () => {
    const room = {
      ...createDefaultSchedule("243", 1).queues[0].roomAssignments[0],
      paperEfficiencyLabel: "纸面 +999%",
    };

    expect(calculateRoomPaperEfficiency(room)).toBe("纸面 +999%");
  });
});
