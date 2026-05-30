import { toPng } from "html-to-image";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exportSchedulePng } from "../../src/export/exportPng";
import type { ScheduleDocument } from "../../src/domain/types";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(),
}));

const toPngMock = vi.mocked(toPng);
const scheduleDocument = { title: "Test/Poster" } as ScheduleDocument;

afterEach(() => {
  vi.restoreAllMocks();
  toPngMock.mockReset();
});

describe("exportSchedulePng", () => {
  it("enables export mode while rasterizing and restores the element afterwards", async () => {
    const element = globalThis.document.createElement("div");
    const hidden = globalThis.document.createElement("div");
    const resizeHandle = globalThis.document.createElement("div");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    element.setAttribute("data-exporting", "preview");
    hidden.setAttribute("data-export-hidden", "");
    resizeHandle.setAttribute("data-resize-handle", "");

    toPngMock.mockImplementation(async (node, options) => {
      expect((node as HTMLElement).getAttribute("data-exporting")).toBe("true");
      expect(options?.filter?.(hidden)).toBe(false);
      expect(options?.filter?.(resizeHandle)).toBe(false);
      expect(options?.filter?.(element)).toBe(true);
      return "data:image/png;base64,export";
    });

    await exportSchedulePng(element, scheduleDocument);

    expect(element.getAttribute("data-exporting")).toBe("preview");
    expect(toPngMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("cleans up export mode when rasterizing fails", async () => {
    const element = globalThis.document.createElement("div");

    toPngMock.mockRejectedValue(new Error("capture failed"));

    await expect(exportSchedulePng(element, scheduleDocument)).rejects.toThrow("capture failed");

    expect(element.hasAttribute("data-exporting")).toBe(false);
  });
});
