import { describe, expect, it } from "vitest";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import type { Operator } from "../../src/domain/types";
import { importScheduleJson } from "../../src/export/importJson";

const operators: Operator[] = [
  {
    id: "op-blacknight",
    name: "Blacknight",
    portraitPath: "/operators/portraits/Blacknight.png",
    aliases: ["Hei"],
    tags: [],
    source: "mock",
  },
];

function jsonFile(value: unknown) {
  return new File([JSON.stringify(value)], "schedule.json", {
    type: "application/json",
  });
}

describe("importScheduleJson", () => {
  it("imports a v2 ScheduleDocument without an extra message", async () => {
    const source = createDefaultSchedule("243", 2);
    const result = await importScheduleJson(jsonFile(source), operators);

    expect(result.document.version).toBe(2);
    expect(result.document.layoutId).toBe("243");
    expect(result.document.queueCount).toBe(2);
    expect(result.message).toBeUndefined();
  });

  it("imports MAA custom_infrast JSON with a user-facing report message", async () => {
    const result = await importScheduleJson(
      jsonFile({
        title: "MAA import",
        plans: [
          {
            name: "A",
            rooms: { trading: [{ product: "LMD", operators: ["Blacknight", "Unknown A"] }] },
          },
          { name: "B", rooms: { trading: [{ product: "LMD", operators: ["Blacknight"] }] } },
          { name: "C", rooms: { trading: [{ product: "LMD", operators: ["Blacknight"] }] } },
          { name: "D", rooms: { trading: [{ product: "LMD", operators: ["Blacknight"] }] } },
        ],
      }),
      operators,
    );

    expect(result.document.version).toBe(2);
    expect(result.document.queueCount).toBe(3);
    const trading = result.document.queues[0].roomAssignments.find((assignment) => assignment.roomType === "TRADING");
    expect(trading?.operators[0].operatorId).toBe("op-blacknight");
    expect(trading?.operators[1].overrideName).toBe("Unknown A");
    expect(result.message).toContain("MAA");
    expect(result.message).toContain("3");
    expect(result.message).toContain("1");
  });

  it("rejects JSON that is neither ScheduleDocument nor MAA custom_infrast", async () => {
    await expect(importScheduleJson(jsonFile({ title: "invalid", plans: [] }), operators)).rejects.toThrow(
      /ScheduleDocument v2\/v1|MAA custom_infrast/,
    );
  });
});
