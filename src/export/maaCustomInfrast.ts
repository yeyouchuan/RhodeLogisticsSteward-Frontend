import { createBentoSchedule } from "../domain/createBentoSchedule";
import type {
  BentoRoomTypeId,
  Operator,
  ProductKind,
  RoomAssignment,
  ScheduleDocument,
  SlotAssignment,
} from "../domain/types";

type MaaRoomKey =
  | "control"
  | "trading"
  | "manufacture"
  | "power"
  | "dormitory"
  | "meeting"
  | "hire"
  | "training";

interface MaaRoom {
  skip?: boolean;
  product?: string;
  operators?: string[];
  sort?: boolean;
  autofill?: boolean;
}

interface MaaPlan {
  name?: string;
  description?: string;
  period?: [string, string][];
  drones?: {
    room?: string;
    index?: number;
    enable?: boolean;
    order?: string;
  };
  rooms?: Partial<Record<MaaRoomKey, MaaRoom[]>>;
}

interface MaaCustomInfrast {
  title?: string;
  author?: string;
  description?: string;
  planTimes?: string;
  plans?: MaaPlan[];
}

const productMap: Record<string, ProductKind> = {
  LMD: "Money",
  "Pure Gold": "PureGold",
  "Battle Record": "CombatRecord",
  OriginStone: "OriginStone",
};

const roomTypeMap: Partial<Record<MaaRoomKey, BentoRoomTypeId>> = {
  control: "CONTROL",
  trading: "TRADING",
  manufacture: "MANUFACTURE",
  power: "POWER",
  meeting: "MEETING",
  hire: "HIRE",
};

function isMaaCustomInfrast(value: unknown): value is MaaCustomInfrast {
  const candidate = value as MaaCustomInfrast;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    Array.isArray(candidate.plans) &&
    candidate.plans.some((plan) => typeof plan === "object" && plan !== null && plan.rooms)
  );
}

function inferLayoutId(plans: MaaPlan[]): string {
  const firstRooms = plans.find((plan) => plan.rooms)?.rooms;
  const tradeCount = firstRooms?.trading?.filter((room) => !room.skip).length ?? 0;
  const manufactureCount = firstRooms?.manufacture?.filter((room) => !room.skip).length ?? 0;
  const powerCount = firstRooms?.power?.filter((room) => !room.skip).length ?? 0;
  const inferred = `${tradeCount}${manufactureCount}${powerCount}`;

  return ["153", "243", "252", "333", "342"].includes(inferred) ? inferred : "243";
}

function normalizeProduct(product?: string): ProductKind | undefined {
  if (!product) {
    return undefined;
  }
  return productMap[product] ?? (product as ProductKind);
}

function operatorNameMap(operators: Operator[]): Map<string, Operator> {
  const map = new Map<string, Operator>();
  for (const operator of operators) {
    map.set(operator.name, operator);
    map.set(operator.id, operator);
    for (const alias of operator.aliases) {
      map.set(alias, operator);
    }
  }
  return map;
}

function setOperators(
  assignment: RoomAssignment,
  names: string[],
  operatorsByName: Map<string, Operator>,
): RoomAssignment {
  const slots: SlotAssignment[] = assignment.operators.map((slot, index) => {
    const name = names[index];
    if (!name) {
      return { slotIndex: slot.slotIndex, isOptional: slot.isOptional };
    }

    const operator = operatorsByName.get(name);
    return {
      slotIndex: slot.slotIndex,
      ...(operator ? { operatorId: operator.id } : { overrideName: name }),
      ...(slot.isOptional !== undefined ? { isOptional: slot.isOptional } : {}),
    };
  });

  return {
    ...assignment,
    operators: slots,
  };
}

function queueDuration(plan: MaaPlan, index: number): string {
  const period = plan.period?.[0];
  if (period) {
    return `${period[0]}-${period[1]}`;
  }
  if (plan.description) {
    return plan.description;
  }
  return index === 0 ? "早班" : index === 1 ? "晚班" : `轮换 ${index + 1}`;
}

function droneSummary(plan: MaaPlan): ScheduleDocument["droneSummary"] {
  const drones = plan.drones;
  if (!drones?.enable && drones?.enable !== undefined) {
    return {
      enabled: false,
      targetRoomLabel: "未启用",
      summaryText: "无人机加速未启用",
    };
  }

  const roomLabel =
    drones?.room === "manufacture" ? "制造站" : drones?.room === "trading" ? "贸易站" : "目标房间";
  return {
    enabled: Boolean(drones),
    targetRoomLabel: drones ? `${roomLabel} ${drones.index ?? 1}` : "未指定",
    summaryText: drones
      ? `无人机加速：${roomLabel} ${drones.index ?? 1}，${drones.order ?? "pre"}`
      : "无人机加速未指定",
  };
}

