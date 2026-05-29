import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScheduleCanvas } from "../../src/components/canvas/ScheduleCanvas";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { assignOperator } from "../../src/domain/scheduleDocument";
import type { BuildingReference, Operator } from "../../src/domain/types";

const operator: Operator = {
  id: "op-a",
  name: "阿米娅",
  portraitPath: "",
  aliases: ["Amiya"],
  tags: [],
  profession: "术师",
  rarity: 5,
  source: "mock",
};

describe("ScheduleCanvas", () => {
  it("renders an empty schedule without errors", () => {
    render(
      <ScheduleCanvas
        document={createDefaultSchedule("243", 1)}
        onMetadataChange={vi.fn()}
        onQueueChange={vi.fn()}
        onRoomLabelsChange={vi.fn()}
        onSlotSelect={vi.fn()}
        operators={[]}
        reference={null}
        selectedSlot={null}
      />,
    );

    expect(screen.getByText("罗德岛基建排班表")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "选择干员" }).length).toBeGreaterThan(0);
  });

  it("omits export footer and decorative facility captions", () => {
    const document = {
      ...createDefaultSchedule("243", 1),
      authorText: "Rhode Logistics Steward",
      notes: ["Canvas footer note"],
    };

    render(
      <ScheduleCanvas
        document={document}
        onMetadataChange={vi.fn()}
        onQueueChange={vi.fn()}
        onRoomLabelsChange={vi.fn()}
        onSlotSelect={vi.fn()}
        operators={[]}
        reference={null}
        selectedSlot={null}
      />,
    );

    expect(screen.queryByText("Canvas footer note")).not.toBeInTheDocument();
    expect(screen.queryByText("Rhode Logistics Steward")).not.toBeInTheDocument();
    expect(screen.queryByText("Control")).not.toBeInTheDocument();
    expect(screen.queryByText("Money")).not.toBeInTheDocument();
    expect(screen.queryByText("PureGold")).not.toBeInTheDocument();
    expect(screen.queryByText("CombatRecord")).not.toBeInTheDocument();
    expect(screen.queryByText("Power")).not.toBeInTheDocument();
  });

  it("renders production stats as one editable calculation line", () => {
    const onMetadataChange = vi.fn();

    render(
      <ScheduleCanvas
        document={createDefaultSchedule("243", 1)}
        onMetadataChange={onMetadataChange}
        onQueueChange={vi.fn()}
        onRoomLabelsChange={vi.fn()}
        onSlotSelect={vi.fn()}
        operators={[]}
        reference={null}
        selectedSlot={null}
      />,
    );

    const productionLine = screen.getByRole("textbox", { name: "产出计算" });
    expect(screen.getByText("产出计算")).toBeInTheDocument();
    expect(productionLine).toHaveTextContent("订单");
    expect(productionLine).toHaveTextContent("赤金");
    expect(productionLine).toHaveTextContent("经验");
    expect(screen.queryByText("ORDER")).not.toBeInTheDocument();
    expect(screen.queryByText("GOLD")).not.toBeInTheDocument();
    expect(screen.queryByText("RECORD")).not.toBeInTheDocument();

    productionLine.textContent = "订单 6.00w · 赤金 4.00w · 经验 7.00w";
    fireEvent.blur(productionLine);

    expect(onMetadataChange).toHaveBeenCalledWith({
      productionSummary: {
        orderText: "订单 6.00w · 赤金 4.00w · 经验 7.00w",
        goldText: "",
        recordText: "",
        customLine: "手动编辑数值",
      },
    });
  });

  it("renders each queue label in its own row index and hides durations", () => {
    const document = createDefaultSchedule("243", 3);
    const queueLabels = ["Queue Alpha", "Queue Beta", "Queue Gamma"];
    const durationLabels = ["Morning Shift", "Evening Shift", "Rotation Three"];
    const labeledDocument = {
      ...document,
      queues: document.queues.map((queue, index) => ({
        ...queue,
        label: queueLabels[index],
        durationLabel: durationLabels[index],
      })),
    };

    const { container } = render(
      <ScheduleCanvas
        document={labeledDocument}
        onMetadataChange={vi.fn()}
        onQueueChange={vi.fn()}
        onRoomLabelsChange={vi.fn()}
        onSlotSelect={vi.fn()}
        operators={[]}
        reference={null}
        selectedSlot={null}
      />,
    );

    const queueIndexes = Array.from(container.querySelectorAll("[data-queue-index-badge]"));
    expect(queueIndexes).toHaveLength(3);
    for (const [index, label] of queueLabels.entries()) {
      expect(queueIndexes[index]).toHaveTextContent(label);
      expect(screen.getAllByText(label)).toHaveLength(1);
    }
    for (const duration of durationLabels) {
      expect(screen.queryByText(duration)).not.toBeInTheDocument();
    }
  });

  it("renders facility titles for every row column without restoring English product captions", () => {
    const { container } = render(
      <ScheduleCanvas
        document={createDefaultSchedule("243", 3)}
        onMetadataChange={vi.fn()}
        onQueueChange={vi.fn()}
        onRoomLabelsChange={vi.fn()}
        onSlotSelect={vi.fn()}
        operators={[]}
        reference={null}
        selectedSlot={null}
      />,
    );

    const facilityTitles = Array.from(container.querySelectorAll("[data-facility-title]"));
    expect(facilityTitles).toHaveLength(15);
    expect(facilityTitles[4]).toHaveTextContent("电力");
    expect(facilityTitles[9]).toHaveTextContent("电力");
    expect(facilityTitles[14]).toHaveTextContent("电力");
    expect(screen.queryByText("宿舍")).not.toBeInTheDocument();
    expect(screen.queryByText("电力/宿舍")).not.toBeInTheDocument();
    expect(screen.queryByText("Control")).not.toBeInTheDocument();
    expect(screen.queryByText("Money")).not.toBeInTheDocument();
    expect(screen.queryByText("PureGold")).not.toBeInTheDocument();
    expect(screen.queryByText("CombatRecord")).not.toBeInTheDocument();
    expect(screen.queryByText("Power")).not.toBeInTheDocument();
  });

  it("renders an auto elite phase icon when building skills require elite 2", () => {
    const document = createDefaultSchedule("243", 1);
    const assignment = document.queues[0].roomAssignments[0];
    const assigned = assignOperator(document, "queue-1", assignment.assignmentId, 0, "op-a");
    const reference: BuildingReference = {
      source: {
        localSourcePath: "",
        upstreamRepository: "",
        upstreamCommit: "",
        generatedAt: "",
        rowCounts: {},
      },
      roomTypes: [],
      productionFormulaTypes: [],
      operatorSkills: [
        {
          operatorId: "op-a",
          operatorName: "阿米娅",
          roomType: assignment.roomType as BuildingReference["operatorSkills"][number]["roomType"],
          buffId: "buff-a",
          buffName: "Test buff",
          descriptionText: "Test description",
          targetFormulaTypes: [],
          conditionPhase: "PHASE_2",
          conditionLevel: 1,
        },
      ],
      skillsById: {},
    };

    render(
      <ScheduleCanvas
        document={assigned}
        onMetadataChange={vi.fn()}
        onQueueChange={vi.fn()}
        onRoomLabelsChange={vi.fn()}
        onSlotSelect={vi.fn()}
        operators={[operator]}
        reference={reference}
        selectedSlot={null}
      />,
    );

    expect(screen.getByRole("img", { name: "精英化2" })).toBeInTheDocument();
  });
});
