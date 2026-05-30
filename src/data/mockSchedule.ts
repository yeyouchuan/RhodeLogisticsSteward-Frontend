import { createDefaultSchedule } from "../domain/createDefaultSchedule";
import { setRoomProduct } from "../domain/scheduleDocument";
import type { PosterMode, PosterTemplateId, ScheduleDocument } from "../domain/types";

function fill(document: ScheduleDocument, operatorIds: string[]): ScheduleDocument {
  let cursor = 0;

  return {
    ...document,
    queues: document.queues.map((queue) => ({
      ...queue,
      roomAssignments: queue.roomAssignments.map((assignment) => ({
        ...assignment,
        operators: assignment.operators.map((slot) => {
          const operatorId = operatorIds[cursor % operatorIds.length];
          cursor += 1;
          return { ...slot, operatorId };
        }),
      })),
    })),
  };
}

const sampleOperators = [
  "AA01",
  "AA02",
  "AA03",
  "AA04",
  "AA05",
  "A41",
  "A42",
  "R303",
  "R108",
  "R101",
];

interface SampleScheduleOptions {
  queueCount?: number;
  posterTemplateId?: PosterTemplateId;
  posterMode?: PosterMode;
  strategy?: string;
}

function applyStrategy(document: ScheduleDocument, strategy?: string): ScheduleDocument {
  if (strategy !== "origin-stone") {
    return document;
  }

  const manufacture = document.canvas.rooms
    .filter((room) => room.roomType === "MANUFACTURE")
    .at(-1);

  return manufacture ? setRoomProduct(document, manufacture.roomNodeId, "OriginStone") : document;
}

export function createSampleSchedule(layoutId: string, options: SampleScheduleOptions = {}): ScheduleDocument {
  const document = applyStrategy(createDefaultSchedule(layoutId, options.queueCount ?? 3), options.strategy);

  return {
    ...document,
    title: `${layoutId} 基建排班样例`,
    subtitle: "公开静态前端 | 16:9 导出版",
    posterTemplateId: options.posterTemplateId ?? document.posterTemplateId,
    posterMode: options.posterMode ?? document.posterMode,
    notes: ["导出 PNG 不包含编辑器控件。"],
  };
}

export const longTextSchedule: ScheduleDocument = {
  ...createSampleSchedule("243"),
  title: "极长标题测试：罗德岛制造贸易会客控制中枢全量轮换排班表",
  notes: ["这是一条用于检查溢出的长备注：所有文字都应该留在 16:9 画布内部。"],
};

export const missingPortraitSchedule: ScheduleDocument = fill(createDefaultSchedule("333", 3), [
  "missing-operator",
  ...sampleOperators,
]);
