import { createDefaultSchedule } from "./createDefaultSchedule";
import { MAX_QUEUE_COUNT, MIN_QUEUE_COUNT } from "./queueLimits";
import type {
  ElitePhase,
  RoomAssignment,
  ScheduleDocument,
  ScheduleQueue,
  SlotAddress,
  SlotAssignment,
} from "./types";

export type ScheduleMetadataPatch = Partial<
  Pick<ScheduleDocument, "title" | "subtitle" | "authorText" | "notes">
> & {
  productionSummary?: Partial<ScheduleDocument["productionSummary"]>;
  droneSummary?: Partial<ScheduleDocument["droneSummary"]>;
};

function stamp(document: ScheduleDocument): ScheduleDocument {
  return { ...document, updatedAt: new Date().toISOString() };
}

function updateAssignment(
  document: ScheduleDocument,
  queueId: string,
  assignmentId: string,
  updater: (assignment: RoomAssignment) => RoomAssignment,
): ScheduleDocument {
  return stamp({
    ...document,
    queues: document.queues.map((queue) =>
      queue.id === queueId
        ? {
            ...queue,
            roomAssignments: queue.roomAssignments.map((assignment) =>
              assignment.assignmentId === assignmentId ? updater(assignment) : assignment,
            ),
          }
        : queue,
    ),
  });
}

function findSlot(document: ScheduleDocument, address: SlotAddress) {
  const queue = document.queues.find((item) => item.id === address.queueId);
  const assignment = queue?.roomAssignments.find((item) => item.assignmentId === address.assignmentId);
  const slot = assignment?.operators.find((item) => item.slotIndex === address.slotIndex);

  return { queue, assignment, slot };
}

type SlotPayload = Pick<SlotAssignment, "operatorId" | "overrideName" | "elitePhase">;

function slotPayload(slot: SlotAssignment): SlotPayload {
  return {
    operatorId: slot.operatorId,
    overrideName: slot.overrideName,
    elitePhase: slot.elitePhase,
  };
}

function applySlotPayload(slot: SlotAssignment, payload: SlotPayload): SlotAssignment {
  const base: SlotAssignment = {
    slotIndex: slot.slotIndex,
    ...(slot.isOptional !== undefined ? { isOptional: slot.isOptional } : {}),
  };

  return {
    ...base,
    ...(payload.operatorId !== undefined ? { operatorId: payload.operatorId } : {}),
    ...(payload.overrideName !== undefined ? { overrideName: payload.overrideName } : {}),
    ...(payload.elitePhase !== undefined ? { elitePhase: payload.elitePhase } : {}),
  };
}

function replaceSlotPayload(
  document: ScheduleDocument,
  address: SlotAddress,
  payload: SlotPayload,
): ScheduleDocument {
  return updateAssignment(document, address.queueId, address.assignmentId, (assignment) => ({
    ...assignment,
    operators: assignment.operators.map((slot) =>
      slot.slotIndex === address.slotIndex ? applySlotPayload(slot, payload) : slot,
    ),
  }));
}

export function validateScheduleDocument(value: unknown): value is ScheduleDocument {
  const document = value as ScheduleDocument;

  return (
    typeof document === "object" &&
    document !== null &&
    document.version === 1 &&
    typeof document.title === "string" &&
    typeof document.layoutId === "string" &&
    Number.isInteger(document.queueCount) &&
    document.queueCount >= MIN_QUEUE_COUNT &&
    document.queueCount <= MAX_QUEUE_COUNT &&
    Array.isArray(document.queues) &&
    document.queues.length === document.queueCount &&
    document.queues.every(
      (queue: ScheduleQueue) =>
        typeof queue.id === "string" &&
        Array.isArray(queue.roomAssignments) &&
        queue.roomAssignments.every(
          (assignment) =>
            typeof assignment.assignmentId === "string" &&
            Array.isArray(assignment.operators) &&
            assignment.operators.every(
              (slot) =>
                Number.isInteger(slot.slotIndex) &&
                (slot.elitePhase === undefined || slot.elitePhase === 1 || slot.elitePhase === 2),
            ),
        ),
    )
  );
}

