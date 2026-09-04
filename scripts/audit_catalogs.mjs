import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { v040Translations, v040TranslationKeys } from "../src/i18n/v040Translations.js";
import { BOSS_NAME_KEYS, BOSS_PROGRESSION } from "../src/pages/bosses/bossProgression.js";

const root = resolve(import.meta.dirname, "..");
const resource = (name) => JSON.parse(readFileSync(resolve(root, "src-tauri/resources", name), "utf8"));
const translation = (kind, language) =>
  JSON.parse(readFileSync(resolve(root, "src/i18n", kind, `${language}.json`), "utf8"));

const languages = ["fr", "it", "de", "es", "nl", "pl", "ru", "da", "nb", "fi", "sv", "tr", "pt-PT"];
const items = resource("items.json");
const weapons = resource("weapons.json");
const armors = resource("armors.json");
const upgrades = resource("upgrades.json");
const bossSchema = resource("bosses.json");
const officialUiOverrides = JSON.parse(
  readFileSync(resolve(root, "src/i18n/officialUiOverrides.json"), "utf8"),
);

const catalogGroups = {
  consumables: Object.values(items.consumable),
  materials: Object.values(items.material),
  keys: Object.values(items.key),
  chalices: Object.values(items.chalice),
  rightHandWeapons: Object.values(weapons.rightHand),
  leftHandWeapons: Object.values(weapons.leftHand),
  armor: Object.values(armors),
};

const uniqueStrings = (values) =>
  [...new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0))];

const names = uniqueStrings(Object.values(catalogGroups).flatMap((entries) => entries.map((entry) => entry.item_name)));
const descriptions = uniqueStrings(
  Object.values(catalogGroups).flatMap((entries) => entries.map((entry) => entry.item_desc)),
);
const effectEntries = [...Object.values(upgrades.gemEffects), ...Object.values(upgrades.runeEffects)];
const effectStrings = uniqueStrings(effectEntries.flatMap(({ name, effect, note }) => [name, effect, note]));
const requiredNpcUiKeys = [
  "sidebar.npcs", "sidebar.npcsDescription", "npcs.eyebrow", "npcs.title", "npcs.lead",
  "npcs.automaticNote", "npcs.unverifiedNote", "npcs.unverified", "npcs.labEyebrow",
  "npcs.labTitle", "npcs.labLead", "npcs.beforeReference", "npcs.afterReference",
  "npcs.chooseSave", "npcs.compare", "npcs.comparing", "npcs.compareFailed",
  "npcs.noDifference", "npcs.candidateCount", "npcs.candidates",
];

const missingByLanguage = [];
for (const language of languages) {
  const vignette = translation("vignetteTranslations", language);
  const effects = translation("effectTranslations", language).effects;
  const missingNames = names.filter((value) => !(value in (vignette.names ?? {})));
  const missingDescriptions = descriptions.filter((value) => !(value in (vignette.descriptions ?? {})));
  const missingEffects = effectStrings.filter((value) => !(value in (effects ?? {})));
  const missingNpcUi = requiredNpcUiKeys.filter((key) => !(key in (officialUiOverrides[language] ?? {})));
  const missingV040Ui = v040TranslationKeys.filter((key) => {
    const value = v040Translations[language]?.[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
  missingByLanguage.push({ language, missingNames, missingDescriptions, missingEffects, missingNpcUi, missingV040Ui });
}

const contextSource = readFileSync(resolve(root, "src/context/itemsContext.jsx"), "utf8");
const presetEffectPattern = /\[\s*(\d+)\s*,\s*(["'])(.*?)\2\s*\]/g;
const knownEffects = new Map(
  [...Object.entries(upgrades.gemEffects), ...Object.entries(upgrades.runeEffects)].map(([id, entry]) => [id, entry.effect]),
);
const presetMismatches = [];
for (const match of contextSource.matchAll(presetEffectPattern)) {
  const [, id, , label] = match;
  if (id === "4294967295" || !knownEffects.has(id)) continue;
  if (knownEffects.get(id) !== label) {
    presetMismatches.push({ id, preset: label, catalog: knownEffects.get(id) });
  }
}

const untranslatedCounts = languages.map((language) => {
  const vignette = translation("vignetteTranslations", language);
  const effects = translation("effectTranslations", language).effects;
  return {
    language,
    names: names.filter((value) => vignette.names?.[value] === value).length,
    descriptions: descriptions.filter((value) => vignette.descriptions?.[value] === value).length,
    effects: effectStrings.filter((value) => effects?.[value] === value).length,
  };
});

console.log("Catalog coverage (unique canonical strings)");
for (const [group, entries] of Object.entries(catalogGroups)) {
  console.log(`- ${group}: ${entries.length} entries`);
}
console.log(`- names: ${names.length}`);
console.log(`- descriptions: ${descriptions.length}`);
console.log(`- gem/rune text: ${effectStrings.length}`);
console.log(`- chalices without a canonical source description: ${catalogGroups.chalices.filter((entry) => !entry.item_desc?.trim()).length}`);
console.log("");
console.log("Missing translation keys");
for (const result of missingByLanguage) {
  console.log(
    `- ${result.language}: names=${result.missingNames.length}, descriptions=${result.missingDescriptions.length}, effects=${result.missingEffects.length}, npcUi=${result.missingNpcUi.length}, v040Ui=${result.missingV040Ui.length}`,
  );
}
console.log("");
console.log("Entries intentionally or provisionally identical to English");
for (const result of untranslatedCounts) {
  console.log(
    `- ${result.language}: names=${result.names}, descriptions=${result.descriptions}, effects=${result.effects}`,
  );
}
console.log("");
console.log(`Preset effect mismatches: ${presetMismatches.length}`);
for (const mismatch of presetMismatches) {
  console.log(`- ${mismatch.id}: preset="${mismatch.preset}"; catalog="${mismatch.catalog}"`);
}

const progressionBossNames = BOSS_PROGRESSION.flatMap((phase) => phase.bosses.map((boss) => boss.name));
const duplicatedProgressionBosses = progressionBossNames.filter(
  (name, index) => progressionBossNames.indexOf(name) !== index,
);
const unmappedProgressionBosses = progressionBossNames.filter((name) => !(name in BOSS_NAME_KEYS));
const schemaBossNames = bossSchema.map((boss) => boss.name);
const missingFromProgression = schemaBossNames.filter((name) => !progressionBossNames.includes(name));
const unknownProgressionBosses = progressionBossNames.filter((name) => !schemaBossNames.includes(name));
console.log(`Boss progression entries: ${progressionBossNames.length}`);
console.log(`Duplicated boss entries: ${duplicatedProgressionBosses.length}`);
console.log(`Unmapped boss names: ${unmappedProgressionBosses.length}`);
console.log(`Boss schema entries missing from timeline: ${missingFromProgression.length}`);
console.log(`Timeline entries missing from boss schema: ${unknownProgressionBosses.length}`);

const missingCount = missingByLanguage.reduce(
  (total, result) =>
    total + result.missingNames.length + result.missingDescriptions.length + result.missingEffects.length + result.missingNpcUi.length + result.missingV040Ui.length,
  0,
);
if (
  missingCount > 0 ||
  presetMismatches.length > 0 ||
  duplicatedProgressionBosses.length > 0 ||
  unmappedProgressionBosses.length > 0 ||
  missingFromProgression.length > 0 ||
  unknownProgressionBosses.length > 0
) process.exitCode = 1;
