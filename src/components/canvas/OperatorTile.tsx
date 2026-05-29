import { useDraggable, useDroppable } from "@dnd-kit/core";
import { getRequiredElitePhase } from "../../domain/operatorPresentation";
import type {
  BuildingReference,
  ElitePhase,
  Operator,
  SlotAddress,
  SlotAssignment,
} from "../../domain/types";
import styles from "../../styles/canvas.module.css";

const eliteIconPaths: Record<ElitePhase, string> = {
  1: "/operators/elite/图标_升级_精英化1.png",
  2: "/operators/elite/图标_升级_精英化2.png",
};

interface OperatorTileProps {
  slot: SlotAssignment;
  address: SlotAddress;
  operator?: Operator;
  reference: BuildingReference | null;
  roomType: string;
  product?: string;
  selected: boolean;
  onSelect: (address: SlotAddress) => void;
}

function initials(name: string): string {
  return name.slice(0, 2).toLocaleUpperCase();
}

export function OperatorTile({
  slot,
  address,
  operator,
  reference,
  roomType,
  product,
  selected,
  onSelect,
}: OperatorTileProps) {
  const slotId = `slot:${address.queueId}:${address.assignmentId}:${address.slotIndex}`;
  const requiredElitePhase = getRequiredElitePhase(reference, operator, roomType, product);
  const displayElitePhase: ElitePhase | undefined = operator
    ? slot.elitePhase ?? (requiredElitePhase >= 2 ? 2 : requiredElitePhase >= 1 ? 1 : undefined)
    : undefined;
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: slotId,
    data: { type: "slot", address },
  });
  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
    id: `assigned:${slotId}`,
    data: { type: "assigned", address, operator, operatorId: operator?.id },
    disabled: !operator?.id,
  });

  return (
    <button
      {...attributes}
      {...listeners}
      aria-label={operator ? `编辑 ${operator.name}` : "选择干员"}
      className={styles.operatorTile}
      data-filled={Boolean(operator)}
      data-operator-tile
      data-over={isOver}
      data-selected={selected}
      onClick={() => onSelect(address)}
      ref={(node) => {
        setDropRef(node);
        setDragRef(node);
      }}
      type="button"
    >
      <span className={styles.portraitFrame} data-portrait-frame>
        {operator?.portraitPath ? (
          <img alt="" className={styles.portrait} src={operator.portraitPath} />
        ) : (
          <span className={styles.fallbackPortrait}>{operator ? initials(operator.name) : slot.slotIndex + 1}</span>
        )}
        {operator?.professionIconPath ? (
          <img
            alt={operator.profession ?? ""}
            className={styles.professionIcon}
            data-profession-icon
            src={operator.professionIconPath}
          />
        ) : null}
        {displayElitePhase ? (
          <img
            alt={`精英化${displayElitePhase}`}
            className={styles.eliteIcon}
            data-elite-icon
            src={eliteIconPaths[displayElitePhase]}
          />
        ) : null}
        {operator?.rarityIconPath ? (
          <img alt="" className={styles.rarityIcon} data-rarity-icon src={operator.rarityIconPath} />
        ) : null}
      </span>
      <span className={styles.slotText}>
        <span className={styles.operatorName} data-slot-name>
          {slot.overrideName ?? operator?.name ?? "空位"}
        </span>
        <span className={styles.slotHint}>
          {operator ? `${operator.profession ?? "干员"} ${operator.rarity ? `${operator.rarity}★` : ""}` : "点击选择"}
        </span>
      </span>
    </button>
  );
}
