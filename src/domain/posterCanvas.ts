import {
  buildPosterViewModel,
  type ConcretePosterTemplateId,
  type PosterSection,
} from "./posterViewModel";
import { bentoRoomDefinitions } from "./bentoDefinitions";
import type {
  BentoRoomTypeId,
  PosterCanvasState,
  PosterComponent,
  PosterComponentType,
  PosterRect,
  ScheduleDocument,
} from "./types";

export const POSTER_COORD_MAX = 10000;
export const MIN_POSTER_COMPONENT_SIZE = 400;
const POSTER_MARGIN = 220;
const POSTER_SECTION_TOP = 1640;

const componentTypes = [
  "infrastructure",
  "laneLabel",
  "metric",
  "note",
  "divider",
] as const satisfies readonly PosterComponentType[];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function concreteTemplateId(value: unknown, fallback: ConcretePosterTemplateId): ConcretePosterTemplateId {
  return value === "matrix" || value === "splitPanel" || value === "card" || value === "combo"
    ? value
    : fallback;
}

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function sectionTitle(section: PosterSection): string {
  return section.product ? `${section.title}` : section.title;
}

function productionLine(document: ScheduleDocument): string {
  return [document.productionSummary.orderText, document.productionSummary.goldText, document.productionSummary.recordText]
    .filter(Boolean)
    .join(" · ");
}

function sectionWeight(section: PosterSection): number {
  if (section.kind === "control") {
    return 1.28;
  }
  if (
    section.kind === "trade" ||
    section.kind === "gold" ||
    section.kind === "record" ||
    section.kind === "jadeManufacture"
  ) {
    return 1.18;
  }
  if (section.kind === "power") {
    return 0.82;
  }
  return 0.94;
}

