import { BENTO_GRID } from "./bentoDefinitions";
import type { GridRect } from "./types";

export interface RectClampOptions {
  maxSize?: Pick<GridRect, "w" | "h">;
  maxArea?: number;
}

function roundCell(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function applyMaxArea(
  size: Pick<GridRect, "w" | "h">,
  minSize: Pick<GridRect, "w" | "h">,
  maxArea?: number,
): Pick<GridRect, "w" | "h"> {
  if (!maxArea || size.w * size.h <= maxArea) {
    return size;
  }

  let next = { ...size };
  while (next.w * next.h > maxArea && (next.w > minSize.w || next.h > minSize.h)) {
    if (next.h > minSize.h) {
      next = { ...next, h: next.h - 1 };
    } else {
      next = { ...next, w: next.w - 1 };
    }
  }
  return next;
}

export function snapRect(rect: GridRect): GridRect {
  return {
    x: roundCell(rect.x),
    y: roundCell(rect.y),
    w: Math.max(1, roundCell(rect.w)),
    h: Math.max(1, roundCell(rect.h)),
  };
}

export function clampRect(
  rect: GridRect,
  minSize: Pick<GridRect, "w" | "h"> = { w: 1, h: 1 },
  options: RectClampOptions = {},
): GridRect {
  const snapped = snapRect(rect);
  const maxSize = options.maxSize ?? { w: BENTO_GRID.columns, h: BENTO_GRID.rows };
  const bounded = {
    w: Math.min(BENTO_GRID.columns, maxSize.w, Math.max(minSize.w, snapped.w)),
    h: Math.min(BENTO_GRID.rows, maxSize.h, Math.max(minSize.h, snapped.h)),
  };
  const areaBounded = applyMaxArea(bounded, minSize, options.maxArea);

  return {
    x: Math.min(BENTO_GRID.columns - areaBounded.w, Math.max(0, snapped.x)),
    y: Math.min(BENTO_GRID.rows - areaBounded.h, Math.max(0, snapped.y)),
    w: areaBounded.w,
    h: areaBounded.h,
  };
}

export function rectsOverlap(first: GridRect, second: GridRect): boolean {
  return !(
    first.x + first.w <= second.x ||
    second.x + second.w <= first.x ||
    first.y + first.h <= second.y ||
    second.y + second.h <= first.y
  );
}

export function canPlaceRect(
  rect: GridRect,
  existingRects: GridRect[],
  minSize: Pick<GridRect, "w" | "h"> = { w: 1, h: 1 },
  options: RectClampOptions = {},
): boolean {
  const snapped = snapRect(rect);
  const clamped = clampRect(rect, minSize, options);
  if (
    clamped.x !== snapped.x ||
    clamped.y !== snapped.y ||
    clamped.w !== snapped.w ||
    clamped.h !== snapped.h
  ) {
    return false;
  }

  return existingRects.every((existing) => !rectsOverlap(clamped, existing));
}

export function packRooms<
  T extends {
    defaultSize: Pick<GridRect, "w" | "h">;
    minSize: Pick<GridRect, "w" | "h">;
    maxSize?: Pick<GridRect, "w" | "h">;
    maxArea?: number;
  },
>(rooms: T[]): Array<T & { rect: GridRect }> {
  const placed: Array<T & { rect: GridRect }> = [];

  for (const room of rooms) {
    const sizeOptions = [room.defaultSize, room.minSize];
    let rect: GridRect | null = null;

    for (const size of sizeOptions) {
      for (let y = 0; y <= BENTO_GRID.rows - size.h; y += 1) {
        for (let x = 0; x <= BENTO_GRID.columns - size.w; x += 1) {
          const candidate = { x, y, w: size.w, h: size.h };
          if (
            canPlaceRect(candidate, placed.map((item) => item.rect), room.minSize, {
              maxSize: room.maxSize,
              maxArea: room.maxArea,
            })
          ) {
            rect = candidate;
            break;
          }
        }
        if (rect) {
          break;
        }
      }
      if (rect) {
        break;
      }
    }

    placed.push({
      ...room,
      rect: rect ?? { x: 0, y: 0, w: room.minSize.w, h: room.minSize.h },
    });
  }

  return placed;
}
