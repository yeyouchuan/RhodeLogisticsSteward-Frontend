import { useCallback, useEffect, useMemo, useState } from "react";
import { createDefaultSchedule } from "../domain/createDefaultSchedule";
import {
  assignOperator,
  clearSlot,
  setSlotElitePhase,
  setLayout,
  setQueueCount,
  swapSlots,
  updateMetadata,
  updateQueueLabels,
  updateRoomEfficiencyLabels,
  validateScheduleDocument,
  type ScheduleMetadataPatch,
} from "../domain/scheduleDocument";
import type { ElitePhase, ScheduleDocument, SlotAddress } from "../domain/types";
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from "./useLocalDraft";

export function useScheduleStore(initialDocument?: ScheduleDocument) {
  const [document, setDocument] = useState<ScheduleDocument>(() => {
    if (initialDocument) {
      return initialDocument;
    }

    return loadLocalDraft() ?? createDefaultSchedule();
  });

  useEffect(() => {
    saveLocalDraft(document);
  }, [document]);

  const assignedOperatorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const queue of document.queues) {
      for (const assignment of queue.roomAssignments) {
        for (const slot of assignment.operators) {
          if (slot.operatorId) {
            ids.add(slot.operatorId);
          }
        }
      }
    }
    return ids;
  }, [document]);

  const replaceDocument = useCallback((next: unknown): boolean => {
    if (!validateScheduleDocument(next)) {
      return false;
    }

    setDocument(next);
    return true;
  }, []);

  return {
    document,
    assignedOperatorIds,
    setLayout: useCallback((layoutId: string) => {
      setDocument((current) => setLayout(current, layoutId));
    }, []),
    setQueueCount: useCallback((count: number) => {
      setDocument((current) => setQueueCount(current, count));
    }, []),
    assignOperator: useCallback(
      (queueId: string, assignmentId: string, slotIndex: number, operatorId: string) => {
        setDocument((current) => assignOperator(current, queueId, assignmentId, slotIndex, operatorId));
      },
      [],
    ),
    clearSlot: useCallback((queueId: string, assignmentId: string, slotIndex: number) => {
      setDocument((current) => clearSlot(current, queueId, assignmentId, slotIndex));
    }, []),
    setSlotElitePhase: useCallback(
      (queueId: string, assignmentId: string, slotIndex: number, elitePhase?: ElitePhase) => {
        setDocument((current) =>
          setSlotElitePhase(current, queueId, assignmentId, slotIndex, elitePhase),
        );
      },
      [],
    ),
    swapSlots: useCallback((source: SlotAddress, target: SlotAddress) => {
      setDocument((current) => swapSlots(current, source, target));
    }, []),
    updateMetadata: useCallback((patch: ScheduleMetadataPatch) => {
      setDocument((current) => updateMetadata(current, patch));
    }, []),
    updateQueueLabels: useCallback(
      (queueId: string, patch: { label?: string; durationLabel?: string }) => {
        setDocument((current) => updateQueueLabels(current, queueId, patch));
      },
      [],
    ),
    updateRoomEfficiencyLabels: useCallback(
      (
        queueId: string,
        assignmentId: string,
        labels: { paperEfficiencyLabel?: string; effectiveEfficiencyLabel?: string; notes?: string[] },
      ) => {
        setDocument((current) => updateRoomEfficiencyLabels(current, queueId, assignmentId, labels));
      },
      [],
    ),
    replaceDocument,
    resetDraft: useCallback(() => {
      clearLocalDraft();
      setDocument(createDefaultSchedule());
    }, []),
  };
}
