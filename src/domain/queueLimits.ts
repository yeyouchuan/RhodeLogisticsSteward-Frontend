export const MIN_QUEUE_COUNT = 1;
export const MAX_QUEUE_COUNT = 4;

export const queueCountOptions = [1, 2, 3, 4] as const;

export function clampQueueCount(count: number): number {
  return Math.max(MIN_QUEUE_COUNT, Math.min(MAX_QUEUE_COUNT, count));
}
