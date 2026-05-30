import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { Toolbar } from "../../src/components/editor/Toolbar";

describe("Toolbar", () => {
  it("renders Chinese poster template, mode, and queue controls", () => {
    const onQueueCountChange = vi.fn();
    const onPosterTemplateChange = vi.fn();
    const onPosterModeChange = vi.fn();

    render(
      <Toolbar
        document={createDefaultSchedule("243", 3)}
        onExportJson={vi.fn()}
        onExportPng={vi.fn()}
        onImportClick={vi.fn()}
        onLayoutChange={vi.fn()}
        onPosterModeChange={onPosterModeChange}
        onPosterTemplateChange={onPosterTemplateChange}
        onQueueCountChange={onQueueCountChange}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("队列")).toHaveValue("3");
    expect(screen.getByLabelText("导出模板")).toHaveValue("auto");
    expect(screen.getByLabelText("排班模式")).toHaveValue("normal");
    expect(screen.getByRole("option", { name: "4 队列" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "智能选择" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "组合方案" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("队列"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("导出模板"), { target: { value: "matrix" } });
    fireEvent.change(screen.getByLabelText("排班模式"), { target: { value: "combo" } });

    expect(onQueueCountChange).toHaveBeenCalledWith(4);
    expect(onPosterTemplateChange).toHaveBeenCalledWith("matrix");
    expect(onPosterModeChange).toHaveBeenCalledWith("combo");
  });
});