function strictSectionRects(sections: PosterSection[]): PosterRect[] {
  const availableWidth = POSTER_COORD_MAX - POSTER_MARGIN * 2;
  const weights = sections.map(sectionWeight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let x = POSTER_MARGIN;

  return sections.map((_, index) => {
    const width =
      index === sections.length - 1
        ? POSTER_COORD_MAX - POSTER_MARGIN - x
        : Math.max(MIN_POSTER_COMPONENT_SIZE, Math.floor((availableWidth * weights[index]) / totalWeight));
    const rect = {
      x,
      y: POSTER_SECTION_TOP,
      w: width,
      h: POSTER_COORD_MAX - POSTER_MARGIN - POSTER_SECTION_TOP,
    };

    x += width;
    return rect;
  });
}

function componentId(value: string): string {
  return value.replace(/[^a-zA-Z0-9:._-]/g, "-");
}

export function clampPosterRect(rect: PosterRect): PosterRect {
  const w = Math.min(
    POSTER_COORD_MAX,
    Math.max(MIN_POSTER_COMPONENT_SIZE, Math.round(finiteNumber(rect.w, MIN_POSTER_COMPONENT_SIZE))),
  );
  const h = Math.min(
    POSTER_COORD_MAX,
    Math.max(MIN_POSTER_COMPONENT_SIZE, Math.round(finiteNumber(rect.h, MIN_POSTER_COMPONENT_SIZE))),
  );
  const x = Math.min(
    POSTER_COORD_MAX - w,
    Math.max(0, Math.round(finiteNumber(rect.x, 0))),
  );
  const y = Math.min(
    POSTER_COORD_MAX - h,
    Math.max(0, Math.round(finiteNumber(rect.y, 0))),
  );

  return { x, y, w, h };
}

export function buildDefaultPosterCanvas(document: ScheduleDocument): PosterCanvasState {
  const view = buildPosterViewModel(document);
  const components: PosterComponent[] = [];
  const sectionRects = strictSectionRects(view.sections);
  const noteText = view.notes.join(" · ");

  components.push(
    {
      id: "metric:title",
      type: "metric",
      title: document.title,
      text: document.subtitle,
      metricId: "title",
      rect: { x: POSTER_MARGIN, y: 180, w: 2700, h: 640 },
      zIndex: 10,
    },
    {
      id: "metric:production",
      type: "metric",
      title: "产出计算",
      text: productionLine(document),
      metricId: "production",
      rect: { x: 3060, y: 180, w: 4360, h: 400 },
      zIndex: 10,
    },
    {
      id: "metric:drone",
      type: "metric",
      title: view.metrics[1]?.label ?? "无人机加速",
      text: document.droneSummary.summaryText,
      metricId: "drone",
      rect: { x: 7580, y: 180, w: 2200, h: 640 },
      zIndex: 10,
    },
    {
      id: "note:summary",
      type: "note",
      title: "备注",
      text: noteText,
      rect: { x: 3060, y: 640, w: 4360, h: 400 },
      zIndex: 11,
    },
    {
      id: "divider:header",
      type: "divider",
      title: "分隔线",
      rect: { x: POSTER_MARGIN, y: 1120, w: POSTER_COORD_MAX - POSTER_MARGIN * 2, h: 400 },
      zIndex: 5,
    },
  );

  view.sections.forEach((section, index) => {
    components.push({
      id: componentId(`section:${section.id}`),
      type: "infrastructure",
      title: sectionTitle(section),
      sectionId: section.id,
      rect: sectionRects[index],
      zIndex: 20 + index,
    });
  });

  return {
    schemaVersion: 2,
    sourceTemplateId: view.templateId,
    components: components.map((component) => ({
      ...component,
      rect: clampPosterRect(component.rect),
    })),
  };
}

function normalizeComponent(
  value: unknown,
  document: ScheduleDocument,
): PosterComponent | null {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }

  const type = componentTypes.includes(value.type as PosterComponentType)
    ? (value.type as PosterComponentType)
    : value.type === "facility" || value.type === "facilityGroup"
      ? "infrastructure"
    : null;
  if (!type || !isObject(value.rect)) {
    return null;
  }

  const requestedRoomNodeId = textValue(value.roomNodeId);
  const sourceRoom = requestedRoomNodeId
    ? document.canvas.rooms.find((room) => room.roomNodeId === requestedRoomNodeId)
    : undefined;
  if (requestedRoomNodeId && !sourceRoom) {
    return null;
  }

  const roomNodeId = sourceRoom?.roomNodeId;
  const roomType = normalizeRoomType(value.roomType) ?? sourceRoom?.roomType;
  const sectionId = textValue(value.sectionId);
  if (type === "infrastructure" && !sectionId && !roomNodeId && !roomType) {
    return null;
  }

  return {
    id: value.id,
    type,
    title: value.title,
    text: textValue(value.text),
    ...(roomNodeId ? { roomNodeId } : {}),
    sectionId,
    laneId: textValue(value.laneId),
    metricId: textValue(value.metricId),
    roomType,
    zIndex: Math.round(finiteNumber(value.zIndex, 1)),
    rect: clampPosterRect({
      x: finiteNumber(value.rect.x, 0),
      y: finiteNumber(value.rect.y, 0),
      w: finiteNumber(value.rect.w, MIN_POSTER_COMPONENT_SIZE),
      h: finiteNumber(value.rect.h, MIN_POSTER_COMPONENT_SIZE),
    }),
  };
}

function normalizeRoomType(value: unknown): BentoRoomTypeId | undefined {
  return typeof value === "string" && value in bentoRoomDefinitions
    ? (value as BentoRoomTypeId)
    : undefined;
}

export function normalizePosterCanvas(
  value: unknown,
  document: ScheduleDocument,
): PosterCanvasState {
  const fallback = buildPosterViewModel(document).templateId;
  if (!isObject(value) || !Array.isArray(value.components)) {
    return {
      schemaVersion: 2,
      sourceTemplateId: fallback,
      components: [],
    };
  }

  return {
    schemaVersion: 2,
    sourceTemplateId: concreteTemplateId(value.sourceTemplateId, fallback),
    components: value.components.flatMap((component) => {
      const normalized = normalizeComponent(component, document);
      return normalized ? [normalized] : [];
    }),
  };
}

export function validatePosterCanvas(value: unknown, document: ScheduleDocument): boolean {
  if (!isObject(value) || value.schemaVersion !== 2 || !Array.isArray(value.components)) {
    return false;
  }

  const hasOnlyCurrentTypes = value.components.every(
    (component) =>
      isObject(component) && componentTypes.includes(component.type as PosterComponentType),
  );
  if (!hasOnlyCurrentTypes) {
    return false;
  }

  const normalized = normalizePosterCanvas(value, document);
  return normalized.components.length === value.components.length;
}
