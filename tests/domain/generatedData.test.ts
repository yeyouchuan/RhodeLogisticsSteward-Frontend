import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { BuildingReference, OperatorManifest } from "../../src/domain/types";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

describe("generated data", () => {
  it("keeps operator manifest shape stable", () => {
    const manifest = readJson<OperatorManifest>(join(process.cwd(), "public/operators/manifest.json"));

    expect(manifest.operators).toHaveLength(415);
    expect(manifest.source.portraitFiles).toBe(417);
    expect(manifest.operators[0]).toHaveProperty("portraitPath");
    expect(new Set(manifest.operators.map((operator) => operator.id)).size).toBe(415);
    expect(manifest.operators.filter((operator) => operator.aliases.includes("Amiya"))).toHaveLength(1);
  });

  it("keeps building reference counts and filter options", () => {
    const reference = readJson<BuildingReference>(
      join(process.cwd(), "public/data/building-reference.json"),
    );

    expect(reference.operatorSkills).toHaveLength(892);
    expect(Object.keys(reference.skillsById)).toHaveLength(727);
    expect(reference.roomTypes.map((roomType) => roomType.id)).toEqual(
      expect.arrayContaining([
        "CONTROL",
        "POWER",
        "MANUFACTURE",
        "TRADING",
        "DORMITORY",
        "HIRE",
        "MEETING",
        "TRAINING",
        "WORKSHOP",
      ]),
    );
    expect(reference.productionFormulaTypes.map((formulaType) => formulaType.id)).toEqual(
      expect.arrayContaining(["F_EXP", "F_GOLD", "F_ASC", "F_DIAMOND", "F_BUILDING", "F_EVOLVE", "F_SKILL"]),
    );
  });
});
