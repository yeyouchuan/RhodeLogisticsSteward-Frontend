import { createBentoSchedule } from "./createBentoSchedule";

export function createDefaultSchedule(layoutId = "243", queueCount?: number) {
  return createBentoSchedule(layoutId, queueCount);
}