export function setLayout(document: ScheduleDocument, layoutId: string): ScheduleDocument {
  return createDefaultSchedule(layoutId, document.queueCount);
}

export function setQueueCount(document: ScheduleDocument, count: number): ScheduleDocument {
  return createDefaultSchedule(document.layoutId, count);
}

export function assignOperator(
  document: ScheduleDocument,
  queueId: string,
  assignmentId: string,
  slotIndex: number,
  operatorId: string,
): ScheduleDocument {
  return updateAssignment(document, queueId, assignmentId, (assignment) => ({
    ...assignment,
    operators: assignment.operators.map((slot) =>
      slot.slotIndex === slotIndex
        ? applySlotPayload(slot, { operatorId, overrideName: undefined, elitePhase: undefined })
        : slot,
    ),
  }));
}

export function setSlotElitePhase(
  document: ScheduleDocument,
  queueId: string,
  assignmentId: string,
  slotIndex: number,
  elitePhase?: ElitePhase,
): ScheduleDocument {
  return updateAssignment(document, queueId, assignmentId, (assignment) => ({
    ...assignment,
    operators: assignment.operators.map((slot) =>
      slot.slotIndex === slotIndex
        ? applySlotPayload(slot, {
            operatorId: slot.operatorId,
            overrideName: slot.overrideName,
            elitePhase,
          })
        : slot,
    ),
  }));
}

export function clearSlot(
  document: ScheduleDocument,
  queueId: string,
  assignmentId: string,
  slotIndex: number,
): ScheduleDocument {
  return updateAssignment(document, queueId, assignmentId, (assignment) => ({
    ...assignment,
    operators: assignment.operators.map((slot) =>
      slot.slotIndex === slotIndex
        ? { slotIndex: slot.slotIndex, isOptional: slot.isOptional }
        : slot,
    ),
  }));
}

export function swapSlots(
  document: ScheduleDocument,
  source: SlotAddress,
  target: SlotAddress,
): ScheduleDocument {
  const sourceSlot = findSlot(document, source).slot;
  const targetSlot = findSlot(document, target).slot;

  if (!sourceSlot || !targetSlot) {
    return document;
  }

  let next = document;
  next = replaceSlotPayload(next, target, slotPayload(sourceSlot));
  next = replaceSlotPayload(next, source, slotPayload(targetSlot));
  return next;
}

export function updateMetadata(
  document: ScheduleDocument,
  patch: ScheduleMetadataPatch,
): ScheduleDocument {
  return stamp({
    ...document,
    ...patch,
    productionSummary: {
      ...document.productionSummary,
      ...patch.productionSummary,
    },
    droneSummary: {
      ...document.droneSummary,
      ...patch.droneSummary,
    },
  });
}

export function updateRoomEfficiencyLabels(
  document: ScheduleDocument,
  queueId: string,
  assignmentId: string,
  labels: { paperEfficiencyLabel?: string; effectiveEfficiencyLabel?: string; notes?: string[] },
): ScheduleDocument {
  return updateAssignment(document, queueId, assignmentId, (assignment) => ({
    ...assignment,
    paperEfficiencyLabel: labels.paperEfficiencyLabel ?? assignment.paperEfficiencyLabel,
    effectiveEfficiencyLabel: labels.effectiveEfficiencyLabel ?? assignment.effectiveEfficiencyLabel,
    notes: labels.notes ?? assignment.notes,
  }));
}

export function updateQueueLabels(
  document: ScheduleDocument,
  queueId: string,
  patch: { label?: string; durationLabel?: string },
): ScheduleDocument {
  return stamp({
    ...document,
    queues: document.queues.map((queue) =>
      queue.id === queueId
        ? {
            ...queue,
            label: patch.label ?? queue.label,
            durationLabel: patch.durationLabel ?? queue.durationLabel,
          }
        : queue,
    ),
  });
}
