import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OperatorPickerDialog } from "../../src/components/picker/OperatorPickerDialog";
import type { Operator, SlotAssignment } from "../../src/domain/types";

const operators: Operator[] = [
  {
    id: "op-a",
    name: "阿米娅",
    portraitPath: "",
    aliases: ["Amiya"],
    tags: [],
    source: "mock",
  },
];

describe("OperatorPickerDialog", () => {
  it("assigns and clears a slot", async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const onClear = vi.fn();

    render(
      <OperatorPickerDialog
        assignedOperatorIds={new Set()}
        baseFilters={{ text: "", roomTypes: [], formulaTypes: [], assignedOnly: false }}
        onAssign={onAssign}
        onClear={onClear}
        onElitePhaseChange={vi.fn()}
        onOpenChange={vi.fn()}
        open
        operators={operators}
        reference={null}
        selectedSlotAssignment={{ operatorId: "op-a", slotIndex: 0 }}
        selectedSlot={{ queueId: "queue-1", assignmentId: "room-1", slotIndex: 0 }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /阿米娅/ }));
    expect(onAssign).toHaveBeenCalledWith("op-a");

    await user.click(screen.getByRole("button", { name: "清空" }));
    expect(onClear).toHaveBeenCalled();
  });

  it("updates manual elite phase for the selected assigned slot", async () => {
    const user = userEvent.setup();
    const onElitePhaseChange = vi.fn();
    const selectedSlotAssignment: SlotAssignment = {
      slotIndex: 0,
      operatorId: "op-a",
      elitePhase: 2,
    };

    render(
      <OperatorPickerDialog
        assignedOperatorIds={new Set()}
        baseFilters={{ text: "", roomTypes: [], formulaTypes: [], assignedOnly: false }}
        onAssign={vi.fn()}
        onClear={vi.fn()}
        onElitePhaseChange={onElitePhaseChange}
        onOpenChange={vi.fn()}
        open
        operators={operators}
        reference={null}
        selectedSlotAssignment={selectedSlotAssignment}
        selectedSlot={{ queueId: "queue-1", assignmentId: "room-1", slotIndex: 0 }}
      />,
    );

    await user.selectOptions(screen.getByLabelText("精英状态"), "1");
    expect(onElitePhaseChange).toHaveBeenCalledWith(1);

    await user.selectOptions(screen.getByLabelText("精英状态"), "auto");
    expect(onElitePhaseChange).toHaveBeenCalledWith(undefined);
  });
});
