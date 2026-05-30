import { forwardRef, useMemo } from "react";
import {
  findIncompleteRoomTypes,
  type PosterComponentAddKind,
  type PosterComponentContentPatch,
} from "../../domain/scheduleDocument";
import { withMockCalculations } from "../../domain/mockCalculator";
import type {
  BuildingReference,
  GridRect,
  Operator,
  PosterRect,
  ProductKind,
  ScheduleDocument,
  SlotAddress,
} from "../../domain/types";
import styles from "../../styles/canvas.module.css";
import { PosterCanvas } from "./PosterCanvas";

interface ScheduleCanvasProps {
  document: ScheduleDocument;
  operators: Operator[];
  reference: BuildingReference | null;
  selectedSlot: SlotAddress | null;
  onSlotSelect: (address: SlotAddress) => void;
  onMetadataChange: (patch: {
    title?: string;
    subtitle?: string;
    authorText?: string;
    notes?: string[];
    productionSummary?: Partial<ScheduleDocument["productionSummary"]>;
    droneSummary?: Partial<ScheduleDocument["droneSummary"]>;
  }) => void;
  onActiveQueueChange: (queueId: string) => void;
  onRoomMove: (roomNodeId: string, rect: GridRect) => void;
  onRoomResize: (roomNodeId: string, rect: GridRect) => void;
  onRoomProductChange: (roomNodeId: string, product?: ProductKind) => void;
  onRoomRemove: (roomNodeId: string) => void;
  onPosterComponentRectChange: (componentId: string, rect: PosterRect) => void;
  onPosterComponentContentChange?: (componentId: string, patch: PosterComponentContentPatch) => void;
  onPosterComponentSelect?: (componentId: string | null) => void;
  onPosterRegenerate: () => void;
  onPosterComponentAdd?: (kind: PosterComponentAddKind) => void;
  onPosterComponentDelete?: (componentId: string) => void;
  onPosterComponentDuplicate?: (componentId: string) => void;
  onPosterComponentLayerChange?: (componentId: string, direction: "up" | "down") => void;
  onPosterUndo?: () => void;
  onPosterRedo?: () => void;
  canUndoPoster?: boolean;
  canRedoPoster?: boolean;
  posterGuidesVisible?: boolean;
  posterSnapEnabled?: boolean;
  selectedPosterComponentId?: string | null;
}

export const ScheduleCanvas = forwardRef<HTMLDivElement, ScheduleCanvasProps>(
  (
    {
      document,
      operators,
      reference,
      selectedSlot,
      onSlotSelect,
      onRoomMove,
      onRoomResize,
      onRoomProductChange,
      onRoomRemove,
      onPosterComponentRectChange,
      onPosterComponentContentChange = () => undefined,
      onPosterComponentDelete = () => undefined,
      onPosterComponentDuplicate = () => undefined,
      onPosterComponentLayerChange = () => undefined,
      onPosterComponentSelect = () => undefined,
      posterGuidesVisible = true,
      posterSnapEnabled = true,
      selectedPosterComponentId = null,
    },
    ref,
  ) => {
    const calculated = useMemo(() => withMockCalculations(document), [document]);
    const missingRooms = findIncompleteRoomTypes(calculated);

    return (
      <div
        aria-label="Schedule export canvas"
        className={styles.canvas}
        data-canvas-root
        data-guides-visible={posterGuidesVisible}
        ref={ref}
      >
        <div className={styles.bentoShell}>
          {missingRooms.length > 0 ? (
            <div className={styles.validationWarning}>
              缺少必要设施：{missingRooms.join(", ")}。草稿仍可导出 PNG。
            </div>
          ) : null}
          <PosterCanvas
            document={calculated}
            onRoomMove={onRoomMove}
            onRoomProductChange={onRoomProductChange}
            onRoomRemove={onRoomRemove}
            onRoomResize={onRoomResize}
            onPosterComponentRectChange={onPosterComponentRectChange}
            onPosterComponentContentChange={onPosterComponentContentChange}
            onPosterComponentDelete={onPosterComponentDelete}
            onPosterComponentDuplicate={onPosterComponentDuplicate}
            onPosterComponentLayerChange={onPosterComponentLayerChange}
            onPosterComponentSelect={onPosterComponentSelect}
            posterGuidesVisible={posterGuidesVisible}
            posterSnapEnabled={posterSnapEnabled}
            selectedPosterComponentId={selectedPosterComponentId}
            onSlotSelect={onSlotSelect}
            operators={operators}
            reference={reference}
            selectedSlot={selectedSlot}
          />
        </div>
      </div>
    );
  },
);

ScheduleCanvas.displayName = "ScheduleCanvas";
