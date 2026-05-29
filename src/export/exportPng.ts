import { toPng } from "html-to-image";
import type { ScheduleDocument } from "../domain/types";

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "schedule";
}

export async function exportSchedulePng(element: HTMLElement, document: ScheduleDocument): Promise<void> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#fffdf4",
  });
  const anchor = globalThis.document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  anchor.href = dataUrl;
  anchor.download = `${safeFileName(document.title)}-${date}.png`;
  anchor.click();
}
