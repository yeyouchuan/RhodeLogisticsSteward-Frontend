import { useDraggable } from "@dnd-kit/core";
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { filterOperators, type OperatorFilterState } from "../../domain/operatorFilters";
import type {
  BuildingReference,
  BuildingRoomTypeId,
  Operator,
  ProductionFormulaTypeId,
  SlotAddress,
} from "../../domain/types";
import styles from "../../styles/editor.module.css";
import { OperatorPortrait } from "../shared/OperatorPortrait";

interface OperatorPanelProps {
  operators: Operator[];
  reference: BuildingReference | null;
  filters: OperatorFilterState;
  setFilters: Dispatch<SetStateAction<OperatorFilterState>>;
  assignedOperatorIds: Set<string>;
  selectedSlot: SlotAddress | null;
  onAssignToSelected: (operatorId: string) => void;
}

const formulaTypesByRoomType: Partial<Record<BuildingRoomTypeId, ProductionFormulaTypeId[]>> = {
  TRADING: ["F_GOLD", "F_DIAMOND"],
  MANUFACTURE: ["F_EXP", "F_GOLD", "F_ASC", "F_DIAMOND"],
};

function getFormulaTypeIdsForRooms(roomTypes: BuildingRoomTypeId[]) {
  return new Set(roomTypes.flatMap((roomType) => formulaTypesByRoomType[roomType] ?? []));
}

function DraggableOperatorCard({
  operator,
  selectedSlot,
  onAssignToSelected,
}: {
  operator: Operator;
  selectedSlot: SlotAddress | null;
  onAssignToSelected: (operatorId: string) => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `operator:${operator.id}`,
    data: { type: "operator", operator, operatorId: operator.id },
  });

  return (
    <button
      {...attributes}
      {...listeners}
      className={styles.operatorCard}
      data-operator-pool-card
      data-rarity={operator.rarity}
      onClick={() => {
        if (selectedSlot) {
          onAssignToSelected(operator.id);
        }
      }}
      ref={setNodeRef}
      type="button"
    >
      <span className={styles.operatorPortraitFrame}>
        <OperatorPortrait
          fallbackText={operator.name.slice(0, 2)}
          loading="lazy"
          portraitPath={operator.portraitPath}
          professionAlt={operator.profession ?? ""}
          professionIconPath={operator.professionIconPath}
          rarityIconPath={operator.rarityIconPath}
        />
      </span>
      <span className={styles.operatorCardName}>
        {operator.name}
        <span className={styles.operatorMeta}>
          <DotsSixVerticalIcon size={10} /> {operator.profession ?? "干员"}
        </span>
      </span>
    </button>
  );
}

