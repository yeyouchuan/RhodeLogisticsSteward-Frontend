import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OperatorPickerDialog } from "../../src/components/picker/OperatorPickerDialog";
import type { BuildingReference, Operator, SlotAssignment } from "../../src/domain/types";

const operators: Operator[] = [
  {
    id: "op-a",
    name: "阿米娅",
    portraitPath: "",
    aliases: ["Amiya"],
    tags: [],
    source: "mock",
  },
  {
    id: "op-b",
    name: "清流",
    portraitPath: "",
    aliases: [],
    tags: [],
    source: "mock",
  },
];

const reference: BuildingReference = {
  source: {
    localSourcePath: "",
    upstreamRepository: "",
    upstreamCommit: "",
    generatedAt: "",
    rowCounts: {},
  },
  roomTypes: [
    { id: "CONTROL", label: "控制中枢", operatorCount: 5, skillRowCount: 1 },
    { id: "MANUFACTURE", label: "制造站", operatorCount: 3, skillRowCount: 1 },
  ],
  productionFormulaTypes: [
    { id: "F_GOLD", label: "赤金", sources: ["manufacturing"], buffTypeIds: [], itemNames: [], skillTargetCount: 1 },
    { id: "F_EXP", label: "作战记录", sources: ["manufacturing"], buffTypeIds: [], itemNames: [], skillTargetCount: 1 },
  ],
  operatorSkills: [
    {
      operatorId: "op-a",
      operatorName: "阿米娅",
      roomType: "CONTROL",
      buffId: "buff-a",
      buffName: "Control",
      descriptionText: "",
      targetFormulaTypes: [],
      conditionPhase: "PHASE_0",
      conditionLevel: 1,
    },
    {
      operatorId: "op-b",
      operatorName: "清流",
      roomType: "MANUFACTURE",
      buffId: "buff-b",
      buffName: "Gold",
      descriptionText: "",
      targetFormulaTypes: ["F_GOLD"],
      conditionPhase: "PHASE_0",
      conditionLevel: 1,
    },
  ],
  skillsById: {},
};

function renderDialog(overrides: Partial<Parameters<typeof OperatorPickerDialog>[0]> = {}) {
  return render(
    <OperatorPickerDialog
      assignedOperatorIds={new Set()}
      onAssign={vi.fn()}
      onClear={vi.fn()}
      onElitePhaseChange={vi.fn()}
      onOpenChange={vi.fn()}
      open
      operators={operators}
      reference={reference}
      selectedSlot={{ queueId: "queue-1", assignmentId: "room-1", slotIndex: 0 }}
      selectedSlotAssignment={{ operatorId: "op-a", slotIndex: 0 }}
      {...overrides}
    />,
  );
}

describe("OperatorPickerDialog", () => {
  it("assigns and clears a slot", async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const onClear = vi.fn();

    renderDialog({ onAssign, onClear, selectedRoomType: "CONTROL" });

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

    renderDialog({ onElitePhaseChange, selectedSlotAssignment });

    await user.selectOptions(screen.getByLabelText("精英状态"), "1");
    expect(onElitePhaseChange).toHaveBeenCalledWith(1);

    await user.selectOptions(screen.getByLabelText("精英状态"), "auto");
    expect(onElitePhaseChange).toHaveBeenCalledWith(undefined);
  });

  it("filters by room skill, production formula, assigned-only and name", async () => {
    const user = userEvent.setup();

    renderDialog({
      assignedOperatorIds: new Set(["op-b"]),
      selectedProduct: "PureGold",
      selectedRoomType: "MANUFACTURE",
      selectedSlotAssignment: { slotIndex: 0 },
    });

    expect(screen.queryByRole("button", { name: /阿米娅/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /清流/ })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("名称 / alias"), "amiya");
    expect(screen.queryByRole("button", { name: /清流/ })).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("名称 / alias"));
    await user.click(screen.getByLabelText("仅显示已上板干员"));
    expect(screen.getByRole("button", { name: /清流/ })).toBeInTheDocument();
  });
});
