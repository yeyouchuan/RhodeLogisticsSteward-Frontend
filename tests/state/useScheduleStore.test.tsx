import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { buildDefaultPosterCanvas } from "../../src/domain/posterCanvas";
import { useScheduleStore } from "../../src/state/useScheduleStore";

describe("useScheduleStore poster canvas history", () => {
  it("undoes and redoes poster layout changes without affecting schedule data", () => {
    const initial = {
      ...createDefaultSchedule("243", 3),
      posterCanvas: buildDefaultPosterCanvas(createDefaultSchedule("243", 3)),
    };
    const { result } = renderHook(() => useScheduleStore(initial));
    const first = result.current.document.posterCanvas!.components[0];

    act(() => {
      result.current.updatePosterComponentRect(first.id, {
        x: 1600,
        y: 1200,
        w: first.rect.w,
        h: first.rect.h,
      });
    });

    expect(result.current.document.posterCanvas?.components[0].rect.x).toBe(1600);
    expect(result.current.canUndoPosterCanvas).toBe(true);
    expect(result.current.canRedoPosterCanvas).toBe(false);

    act(() => {
      result.current.undoPosterCanvas();
    });

    expect(result.current.document.posterCanvas?.components[0].rect.x).toBe(first.rect.x);
    expect(result.current.canUndoPosterCanvas).toBe(false);
    expect(result.current.canRedoPosterCanvas).toBe(true);

    act(() => {
      result.current.redoPosterCanvas();
    });

    expect(result.current.document.posterCanvas?.components[0].rect.x).toBe(1600);
    expect(result.current.document.queueCount).toBe(3);
  });

  it("tracks poster component content edits in poster canvas history", () => {
    const initial = {
      ...createDefaultSchedule("243", 3),
      posterCanvas: buildDefaultPosterCanvas(createDefaultSchedule("243", 3)),
    };
    const { result } = renderHook(() => useScheduleStore(initial));

    act(() => {
      result.current.updatePosterComponentContent("note:summary", {
        title: "自定义备注",
        text: "外层工具栏不会遮挡海报",
      });
    });

    expect(result.current.document.posterCanvas?.components.find((component) => component.id === "note:summary")).toMatchObject({
      title: "自定义备注",
      text: "外层工具栏不会遮挡海报",
    });
    expect(result.current.canUndoPosterCanvas).toBe(true);

    act(() => {
      result.current.undoPosterCanvas();
    });

    expect(result.current.document.posterCanvas?.components.find((component) => component.id === "note:summary")?.title).not.toBe(
      "自定义备注",
    );
  });

  it("clears poster canvas components and keeps the operation undoable", () => {
    const initial = {
      ...createDefaultSchedule("243", 3),
      posterCanvas: buildDefaultPosterCanvas(createDefaultSchedule("243", 3)),
    };
    const initialCount = initial.posterCanvas.components.length;
    const { result } = renderHook(() => useScheduleStore(initial));

    act(() => {
      result.current.clearPosterCanvas();
    });

    expect(result.current.document.posterCanvas?.components).toHaveLength(0);
    expect(result.current.canUndoPosterCanvas).toBe(true);
    expect(result.current.canRedoPosterCanvas).toBe(false);

    act(() => {
      result.current.undoPosterCanvas();
    });

    expect(result.current.document.posterCanvas?.components).toHaveLength(initialCount);
  });
});
