import { calculateRoomEffectiveEfficiency, calculateRoomPaperEfficiency } from "../../domain/mockCalculator";
import type { CSSProperties } from "react";
import type {
  FacilityColumn as FacilityColumnType,
  BuildingReference,
  CanvasQueueProfile,
  Operator,
  RoomAssignment,
  ScheduleQueue,
  SlotAddress,
} from "../../domain/types";
import styles from "../../styles/canvas.module.css";
import { EditableText } from "./EditableText";
import { OperatorTile } from "./OperatorTile";

interface FacilityColumnProps {
  column: FacilityColumnType;
  profile: CanvasQueueProfile;
  queue: ScheduleQueue;
  operatorMap: Map<string, Operator>;
  reference: BuildingReference | null;
  selectedSlot: SlotAddress | null;
  onSlotSelect: (address: SlotAddress) => void;
  onRoomLabelsChange: (
    queueId: string,
    assignmentId: string,
    labels: { paperEfficiencyLabel?: string; effectiveEfficiencyLabel?: string; notes?: string[] },
  ) => void;
}

const themeClass = {
  control: styles.themeControl,
  trade: styles.themeTrade,
  gold: styles.themeGold,
  record: styles.themeRecord,
  other: styles.themeOther,
};

type RoomStyle = CSSProperties & Record<`--${string}`, string | number>;

function findAssignment(queue: ScheduleQueue, roomType: string, roomIndex: number, product?: string) {
  return queue.roomAssignments.find(
    (assignment) =>
      assignment.roomType === roomType &&
      assignment.roomIndex === roomIndex &&
      (assignment.product ?? "") === (product ?? ""),
  );
}

function roomLabel(assignment: RoomAssignment | undefined, fallback: string | undefined): string {
  if (!assignment) {
    return fallback ?? "房间";
  }

  return fallback ?? `${assignment.roomType} ${assignment.roomIndex}`;
}

function resolveSlotColumnCount(
  slotCount: number,
  preferredColumnCount: number,
  column: FacilityColumnType,
): number {
  if (slotCount === 3 && column.roomsPerQueue.length === 1) {
    return 1;
  }

  return preferredColumnCount;
}

function facilityTitle(column: FacilityColumnType): string {
  if (column.id === "power") {
    return "电力";
  }

  return column.label;
}

export function FacilityColumn({
  column,
  profile,
  queue,
  operatorMap,
  reference,
  selectedSlot,
  onSlotSelect,
  onRoomLabelsChange,
}: FacilityColumnProps) {
  return (
    <section className={styles.facilityColumn} data-facility-column>
      <div className={`${styles.facilityColumnTitle} ${themeClass[column.theme]}`} data-facility-title>
        {facilityTitle(column)}
      </div>
      <div
        className={styles.roomStack}
        style={{ gridTemplateRows: `repeat(${column.roomsPerQueue.length}, minmax(0, 1fr))` }}
      >
        {column.roomsPerQueue.map((room) => {
          const assignment = findAssignment(queue, room.roomType, room.roomIndex, room.product);
          const slots = assignment?.operators ?? [];
          const preferredSlotColumnCount =
            profile.slotColumns?.[slots.length] ?? Math.min(3, Math.max(1, slots.length));
          const slotColumnCount = resolveSlotColumnCount(
            slots.length,
            preferredSlotColumnCount,
            column,
          );
          const slotRowCount = Math.max(1, Math.ceil(slots.length / slotColumnCount));
          const slotInlineGapTotal = Math.max(0, slotColumnCount - 1) * profile.slotGap;
          const slotBlockGapTotal = Math.max(0, slotRowCount - 1) * profile.slotGap;

          return (
            <article
              className={`${styles.roomBlock} ${themeClass[column.theme]}`}
              data-compact={profile.compact}
              data-single-slot={slots.length === 1}
              key={room.roomId}
              style={{
                "--slot-gap": `${profile.slotGap}px`,
                "--slot-max-size": `${profile.maxSlotSize}px`,
              } as RoomStyle}
            >
              <div className={styles.roomTitle}>
                <span className={styles.roomName}>{roomLabel(assignment, room.label)}</span>
              </div>
              <div
                className={styles.slotGrid}
                style={{
                  gridTemplateColumns: `repeat(${slotColumnCount}, var(--computed-slot-size))`,
                  gridTemplateRows: `repeat(${slotRowCount}, var(--computed-tile-size))`,
                  "--slot-block-gap-share": `${slotBlockGapTotal / slotRowCount}px`,
                  "--slot-block-unit": `${100 / slotRowCount}cqh`,
                  "--slot-inline-gap-share": `${slotInlineGapTotal / slotColumnCount}px`,
                  "--slot-inline-unit": `${100 / slotColumnCount}cqw`,
                } as RoomStyle}
              >
                {slots.map((slot) => {
                  const address = {
                    queueId: queue.id,
                    assignmentId: assignment?.assignmentId ?? "",
                    slotIndex: slot.slotIndex,
                  };
                  const selected =
                    selectedSlot?.queueId === address.queueId &&
                    selectedSlot.assignmentId === address.assignmentId &&
                    selectedSlot.slotIndex === address.slotIndex;

                  return (
                    <OperatorTile
                      address={address}
                      key={slot.slotIndex}
                      onSelect={onSlotSelect}
                      operator={slot.operatorId ? operatorMap.get(slot.operatorId) : undefined}
                      product={assignment?.product}
                      reference={reference}
                      roomType={assignment?.roomType ?? room.roomType}
                      selected={selected}
                      slot={slot}
                    />
                  );
                })}
              </div>
              <div className={styles.efficiency} data-room-efficiency>
                {assignment ? (
                  <>
                    <EditableText
                      ariaLabel="编辑纸面效率"
                      onCommit={(paperEfficiencyLabel) =>
                        onRoomLabelsChange(queue.id, assignment.assignmentId, {
                          paperEfficiencyLabel,
                        })
                      }
                      value={calculateRoomPaperEfficiency(assignment)}
                    />
                    <EditableText
                      ariaLabel="编辑折算效率"
                      onCommit={(effectiveEfficiencyLabel) =>
                        onRoomLabelsChange(queue.id, assignment.assignmentId, {
                          effectiveEfficiencyLabel,
                        })
                      }
                      value={calculateRoomEffectiveEfficiency(assignment)}
                    />
                  </>
                ) : (
                  <>
                    <span>纸面 -</span>
                    <span>折算 -</span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
