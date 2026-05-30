import type { PosterGrid, PosterMode, PosterTemplateId } from "./types";

export const POSTER_GRID = {
  columns: 12,
  rows: 6,
} as const satisfies PosterGrid;

export const posterTemplateIds = ["auto", "matrix", "splitPanel", "card", "combo"] as const;

export const posterModeIds = ["normal", "autoRotation", "dailyRotation", "combo"] as const;

export const posterTemplateLabels: Record<PosterTemplateId, string> = {
  auto: "智能选择",
  matrix: "表格海报",
  splitPanel: "双栏海报",
  card: "卡片海报",
  combo: "组合海报",
};

export const posterModeLabels: Record<PosterMode, string> = {
  normal: "普通队列",
  autoRotation: "自动轮换",
  dailyRotation: "一天一换",
  combo: "组合方案",
};

export function isPosterTemplateId(value: unknown): value is PosterTemplateId {
  return typeof value === "string" && posterTemplateIds.includes(value as PosterTemplateId);
}

export function isPosterMode(value: unknown): value is PosterMode {
  return typeof value === "string" && posterModeIds.includes(value as PosterMode);
}

export function normalizePosterTemplateId(value: unknown): PosterTemplateId {
  return isPosterTemplateId(value) ? value : "auto";
}

export function normalizePosterMode(value: unknown): PosterMode {
  return isPosterMode(value) ? value : "normal";
}
