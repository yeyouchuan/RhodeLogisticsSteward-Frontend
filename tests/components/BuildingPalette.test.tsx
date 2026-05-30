import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BuildingPalette } from "../../src/components/editor/BuildingPalette";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { removeRoom } from "../../src/domain/scheduleDocument";

describe("BuildingPalette", () => {
  it("renders facility templates without operator pool cards", () => {
    render(
      <DndContext>
        <BuildingPalette
          document={createDefaultSchedule("243", 3)}
          onAddRoom={vi.fn()}
          onPosterComponentAdd={vi.fn()}
          onLayoutChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.queryByRole("heading", { name: "设施" })).not.toBeInTheDocument();
    expect(document.querySelector("[data-operator-pool-card]")).toBeNull();
    expect(document.querySelectorAll("[data-facility-template]")).toHaveLength(6);
  });

  it("keeps sidebar actions compact and accessible", () => {
    render(
      <DndContext>
        <BuildingPalette
          document={createDefaultSchedule("243", 3)}
          onAddRoom={vi.fn()}
          onCollapse={vi.fn()}
          onPosterComponentAdd={vi.fn()}
          onLayoutChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.queryByRole("button", { name: "重置" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "重置当前布局" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "隐藏侧栏" })).toHaveAttribute("data-icon-only", "true");
  });

  it("marks full facility types without disabling drag", () => {
    const full = createDefaultSchedule("243", 3);
    const missingPower = removeRoom(full, "power-1");
    const { rerender } = render(
      <DndContext>
        <BuildingPalette
          document={full}
          onAddRoom={vi.fn()}
          onPosterComponentAdd={vi.fn()}
          onLayoutChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.getByRole("button", { name: /发电站/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /发电站/ })).toHaveAttribute("data-disabled", "true");

    rerender(
      <DndContext>
        <BuildingPalette
          document={missingPower}
          onAddRoom={vi.fn()}
          onPosterComponentAdd={vi.fn()}
          onLayoutChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.getByRole("button", { name: /发电站/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /发电站/ })).toHaveAttribute("data-disabled", "false");
  });

  it("adds poster component templates from the sidebar", () => {
    const onPosterComponentAdd = vi.fn();
    render(
      <DndContext>
        <BuildingPalette
          document={createDefaultSchedule("243", 3)}
          onAddRoom={vi.fn()}
          onPosterComponentAdd={onPosterComponentAdd}
          onLayoutChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(document.querySelectorAll("[data-poster-component-template]")).toHaveLength(3);
    expect(screen.queryByText("单个设施")).not.toBeInTheDocument();
    expect(screen.queryByText("设施组")).not.toBeInTheDocument();
    expect(screen.getByText("文本备注、产出摘要和分隔线")).toBeInTheDocument();

    const noteTemplate = document.querySelector(
      "[data-poster-component-template][data-poster-add-kind='note']",
    ) as HTMLButtonElement;
    noteTemplate.click();

    expect(onPosterComponentAdd).toHaveBeenCalledWith("note");
  });
});
