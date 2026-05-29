import type { ScheduleDocument } from "../domain/types";

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "schedule";
}

export function downloadJson(document: ScheduleDocument): void {
  const blob = new Blob([JSON.stringify(document, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = globalThis.document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `${safeFileName(document.title)}-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