function targetAssignments(queueAssignments: RoomAssignment[], roomType: BentoRoomTypeId) {
  return queueAssignments
    .filter((assignment) => assignment.roomType === roomType)
    .sort((first, second) => first.roomIndex - second.roomIndex);
}

function applyRoomList(
  document: ScheduleDocument,
  queueIndex: number,
  key: MaaRoomKey,
  rooms: MaaRoom[] | undefined,
  operatorsByName: Map<string, Operator>,
): ScheduleDocument {
  const roomType = roomTypeMap[key];
  if (!roomType || !rooms?.length) {
    return document;
  }

  const activeRooms = rooms.filter((room) => !room.skip);
  if (activeRooms.length === 0) {
    return document;
  }

  const queue = document.queues[queueIndex];
  if (!queue) {
    return document;
  }

  const assignments = targetAssignments(queue.roomAssignments, roomType);
  const productUpdates = new Map<string, ProductKind | undefined>();

  const nextQueues = document.queues.map((currentQueue, index) => {
    if (index !== queueIndex) {
      return currentQueue;
    }

    return {
      ...currentQueue,
      roomAssignments: currentQueue.roomAssignments.map((assignment) => {
        const targetIndex = assignments.findIndex((target) => target.assignmentId === assignment.assignmentId);
        const room = activeRooms[targetIndex];
        if (targetIndex < 0 || !room) {
          return assignment;
        }

        const product =
          roomType === "TRADING"
            ? "Money"
            : roomType === "MANUFACTURE"
              ? normalizeProduct(room.product) ?? assignment.product
              : assignment.product;
        productUpdates.set(assignment.roomNodeId, product);

        return {
          ...setOperators(assignment, room.operators ?? [], operatorsByName),
          product,
        };
      }),
    };
  });

  return {
    ...document,
    canvas: {
      ...document.canvas,
      rooms: document.canvas.rooms.map((room) =>
        productUpdates.has(room.roomNodeId)
          ? { ...room, product: productUpdates.get(room.roomNodeId) }
          : room,
      ),
    },
    queues: nextQueues.map((currentQueue) => ({
      ...currentQueue,
      roomAssignments: currentQueue.roomAssignments.map((assignment) =>
        productUpdates.has(assignment.roomNodeId)
          ? { ...assignment, product: productUpdates.get(assignment.roomNodeId) }
          : assignment,
      ),
    })),
  };
}

export function maaCustomInfrastToScheduleDocument(
  value: unknown,
  operators: Operator[],
): ScheduleDocument | null {
  if (!isMaaCustomInfrast(value)) {
    return null;
  }

  const plans = value.plans?.slice(0, 3) ?? [];
  const layoutId = inferLayoutId(plans);
  let document = createBentoSchedule(layoutId, Math.max(1, plans.length));
  const operatorsByName = operatorNameMap(operators);

  for (const [queueIndex, plan] of plans.entries()) {
    if (!plan.rooms) {
      continue;
    }

    document = applyRoomList(document, queueIndex, "control", plan.rooms.control, operatorsByName);
    document = applyRoomList(document, queueIndex, "trading", plan.rooms.trading, operatorsByName);
    document = applyRoomList(document, queueIndex, "manufacture", plan.rooms.manufacture, operatorsByName);
    document = applyRoomList(document, queueIndex, "power", plan.rooms.power, operatorsByName);
    document = applyRoomList(document, queueIndex, "meeting", plan.rooms.meeting, operatorsByName);
    document = applyRoomList(document, queueIndex, "hire", plan.rooms.hire, operatorsByName);
  }

  return {
    ...document,
    title: value.title ?? document.title,
    subtitle: `${layoutId} MAA 基建排班图`,
    authorText: value.author ?? document.authorText,
    queues: document.queues.map((queue, index) => {
      const plan = plans[index];
      return {
        ...queue,
        label: plan?.name ?? queue.label,
        durationLabel: plan ? queueDuration(plan, index) : queue.durationLabel,
      };
    }),
    productionSummary: {
      ...document.productionSummary,
      customLine: "由 MAA custom_infrast JSON 导入，仅用于排班图展示",
    },
    droneSummary: droneSummary(plans[0] ?? {}),
    notes: value.description ? value.description.split("\n").filter(Boolean).slice(0, 3) : document.notes,
    updatedAt: new Date().toISOString(),
  };
}
