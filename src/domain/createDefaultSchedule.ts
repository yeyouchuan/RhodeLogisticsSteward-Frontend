import { getLayoutPreset } from "../data/layoutPresets";
import { clampQueueCount } from "./queueLimits";
import type { RoomAssignment, RoomTemplate, ScheduleDocument, ScheduleQueue } from "./types";

function createAssignment(queueId: string, room: RoomTemplate): RoomAssignment {
  return {
    assignmentId: `${queueId}-${room.roomType.toLowerCase()}-${room.roomIndex}-${room.product ?? "general"}`,
    roomType: room.roomType,
    roomIndex: room.roomIndex,
    product: room.product,
    operators: Array.from({ length: room.slotCount }, (_, slotIndex) => ({ slotIndex })),
    paperEfficiencyLabel: "",
    effectiveEfficiencyLabel: "",
    notes: [],
  };
}

export function createDefaultSchedule(layoutId = "243", queueCount?: number): ScheduleDocument {
  const preset = getLayoutPreset(layoutId);
  const count = clampQueueCount(queueCount ?? preset.defaultQueueCount);
  const rooms = preset.columns.flatMap((column) => column.roomsPerQueue);
  const queues: ScheduleQueue[] = Array.from({ length: count }, (_, index) => {
    const queueId = `queue-${index + 1}`;

    return {
      id: queueId,
      label: `队列 ${index + 1}`,
      durationLabel: index === 0 ? "早班" : index === 1 ? "晚班" : `轮换 ${index + 1}`,
      roomAssignments: rooms.map((room) => createAssignment(queueId, room)),
    };
  });

  return {
    version: 1,
    title: "罗德岛基建排班表",
    subtitle: `${preset.label} 基建轮换方案 | mock calculator`,
    authorText: "Rhode Logistics Steward",
    layoutId: preset.id,
    queueCount: count,
    queues,
    productionSummary: {
      orderText: "订单 0.00w",
      goldText: "赤金 0.00w",
      recordText: "经验 0.00w",
      customLine: "生产数值为前端估算，等待真实计算器接入",
    },
    droneSummary: {
      enabled: true,
      targetRoomLabel: "贸易站 1",
      summaryText: "无人机加速：模拟 0.00w 订单 / 0.00w 赤金 / 0.00w 经验",
    },
    notes: ["点击空位选择干员；拖拽用于桌面快速调整。"],
    updatedAt: new Date().toISOString(),
  };
}
