import { migrateScheduleDocument } from "../domain/migrateScheduleDocument";
import type { Operator, ScheduleDocument } from "../domain/types";
import { maaCustomInfrastToScheduleDocument } from "./maaCustomInfrast";

export async function importScheduleJson(file: File, operators: Operator[] = []): Promise<ScheduleDocument> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;

  const migrated = migrateScheduleDocument(parsed);
  if (migrated) {
    return migrated;
  }

  const maaDocument = maaCustomInfrastToScheduleDocument(parsed, operators);
  if (maaDocument) {
    return maaDocument;
  }

  throw new Error("Imported file is neither ScheduleDocument v2/v1 nor MAA custom_infrast.");
}
