import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = process.env.RLS_BUILDING_DATA_DIR ?? "D:\\Code Rep\\arknights\\arknights-building-data\\data";
const outPath = path.join(process.cwd(), "public", "data", "building-reference.json");

const roomLabels = {
  CONTROL: "控制中枢",
  POWER: "发电站",
  MANUFACTURE: "制造站",
  TRADING: "贸易站",
  DORMITORY: "宿舍",
  HIRE: "办公室",
  MEETING: "会客室",
  TRAINING: "训练室",
  WORKSHOP: "加工站",
};

const formulaLabels = {
  F_EXP: "作战记录",
  F_GOLD: "赤金",
  F_ASC: "芯片/双芯片",
  F_DIAMOND: "源石碎片/合成玉",
  F_BUILDING: "基建材料",
  F_EVOLVE: "精英化材料",
  F_SKILL: "技能材料",
};

const formulaOrder = ["F_EXP", "F_GOLD", "F_ASC", "F_DIAMOND", "F_BUILDING", "F_EVOLVE", "F_SKILL"];
const roomOrder = [
  "CONTROL",
  "POWER",
  "MANUFACTURE",
  "TRADING",
  "DORMITORY",
  "HIRE",
  "MEETING",
  "TRAINING",
  "WORKSHOP",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [rawHeaders, ...records] = rows;
  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, ""));
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
  );
}

async function readCsv(fileName) {
  return parseCsv(await readFile(path.join(sourceRoot, fileName), "utf8"));
}

function parseTargets(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((item) => formulaOrder.includes(item));
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => formulaOrder.includes(item)) : [];
  } catch {
    return [];
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function field(row, ...names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return "";
}

const [
  operatorBuffs,
  buffs,
  rooms,
  layoutSlots,
  manufactFormulas,
  workshopFormulas,
  manifest,
] = await Promise.all([
  readCsv("operator_buffs.csv"),
  readCsv("buffs.csv"),
  readCsv("rooms.csv"),
  readCsv("layout_slots.csv"),
  readCsv("manufact_formulas.csv"),
  readCsv("workshop_formulas.csv"),
  readFile(path.join(sourceRoot, "manifest.json"), "utf8").then(JSON.parse),
]);

const canonicalOperatorBuffs = operatorBuffs.map((row) => ({
  ...row,
  operator_id: field(row, "operator_id", "operatorId", "charId"),
  operator_name: field(row, "operator_name", "operatorName", "name"),
  buff_id: field(row, "buff_id", "buffId"),
  buff_name: field(row, "buff_name", "buffName"),
  room_type: field(row, "room_type", "roomType", "room_id", "roomId"),
  condition_phase: field(row, "condition_phase", "conditionPhase"),
  condition_level: field(row, "condition_level", "conditionLevel"),
}));
const canonicalBuffs = buffs.map((buff) => ({
  ...buff,
  buff_id: field(buff, "buff_id", "buffId"),
  buff_name: field(buff, "buff_name", "buffName"),
  room_type: field(buff, "room_type", "roomType", "room_id", "roomId"),
  description_text: field(buff, "description_text", "descriptionText"),
  targets_json: field(buff, "targets_json", "targetsJson", "targets"),
}));
const canonicalRooms = rooms.map((room) => ({
  ...room,
  room_id: field(room, "room_id", "roomId", "id"),
  room_name: field(room, "room_name", "roomName", "name"),
}));
const canonicalManufactFormulas = manufactFormulas.map((row) => ({
  ...row,
  formula_type: field(row, "formula_type", "formulaType"),
  buff_type: field(row, "buff_type", "buffType"),
  item_name: field(row, "item_name", "itemName", "name"),
}));
const canonicalWorkshopFormulas = workshopFormulas.map((row) => ({
  ...row,
  formula_type: field(row, "formula_type", "formulaType"),
  buff_type: field(row, "buff_type", "buffType"),
  item_name: field(row, "item_name", "itemName", "name"),
}));

const roomNameById = new Map(canonicalRooms.map((room) => [room.room_id, room.room_name]));
const skillsById = Object.fromEntries(
  canonicalBuffs.map((buff) => [
    buff.buff_id,
    {
      buffId: buff.buff_id,
      buffName: buff.buff_name,
      roomType: buff.room_type,
      descriptionText: buff.description_text,
      efficiency: Number(buff.efficiency || 0),
      targetFormulaTypes: parseTargets(buff.targets_json),
    },
  ]),
);

const operatorSkills = canonicalOperatorBuffs.map((row) => {
  const skill = skillsById[row.buff_id];

  return {
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    roomType: row.room_type,
    buffId: row.buff_id,
    buffName: row.buff_name,
    descriptionText: skill?.descriptionText ?? "",
    targetFormulaTypes: skill?.targetFormulaTypes ?? [],
    conditionPhase: row.condition_phase,
    conditionLevel: Number(row.condition_level || 0),
  };
});

const roomTypes = roomOrder
  .filter((roomType) => canonicalOperatorBuffs.some((row) => row.room_type === roomType))
  .map((roomType) => ({
    id: roomType,
    label: roomNameById.get(roomType) ?? roomLabels[roomType] ?? roomType,
    sourceRoomId: roomType,
    operatorCount: new Set(
      canonicalOperatorBuffs.filter((row) => row.room_type === roomType).map((row) => row.operator_id),
    ).size,
    skillRowCount: canonicalOperatorBuffs.filter((row) => row.room_type === roomType).length,
  }));

function createFormulaOption(formulaType) {
  const manufacturing = canonicalManufactFormulas.filter((row) => row.formula_type === formulaType);
  const workshop = canonicalWorkshopFormulas.filter((row) => row.formula_type === formulaType);
  return {
    id: formulaType,
    label: formulaLabels[formulaType] ?? formulaType,
    sources: [
      ...(manufacturing.length > 0 ? ["manufacturing"] : []),
      ...(workshop.length > 0 ? ["workshop"] : []),
    ],
    buffTypeIds: unique([...manufacturing, ...workshop].map((row) => row.buff_type)).sort(),
    itemNames: unique([...manufacturing, ...workshop].map((row) => row.item_name)).sort((a, b) =>
      a.localeCompare(b, "zh-Hans-CN"),
    ),
    skillTargetCount: operatorSkills.filter((skill) => skill.targetFormulaTypes.includes(formulaType))
      .length,
  };
}

const productionFormulaTypes = formulaOrder
  .map(createFormulaOption)
  .filter((option) => option.sources.length > 0 || option.skillTargetCount > 0);

const reference = {
  source: {
    localSourcePath: sourceRoot,
    upstreamRepository: manifest.repository,
    upstreamCommit: manifest.commit,
    generatedAt: new Date().toISOString(),
    rowCounts: {
      operator_buffs: operatorBuffs.length,
      buffs: buffs.length,
      rooms: rooms.length,
      layout_slots: layoutSlots.length,
      manufact_formulas: manufactFormulas.length,
      workshop_formulas: workshopFormulas.length,
    },
  },
  roomTypes,
  productionFormulaTypes,
  operatorSkills,
  skillsById,
};

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(reference, null, 2)}\n`, "utf8");

console.log(
  `Generated building reference: ${operatorSkills.length} operator skill rows, ${Object.keys(skillsById).length} skills.`,
);
