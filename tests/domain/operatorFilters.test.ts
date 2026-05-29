import { describe, expect, it } from "vitest";
import { filterOperators } from "../../src/domain/operatorFilters";
import type { BuildingReference, Operator } from "../../src/domain/types";

const operators: Operator[] = [
  {
    id: "op-a",
    name: "阿米娅",
    portraitPath: "",
    aliases: ["Amiya"],
    tags: [],
    source: "mock",
  },
  {
    id: "op-b",
    name: "能天使",
    portraitPath: "",
    aliases: ["Exusiai"],
    tags: [],
    source: "mock",
  },
];

const reference: BuildingReference = {
  source: {
    localSourcePath: "",
    upstreamRepository: "",
    upstreamCommit: "",
    generatedAt: "",
    rowCounts: {},
  },
  roomTypes: [],
  productionFormulaTypes: [],
  skillsById: {},
  operatorSkills: [
    {
      operatorId: "op-a",
      operatorName: "阿米娅",
      roomType: "MANUFACTURE",
      buffId: "skill-a",
      buffName: "制造",
      descriptionText: "",
      targetFormulaTypes: ["F_EXP"],
      conditionPhase: "PHASE_0",
      conditionLevel: 1,
    },
    {
      operatorId: "char_b",
      operatorName: "能天使",
      roomType: "TRADING",
      buffId: "skill-b",
      buffName: "贸易",
      descriptionText: "",
      targetFormulaTypes: ["F_GOLD"],
      conditionPhase: "PHASE_0",
      conditionLevel: 1,
    },
  ],
};

describe("operator filters", () => {
  it("matches text by Chinese name and ASCII alias", () => {
    expect(filterOperators(operators, reference, { text: "amiya" })).toHaveLength(1);
    expect(filterOperators(operators, reference, { text: "能天" })[0].name).toBe("能天使");
  });

  it("combines groups with AND semantics", () => {
    expect(
      filterOperators(operators, reference, {
        text: "阿米娅",
        roomTypes: ["MANUFACTURE"],
        formulaTypes: ["F_EXP"],
      }),
    ).toHaveLength(1);

    expect(
      filterOperators(operators, reference, {
        text: "阿米娅",
        roomTypes: ["TRADING"],
        formulaTypes: ["F_EXP"],
      }),
    ).toHaveLength(0);
  });

  it("uses explicit targets_json formula matches only", () => {
    expect(filterOperators(operators, reference, { formulaTypes: ["F_SKILL"] })).toHaveLength(0);
  });
});
