import { validateScheduleDocument } from "../domain/scheduleDocument";
import type { ScheduleDocument } from "../domain/types";

export async function importScheduleJson(file: File): Promise<ScheduleDocument> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;

  if (!validateScheduleDocument(parsed)) {
    throw new Error("Imported JSON is not a version 1 schedule document.");
  }

  return parsed;
}
