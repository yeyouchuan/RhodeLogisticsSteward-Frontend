import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState, type ReactNode } from "react";
import { BENTO_GRID } from "../../domain/bentoDefinitions";
import { POSTER_COORD_MAX } from "../../domain/posterCanvas";
import type { PosterComponentAddKind } from "../../domain/scheduleDocument";
import { OperatorPortrait } from "../shared/OperatorPortrait";
import type { BentoRoomTypeId, GridRect, Operator, PosterRect, SlotAddress } from "../../domain/types";
import styles from "../../styles/drag.module.css";

interface DragDropProviderProps {
  children: ReactNode;
  onAssignOperator: (address: SlotAddress, operatorId: string) => void;
  onSwapSlots: (source: SlotAddress, target: SlotAddress) => void;
  onAddRoom: (roomType: BentoRoomTypeId, center?: Pick<GridRect, "x" | "y">) => void;
  onAddInfrastructureComponent: (roomType: BentoRoomTypeId, center?: Pick<PosterRect, "x" | "y">) => void;
  onAddPosterComponent: (kind: PosterComponentAddKind, center?: Pick<PosterRect, "x" | "y">) => void;
  onMoveRoom: (roomNodeId: string, rect: GridRect) => void;
  onClearSlot?: (address: SlotAddress) => void;
}

interface ClientPoint {
  x: number;
  y: number;
}

function isSlotAddress(value: unknown): value is SlotAddress {
  const address = value as SlotAddress;
  return (
    typeof address === "object" &&
    address !== null &&
    typeof address.queueId === "string" &&
    typeof address.assignmentId === "string" &&
    typeof address.slotIndex === "number"
  );
}

function isOperator(value: unknown): value is Operator {
  const operator = value as Operator;
  return (
    typeof operator === "object" &&
    operator !== null &&
    typeof operator.id === "string" &&
    typeof operator.name === "string"
  );
}

function isBentoRoomType(value: unknown): value is BentoRoomTypeId {
  return (
    value === "CONTROL" ||
    value === "TRADING" ||
    value === "MANUFACTURE" ||
    value === "POWER" ||
    value === "MEETING" ||
    value === "HIRE"
  );
}

function isPosterComponentAddKind(value: unknown): value is PosterComponentAddKind {
  return (
    value === "metric" ||
    value === "note" ||
    value === "divider"
  );
}

function isGridRect(value: unknown): value is GridRect {
  const rect = value as GridRect;
  return (
    typeof rect === "object" &&
    rect !== null &&
    typeof rect.x === "number" &&
    typeof rect.y === "number" &&
    typeof rect.w === "number" &&
    typeof rect.h === "number"
  );
}

function initials(name: string): string {
  return name.slice(0, 2).toLocaleUpperCase();
}

function isClientPointEvent(value: Event): value is Event & { clientX: number; clientY: number } {
  const event = value as Event & { clientX?: unknown; clientY?: unknown };
  return typeof event.clientX === "number" && typeof event.clientY === "number";
}

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function dragEndClientPoint(event: DragEndEvent): ClientPoint | null {
  if (isClientPointEvent(event.activatorEvent)) {
    return {
      x: event.activatorEvent.clientX + event.delta.x,
      y: event.activatorEvent.clientY + event.delta.y,
    };
  }

  const translatedRect = event.active.rect.current.translated;
  if (translatedRect) {
    return {
      x: translatedRect.left + translatedRect.width / 2,
      y: translatedRect.top + translatedRect.height / 2,
    };
  }

  return null;
}

function posterDropCenter(event: DragEndEvent): Pick<PosterRect, "x" | "y"> | undefined {
  const point = dragEndClientPoint(event);
  if (!point) {
    return undefined;
  }

  let posterCanvas =
    event.over?.id === "poster-canvas"
      ? null
      : globalThis.document
          ?.elementFromPoint(point.x, point.y)
          ?.closest("[data-poster-canvas]");
  if (!posterCanvas && globalThis.document) {
    posterCanvas =
      Array.from(globalThis.document.querySelectorAll("[data-poster-canvas]")).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return (
          point.x >= bounds.left &&
          point.x <= bounds.right &&
          point.y >= bounds.top &&
          point.y <= bounds.bottom
        );
      }) ?? null;
  }
  const rect = event.over?.id === "poster-canvas" ? event.over.rect : posterCanvas?.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return undefined;
  }

  return {
    x: clampRatio((point.x - rect.left) / rect.width) * POSTER_COORD_MAX,
    y: clampRatio((point.y - rect.top) / rect.height) * POSTER_COORD_MAX,
  };
}

