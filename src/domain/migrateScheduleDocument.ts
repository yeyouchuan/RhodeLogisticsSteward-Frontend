import { createBentoSchedule } from "./createBentoSchedule";
import { isBentoLayoutId } from "./bentoDefinitions";
import { normalizePosterCanvas } from "./posterCanvas";
import { validateScheduleDocument } from "./scheduleDocument";
import type {
  BentoRoomTypeId,
  ProductKind,
  RoomAssignment,
  ScheduleDocument,
  SlotAssignment,
} from "./types";

interface V1ScheduleDocument {
  version: 1;
  title: string;
  subtitle: string;
  authorText: string;
  layoutId: string;
  queueCount: number;
  queues: Array<{
    id: string;
    label: string;
    durationLabel: string;
    roomAssignments: Array<{
      assignmentId: string;
      roomType: string;
      roomIndex: number;
      product?: string;
      operators: SlotAssignment[];
      paperEfficiencyLabel: string;
      effectiveEfficiencyLabel: string;
      notes: string[];
    }>;
  }>;
  productionSummary: ScheduleDocument["productionSummary"];
  droneSummary: ScheduleDocument["droneSummary"];
  notes: string[];
  updatedAt: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateV1ScheduleDocument(value: unknown): value is V1ScheduleDocument {
  const document = value as V1ScheduleDocument;

  return (
    isObject(document) &&
    document.version === 1 &&
    typeof document.title === "string" &&
    typeof document.layoutId === "string" &&
    Number.isInteger(document.queueCount) &&
    Array.isArray(document.queues) &&
    document.queues.length === document.queueCount &&
    document.queues.every(
      (queue) =>
        isObject(queue) &&
        typeof queue.id === "string" &&
        Array.isArray(queue.roomAssignments) &&
        queue.roomAssignments.every(
          (assignment) =>
            isObject(assignment) &&
            typeof assignment.assignmentId === "string" &&
            typeof assignment.roomType === "string" &&
            Array.isArray(assignment.operators),
        ),
    )
  );
}

function isBentoRoomType(value: string): value is BentoRoomTypeId {
  return (
    value === "CONTROL" ||
    value === "TRADING" ||
    value === "MANUFACTURE" ||
    value === "POWER" ||
    value === "MEETING" ||
    value === "HIRE"
  );
}

function copyOperators(target: RoomAssignment, source: V1ScheduleDocument["queues"][number]["roomAssignments"][number]) {
  return {
    ...target,
    product:
      target.roomType === "TRADING"
        ? "Money"
        : target.roomType === "MANUFACTURE"
          ? (source.product as ProductKind | undefined) ?? target.product
          : target.product,
    paperEfficiencyLabel: source.paperEfficiencyLabel ?? target.paperEfficiencyLabel,
    effectiveEfficiencyLabel: source.effectiveEfficiencyLabel ?? target.effectiveEfficiencyLabel,
    notes: source.notes ?? target.notes,
    operators: target.operators.map((slot, index) => {
      const sourceSlot = source.operators[index];
      return sourceSlot
        ? {
            slotIndex: slot.slotIndex,
            operatorId: sourceSlot.operatorId,
            overrideName: sourceSlot.overrideName,
            elitePhase: sourceSlot.elitePhase,
            isOptional: sourceSlot.isOptional,
          }
        : slot;
    }),
  };
}

function roomSequence(assignments: V1ScheduleDocument["queues"][number]["roomAssignments"]) {
  const counters: Partial<Record<BentoRoomTypeId, number>> = {};

  return assignments.flatMap((assignment) => {
    if (!isBentoRoomType(assignment.roomType)) {
      return [];
    }

    const roomType = assignment.roomType;
    const ordinal = (counters[roomType] ?? 0) + 1;
    counters[roomType] = ordinal;

    return [{ assignment, roomType, ordinal }];
  });
}

export function migrateScheduleDocument(value: unknown): ScheduleDocument | null {
  if (validateScheduleDocument(value)) {
    return value;
  }

  const migratedV2 = migrateV2PosterCanvas(value);
  if (migratedV2) {
    return migratedV2;
  }

  if (!validateV1ScheduleDocument(value)) {
    return null;
  }

  const layoutId = isBentoLayoutId(value.layoutId) ? value.layoutId : "243";
  const next = createBentoSchedule(layoutId, value.queueCount);
  const firstQueueSequence = roomSequence(value.queues[0]?.roomAssignments ?? []);
  const productByNodeId = new Map<string, ProductKind | undefined>();

  for (const item of firstQueueSequence) {
    const room = next.canvas.rooms.filter((candidate) => candidate.roomType === item.roomType)[item.ordinal - 1];
    if (room) {
      productByNodeId.set(
        room.roomNodeId,
        room.roomType === "TRADING"
          ? "Money"
          : room.roomType === "MANUFACTURE"
            ? (item.assignment.product as ProductKind | undefined)
            : room.product,
      );
    }
  }

  return {
    ...next,
    title: value.title,
    subtitle: value.subtitle,
    authorText: value.authorText,
    productionSummary: value.productionSummary,
    droneSummary: value.droneSummary,
    notes: value.notes,
    canvas: {
      ...next.canvas,
      rooms: next.canvas.rooms.map((room) => ({
        ...room,
        product: productByNodeId.has(room.roomNodeId) ? productByNodeId.get(room.roomNodeId) : room.product,
      })),
    },
    queues: next.queues.map((queue, queueIndex) => {
      const sourceQueue = value.queues[queueIndex];
      if (!sourceQueue) {
        return queue;
      }

      const sourceSequence = roomSequence(sourceQueue.roomAssignments);

      return {
        ...queue,
        label: sourceQueue.label,
        durationLabel: sourceQueue.durationLabel,
        roomAssignments: queue.roomAssignments.map((target) => {
          const source = sourceSequence.find((item) => {
            const room = next.canvas.rooms.find((candidate) => candidate.roomNodeId === target.roomNodeId);
            if (!room) {
              return false;
            }
            return item.roomType === room.roomType && item.ordinal === room.roomIndex;
          })?.assignment;

          return source ? copyOperators(target, source) : target;
        }),
      };
    }),
    updatedAt: value.updatedAt ?? new Date().toISOString(),
  };
}

function migrateV2PosterCanvas(value: unknown): ScheduleDocument | null {
  if (!isObject(value) || value.version !== 2) {
    return null;
  }

  const baseCandidate = {
    ...value,
    posterCanvas: undefined,
  };
  if (!validateScheduleDocument(baseCandidate)) {
    return null;
  }

  const posterCanvas = value.posterCanvas === undefined
    ? undefined
    : normalizePosterCanvas(value.posterCanvas, baseCandidate);
  const migrated = {
    ...baseCandidate,
    posterCanvas,
  };

  return validateScheduleDocument(migrated) ? migrated : null;
}
