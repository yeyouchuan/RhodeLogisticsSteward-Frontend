import { createDefaultSchedule } from "../domain/createDefaultSchedule";
import type { ScheduleDocument } from "../domain/types";

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

export function createSampleSchedule(layoutId: string): ScheduleDocument {
  const document = createDefaultSchedule(layoutId, 3);

  return fill(
    {
      ...document,
      title: `${layoutId} 基建排班样例`,
      subtitle: "公开静态前端 | 16:9 导出版",
      notes: ["长备注会被限制在画布底部区域内。", "导出 PNG 不包含编辑器控件。"],
    },
    sampleOperators,
  );
}

export const longTextSchedule: ScheduleDocument = {
  ...createSampleSchedule("243"),
  title: "极长标题测试：罗德岛制造贸易宿舍控制中枢全量轮换排班表",
  notes: [
    "这是一条用于检查溢出的长备注：所有文字都应该留在 16:9 画布内部，不要挤出边界，也不要遮住关键的房间标签。",
  ],
};

export const missingPortraitSchedule: ScheduleDocument = fill(createDefaultSchedule("333", 3), [
  "missing-operator",
  ...sampleOperators,
]);
