import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = process.env.RLS_AVATARS_DIR ?? "D:\\Code Rep\\arknights\\avatars";
const metadataPath = path.join(sourceRoot, "operators.json");
const portraitsPath = path.join(sourceRoot, "avatars");
const professionIconsPath = path.join(sourceRoot, "profession");
const rarityIconsPath = path.join(sourceRoot, "rarity");
const outPortraitsPath = path.join(process.cwd(), "public", "operators", "portraits");
const outProfessionIconsPath = path.join(process.cwd(), "public", "operators", "profession");
const outRarityIconsPath = path.join(process.cwd(), "public", "operators", "rarity");
const outManifestPath = path.join(process.cwd(), "public", "operators", "manifest.json");

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
const files = (await readdir(portraitsPath)).filter((file) => file.toLowerCase().endsWith(".png"));
const professionIconFiles = (await readdir(professionIconsPath)).filter((file) =>
  file.toLowerCase().endsWith(".png"),
);
const rarityIconFiles = (await readdir(rarityIconsPath)).filter((file) =>
  file.toLowerCase().endsWith(".png"),
);
const warnings = [];
const filesByCode = new Map();
const filesByName = new Map();
const professionIconByName = new Map();
const rarityIconByValue = new Map();

for (const file of files) {
  const stem = file.replace(/\.png$/i, "");
  const separator = stem.indexOf("_");
  const code = separator >= 0 ? stem.slice(0, separator) : stem;
  const name = separator >= 0 ? stem.slice(separator + 1) : stem;

  filesByCode.set(code, file);
  filesByName.set(name, file);
}

for (const file of professionIconFiles) {
  const stem = file.replace(/\.png$/i, "");
  const professionName = stem.slice(stem.lastIndexOf("_") + 1);
  professionIconByName.set(professionName, file);
}

for (const file of rarityIconFiles) {
  const match = file.match(/_(\d+)\.png$/i);
  if (match) {
    rarityIconByValue.set(Number(match[1]), file);
  }
}

const seenIds = new Set();
const operators = metadata
  .map((row) => {
    const portraitFile = filesByCode.get(row.id) ?? filesByName.get(row.zh);
    const professionIconFile = professionIconByName.get(row.profession);
    const rarityIconFile = rarityIconByValue.get(row.rarity);
    const fallbackStem = normalize(row.zh ?? row.en ?? row.id);
    const baseId = normalize(row.id ?? fallbackStem);
    const id = baseId;

    if (seenIds.has(baseId)) {
      warnings.push(`Duplicate operator id: ${baseId}; skipped metadata row ${row.zh ?? fallbackStem}`);
      return null;
    }
    seenIds.add(id);

    if (!portraitFile) {
      warnings.push(`Missing portrait for metadata row: ${row.zh ?? id}`);
    }

    if (row.profession && !professionIconFile) {
      warnings.push(`Missing profession icon for ${row.zh ?? id}: ${row.profession}`);
    }

    if (typeof row.rarity === "number" && !rarityIconFile) {
      warnings.push(`Missing rarity icon for ${row.zh ?? id}: ${row.rarity}`);
    }

    const stem = portraitFile?.replace(/\.png$/i, "") ?? fallbackStem;

    return {
      id,
      name: row.zh ?? row.en ?? id,
      portraitPath: portraitFile ? `/operators/portraits/${portraitFile}` : "",
      professionIconPath: professionIconFile ? `/operators/profession/${professionIconFile}` : "",
      rarityIconPath: rarityIconFile ? `/operators/rarity/${rarityIconFile}` : "",
      aliases: unique([row.zh, row.en, row.ja, row.id, stem]),
      tags: unique([...(Array.isArray(row.tags) ? row.tags : []), row.position, row.profession]),
      profession: row.profession,
      subProfession: row.sub_profession,
      rarity: row.rarity,
      source: "avatars",
      sortKey: portraitFile ?? row.zh ?? id,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.sortKey.localeCompare(b.sortKey, "zh-Hans-CN"))
  .map(({ sortKey: _sortKey, ...operator }) => operator);

const operatorNames = new Set(metadata.map((row) => row.zh));
for (const file of files) {
  const stem = file.replace(/\.png$/i, "");
  const name = stem.includes("_") ? stem.slice(stem.indexOf("_") + 1) : stem;
  if (!operatorNames.has(name)) {
    warnings.push(`Portrait without metadata: ${file}`);
  }
}

await mkdir(outPortraitsPath, { recursive: true });
await mkdir(outProfessionIconsPath, { recursive: true });
await mkdir(outRarityIconsPath, { recursive: true });
await mkdir(path.dirname(outManifestPath), { recursive: true });

for (const file of files) {
  await copyFile(path.join(portraitsPath, file), path.join(outPortraitsPath, file));
}

for (const file of professionIconFiles) {
  await copyFile(path.join(professionIconsPath, file), path.join(outProfessionIconsPath, file));
}

for (const file of rarityIconFiles) {
  await copyFile(path.join(rarityIconsPath, file), path.join(outRarityIconsPath, file));
}

const manifest = {
  source: {
    localSourcePath: sourceRoot,
    generatedAt: new Date().toISOString(),
    metadataRows: metadata.length,
    portraitFiles: files.length,
    professionIconFiles: professionIconFiles.length,
    rarityIconFiles: rarityIconFiles.length,
    warnings,
  },
  operators,
};

await writeFile(outManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Generated ${operators.length} operators and copied ${files.length} portraits.`);
if (warnings.length > 0) {
  console.warn(warnings.join("\n"));
}
