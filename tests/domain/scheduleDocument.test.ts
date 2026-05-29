import { describe, expect, it } from "vitest";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import {
  assignOperator,
  clearSlot,
  setSlotElitePhase,
  setLayout,
  setQueueCount,
  swapSlots,
  validateScheduleDocument,
} from "../../src/domain/scheduleDocument";

describe("schedule document operations", () => {
  it("round-trips as valid JSON", () => {
    const document = createDefaultSchedule("243", 3);
    const parsed = JSON.parse(JSON.stringify(document)) as unknown;

    expect(validateScheduleDocument(parsed)).toBe(true);
  });

  it("assigns, clears, and swaps slots", () => {
    const document = createDefaultSchedule("243", 1);
    const first = document.queues[0].roomAssignments[0];
    const second = document.queues[0].roomAssignments[1];
    const assigned = assignOperator(document, "queue-1", first.assignmentId, 0, "op-a");
    const swapped = swapSlots(
      assigned,
      { queueId: "queue-1", assignmentId: first.assignmentId, slotIndex: 0 },
      { queueId: "queue-1", assignmentId: second.assignmentId, slotIndex: 0 },
    );

    expect(swapped.queues[0].roomAssignments[1].operators[0].operatorId).toBe("op-a");
    expect(
      clearSlot(swapped, "queue-1", second.assignmentId, 0).queues[0].roomAssignments[1].operators[0]
        .operatorId,
    ).toBeUndefined();
  });

  it("stores and clears manual elite phase on a slot", () => {
    const document = createDefaultSchedule("243", 1);
    const assignment = document.queues[0].roomAssignments[0];
    const withElite = setSlotElitePhase(document, "queue-1", assignment.assignmentId, 0, 2);
    const autoElite = setSlotElitePhase(withElite, "queue-1", assignment.assignmentId, 0);

    expect(withElite.queues[0].roomAssignments[0].operators[0].elitePhase).toBe(2);
    expect(autoElite.queues[0].roomAssignments[0].operators[0].elitePhase).toBeUndefined();
  });

  it("resets manual elite phase when assigning or clearing an operator", () => {
    const document = createDefaultSchedule("243", 1);
    const assignment = document.queues[0].roomAssignments[0];
    const withElite = setSlotElitePhase(document, "queue-1", assignment.assignmentId, 0, 2);
    const assigned = assignOperator(withElite, "queue-1", assignment.assignmentId, 0, "op-a");
    const cleared = clearSlot(withElite, "queue-1", assignment.assignmentId, 0);

    expect(assigned.queues[0].roomAssignments[0].operators[0].elitePhase).toBeUndefined();
    expect(cleared.queues[0].roomAssignments[0].operators[0].elitePhase).toBeUndefined();
  });

  it("swaps manual elite phase with assigned operators", () => {
    const document = createDefaultSchedule("243", 1);
    const first = document.queues[0].roomAssignments[0];
    const second = document.queues[0].roomAssignments[1];
    const firstAddress = { queueId: "queue-1", assignmentId: first.assignmentId, slotIndex: 0 };
    const secondAddress = { queueId: "queue-1", assignmentId: second.assignmentId, slotIndex: 0 };
    const assignedFirst = assignOperator(document, "queue-1", first.assignmentId, 0, "op-a");
    const assignedSecond = assignOperator(assignedFirst, "queue-1", second.assignmentId, 0, "op-b");
    const firstElite = setSlotElitePhase(assignedSecond, "queue-1", first.assignmentId, 0, 2);
    const secondElite = setSlotElitePhase(firstElite, "queue-1", second.assignmentId, 0, 1);
    const swapped = swapSlots(secondElite, firstAddress, secondAddress);

    expect(swapped.queues[0].roomAssignments[1].operators[0]).toMatchObject({
      operatorId: "op-a",
      elitePhase: 2,
    });
    expect(swapped.queues[0].roomAssignments[0].operators[0]).toMatchObject({
      operatorId: "op-b",
      elitePhase: 1,
    });
  });

  it("layout switching creates a valid document", () => {
    const next = setLayout(createDefaultSchedule("243", 3), "333");

    expect(next.layoutId).toBe("333");
    expect(validateScheduleDocument(next)).toBe(true);
  });

  it("setQueueCount clamps to the supported queue range", () => {
    const document = createDefaultSchedule("243", 2);

    expect(setQueueCount(document, 0).queues).toHaveLength(1);
    expect(setQueueCount(document, 4).queues).toHaveLength(3);
    expect(setQueueCount(document, 5).queueCount).toBe(3);
  });
});