export function OperatorPanel({
  operators,
  reference,
  filters,
  setFilters,
  assignedOperatorIds,
  selectedSlot,
  onAssignToSelected,
}: OperatorPanelProps) {
  const shouldShowOperators = filters.roomTypes.length > 0;
  const availableFormulaTypeIds = useMemo(() => {
    return getFormulaTypeIdsForRooms(filters.roomTypes);
  }, [filters.roomTypes]);
  const shouldShowFormulaFilters = !shouldShowOperators || availableFormulaTypeIds.size > 0;
  const visibleFormulaTypes = (reference?.productionFormulaTypes ?? []).filter((formulaType) =>
    availableFormulaTypeIds.has(formulaType.id),
  );
  const filtered = shouldShowOperators
    ? filterOperators(operators, reference, filters, assignedOperatorIds)
    : [];
  const [roomFiltersCollapsed, setRoomFiltersCollapsed] = useState(false);
  const roomTypeLabels = useMemo(
    () => new Map((reference?.roomTypes ?? []).map((roomType) => [roomType.id, roomType.label])),
    [reference],
  );
  const selectedRoomTypes = filters.roomTypes
    .map((id) => ({ id, label: roomTypeLabels.get(id) ?? id }))
    .filter((roomType) => roomType.label);

  useEffect(() => {
    if (filters.roomTypes.length === 0) {
      setRoomFiltersCollapsed(false);
    }
  }, [filters.roomTypes.length]);

  function toggleRoomType(roomTypeId: BuildingRoomTypeId, checked: boolean) {
    setFilters((current) => {
      const roomTypes = checked
        ? [...current.roomTypes, roomTypeId]
        : current.roomTypes.filter((id) => id !== roomTypeId);
      const validFormulaTypeIds = getFormulaTypeIdsForRooms(roomTypes);

      return {
        ...current,
        roomTypes,
        formulaTypes: current.formulaTypes.filter((id) => validFormulaTypeIds.has(id)),
      };
    });

    if (checked) {
      setRoomFiltersCollapsed(true);
    }
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>干员池</h2>
        <span className={styles.countPill}>{filtered.length} / {operators.length}</span>
      </div>
      <div className={styles.panelBody}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>搜索</span>
          <input
            className={styles.textInput}
            onChange={(event) => setFilters((current) => ({ ...current, text: event.target.value }))}
            placeholder="名称 / alias"
            value={filters.text}
          />
        </label>
        <div className={styles.filterGroup}>
          <div className={styles.filterHeader}>
            <span className={styles.fieldLabel}>房间技能</span>
            {selectedRoomTypes.length > 0 ? (
              <button
                className={styles.filterToggle}
                onClick={() => setRoomFiltersCollapsed((value) => !value)}
                type="button"
              >
                {roomFiltersCollapsed ? "修改" : "收起"}
              </button>
            ) : null}
          </div>
          {roomFiltersCollapsed && selectedRoomTypes.length > 0 ? (
            <div className={styles.selectedChipRow}>
              {selectedRoomTypes.map((roomType) => (
                <button
                  className={styles.selectedChip}
                  key={roomType.id}
                  onClick={() => toggleRoomType(roomType.id, false)}
                  type="button"
                >
                  {roomType.label}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.chipGrid}>
              {(reference?.roomTypes ?? []).map((roomType) => (
                <label className={styles.chip} key={roomType.id}>
                  <input
                    checked={filters.roomTypes.includes(roomType.id)}
                    onChange={(event) => toggleRoomType(roomType.id, event.target.checked)}
                    type="checkbox"
                  />
                  {roomType.label}
                </label>
              ))}
            </div>
          )}
        </div>
        {shouldShowFormulaFilters ? (
          <div className={styles.filterGroup}>
            <span className={styles.fieldLabel}>产物公式</span>
            {visibleFormulaTypes.length > 0 ? (
              <div className={styles.chipGrid}>
                {visibleFormulaTypes.map((formulaType) => (
                  <label className={styles.chip} key={formulaType.id}>
                    <input
                      checked={filters.formulaTypes.includes(formulaType.id)}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          formulaTypes: event.target.checked
                            ? [...current.formulaTypes, formulaType.id]
                            : current.formulaTypes.filter((id) => id !== formulaType.id),
                        }))
                      }
                      type="checkbox"
                    />
                    {formulaType.label}
                  </label>
                ))}
              </div>
            ) : (
              <div className={styles.emptyHint}>先选择贸易站或制造站，再选择产物公式</div>
            )}
          </div>
        ) : null}
        <label className={styles.toggleRow}>
          <input
            checked={filters.assignedOnly}
            onChange={(event) =>
              setFilters((current) => ({ ...current, assignedOnly: event.target.checked }))
            }
            type="checkbox"
          />
          仅显示已上板干员
        </label>
        {shouldShowOperators ? (
          <div className={styles.operatorGrid}>
            {filtered.map((operator) => (
              <DraggableOperatorCard
                key={operator.id}
                onAssignToSelected={onAssignToSelected}
                operator={operator}
                selectedSlot={selectedSlot}
              />
            ))}
          </div>
        ) : (
          <div className={styles.operatorEmptyState}>
            先选一个房间技能，再加载对应干员
          </div>
        )}
      </div>
    </aside>
  );
}
