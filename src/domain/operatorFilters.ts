import type {
  BuildingReference,
  BuildingRoomTypeId,
  Operator,
  OperatorBuildingSkill,
  ProductionFormulaTypeId,
} from "./types";

export interface OperatorFilterState {
  text: string;
  roomTypes: BuildingRoomTypeId[];
  formulaTypes: ProductionFormulaTypeId[];
  assignedOnly: boolean;
}

export interface FilteredOperator extends Operator {
  buildingSkills: OperatorBuildingSkill[];
}

const emptyFilters: OperatorFilterState = {
  text: "",
  roomTypes: [],
  formulaTypes: [],
  assignedOnly: false,
};

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function skillMatchesOperator(skill: OperatorBuildingSkill, operator: Operator): boolean {
  return (
    skill.operatorId === operator.id ||
    skill.operatorName === operator.name ||
    operator.aliases.some((alias) => alias === skill.operatorName)
  );
}

export function getOperatorSkillList(
  operator: Operator,
  reference: BuildingReference | null,
): OperatorBuildingSkill[] {
  if (!reference) {
    return [];
  }

  return reference.operatorSkills.filter((skill) => skillMatchesOperator(skill, operator));
}

export function filterOperators(
  operators: Operator[],
  reference: BuildingReference | null,
  filters: Partial<OperatorFilterState>,
  assignedOperatorIds: Set<string> = new Set(),
): FilteredOperator[] {
  const state = { ...emptyFilters, ...filters };
  const text = normalizeText(state.text);

  return operators
    .map((operator) => ({
      ...operator,
      buildingSkills: getOperatorSkillList(operator, reference),
    }))
    .filter((operator) => {
      if (state.assignedOnly && !assignedOperatorIds.has(operator.id)) {
        return false;
      }

      if (text) {
        const haystack = [operator.name, operator.id, ...operator.aliases]
          .join(" ")
          .toLocaleLowerCase();
        if (!haystack.includes(text)) {
          return false;
        }
      }

      if (state.roomTypes.length > 0) {
        const hasRoom = operator.buildingSkills.some((skill) =>
          state.roomTypes.includes(skill.roomType),
        );
        if (!hasRoom) {
          return false;
        }
      }

      if (state.formulaTypes.length > 0) {
        const hasFormula = operator.buildingSkills.some((skill) =>
          skill.targetFormulaTypes.some((formulaType) => state.formulaTypes.includes(formulaType)),
        );
        if (!hasFormula) {
          return false;
        }
      }

      return true;
    });
}
