import type { BuildingReference, Operator, OperatorBuildingSkill } from "./types";

export function getOperatorSkills(
  reference: BuildingReference | null,
  operator: Operator,
): OperatorBuildingSkill[] {
  if (!reference) {
    return [];
  }

  return reference.operatorSkills.filter(
    (skill) =>
      skill.operatorId === operator.id ||
      skill.operatorName === operator.name ||
      operator.aliases.includes(skill.operatorName),
  );
}

export function createSkillNameIndex(reference: BuildingReference | null): Map<string, OperatorBuildingSkill[]> {
  const index = new Map<string, OperatorBuildingSkill[]>();

  if (!reference) {
    return index;
  }

  for (const skill of reference.operatorSkills) {
    const existing = index.get(skill.operatorName) ?? [];
    existing.push(skill);
    index.set(skill.operatorName, existing);
  }

  return index;
}