function bentoDropCenter(event: DragEndEvent): Pick<GridRect, "x" | "y"> | undefined {
  if (!event.over || event.over.rect.width <= 0 || event.over.rect.height <= 0) {
    return undefined;
  }

  const point = dragEndClientPoint(event);
  if (!point) {
    return undefined;
  }

  return {
    x: clampRatio((point.x - event.over.rect.left) / event.over.rect.width) * BENTO_GRID.columns,
    y: clampRatio((point.y - event.over.rect.top) / event.over.rect.height) * BENTO_GRID.rows,
  };
}

function SquareDragPreview({ operator }: { operator: Operator }) {
  return (
    <div className={styles.dragPreview} data-drag-preview="operator">
      <OperatorPortrait
        fallbackText={initials(operator.name)}
        portraitPath={operator.portraitPath}
        professionIconPath={operator.professionIconPath}
        rarityIconPath={operator.rarityIconPath}
        variant="drag"
      />
      <span className={styles.name}>{operator.name}</span>
    </div>
  );
}

export function DragDropProvider({
  children,
  onAssignOperator,
  onSwapSlots,
  onAddRoom,
  onAddInfrastructureComponent,
  onAddPosterComponent,
  onMoveRoom,
  onClearSlot,
}: DragDropProviderProps) {
  const [activeOperator, setActiveOperator] = useState<Operator | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    const operator = event.active.data.current?.operator;
    setActiveOperator(isOperator(operator) ? operator : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveOperator(null);
    const active = event.active.data.current;
    const over = event.over?.data.current;

    if (!active) {
      return;
    }

    if (event.over?.id === "clear-zone" && active.type === "assigned" && isSlotAddress(active.address)) {
      onClearSlot?.(active.address);
      return;
    }

    if (active.type === "room" && typeof active.roomNodeId === "string" && isGridRect(active.rect)) {
      const cellWidth = typeof active.cellWidth === "number" && active.cellWidth > 0 ? active.cellWidth : 1;
      const cellHeight = typeof active.cellHeight === "number" && active.cellHeight > 0 ? active.cellHeight : 1;
      onMoveRoom(active.roomNodeId, {
        ...active.rect,
        x: active.rect.x + Math.round(event.delta.x / cellWidth),
        y: active.rect.y + Math.round(event.delta.y / cellHeight),
      });
      return;
    }

    if (
      active.type === "infrastructure-template" &&
      event.over?.id === "bento-canvas" &&
      isBentoRoomType(active.roomType)
    ) {
      onAddRoom(active.roomType, bentoDropCenter(event));
      return;
    }

    if (active.type === "infrastructure-template" && isBentoRoomType(active.roomType)) {
      const center = posterDropCenter(event);
      if (!center) {
        return;
      }

      onAddInfrastructureComponent(active.roomType, center);
      return;
    }

    if (active.type === "poster-component-template" && isPosterComponentAddKind(active.kind)) {
      const center = posterDropCenter(event);
      if (!center) {
        return;
      }

      onAddPosterComponent(active.kind, center);
      return;
    }

    if (!over || over.type !== "slot" || !isSlotAddress(over.address)) {
      return;
    }

    if (active.type === "operator" && typeof active.operatorId === "string") {
      onAssignOperator(over.address, active.operatorId);
      return;
    }

    if (active.type === "assigned" && isSlotAddress(active.address)) {
      onSwapSlots(active.address, over.address);
    }
  }

  return (
    <DndContext
      onDragCancel={() => setActiveOperator(null)}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeOperator ? <SquareDragPreview operator={activeOperator} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
