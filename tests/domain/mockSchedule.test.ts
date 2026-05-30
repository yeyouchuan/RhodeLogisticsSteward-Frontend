import { describe, expect, it } from "vitest";
import { bentoLayoutIds } from "../../src/domain/bentoDefinitions";
import { posterModeIds, posterTemplateIds } from "../../src/domain/posterDefinitions";
import { queueCountOptions } from "../../src/domain/queueLimits";
import { createSampleSchedule, longTextSchedule } from "../../src/data/mockSchedule";
import type { ScheduleDocument } from "../../src/domain/types";

function filledOperatorCount(document: ScheduleDocument): number {
  return document.queues.reduce(
    (sum, queue) =>
      sum +
      queue.roomAssignments.reduce(
        (queueSum, assignment) =>
          queueSum + assignment.operators.filter((slot) => Boolean(slot.operatorId)).length,
        0,
      ),
    0,
  );
}

describe("mock schedules", () => {
  it("does not prefill operators in default sample schedules", () => {
    for (const layoutId of bentoLayoutIds) {
      for (const queueCount of queueCountOptions) {
        for (const posterTemplateId of posterTemplateIds) {
          for (const posterMode of posterModeIds) {
            const sample = createSampleSchedule(layoutId, {
              queueCount,
              posterTemplateId,
              posterMode,
            });

            expect(
              filledOperatorCount(sample),
              `${layoutId}/${queueCount}/${posterTemplateId}/${posterMode}`,
            ).toBe(0);
          }
        }
      }
    }

    expect(filledOperatorCount(createSampleSchedule("342", { strategy: "origin-stone" }))).toBe(0);
    expect(filledOperatorCount(longTextSchedule)).toBe(0);
  });
});
