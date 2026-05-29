import { forwardRef, useMemo } from "react";
import { getLayoutPreset } from "../../data/layoutPresets";
import { withMockCalculations } from "../../domain/mockCalculator";
import type { BuildingReference, Operator, ScheduleDocument, SlotAddress } from "../../domain/types";
import styles from "../../styles/canvas.module.css";
import { CanvasHeader } from "./CanvasHeader";
import { QueueRow } from "./QueueRow";

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
  onQueueChange: (queueId: string, patch: { label?: string; durationLabel?: string }) => void;
  onRoomLabelsChange: (
    queueId: string,
    assignmentId: string,
    labels: { paperEfficiencyLabel?: string; effectiveEfficiencyLabel?: string; notes?: string[] },
  ) => void;
}

export const ScheduleCanvas = forwardRef<HTMLDivElement, ScheduleCanvasProps>(
  (
    {
      document,
      operators,
      reference,
      selectedSlot,
      onSlotSelect,
      onMetadataChange,
      onQueueChange,
      onRoomLabelsChange,
    },
    ref,
  ) => {
    const preset = getLayoutPreset(document.layoutId);
    const calculated = useMemo(() => withMockCalculations(document), [document]);
    const operatorMap = useMemo(
      () => new Map(operators.map((operator) => [operator.id, operator])),
      [operators],
    );

    return (
      <div aria-label="Schedule export canvas" className={styles.canvas} data-canvas-root ref={ref}>
        <CanvasHeader document={calculated} onMetadataChange={onMetadataChange} />
        <main className={styles.body}>
          {calculated.queues.map((queue) => (
            <QueueRow
              key={queue.id}
              onQueueChange={onQueueChange}
              onRoomLabelsChange={onRoomLabelsChange}
              onSlotSelect={onSlotSelect}
              operatorMap={operatorMap}
              preset={preset}
              queue={queue}
              queueCount={calculated.queueCount}
              reference={reference}
              selectedSlot={selectedSlot}
            />
          ))}
        </main>
      </div>
    );
  },
);

ScheduleCanvas.displayName = "ScheduleCanvas";
