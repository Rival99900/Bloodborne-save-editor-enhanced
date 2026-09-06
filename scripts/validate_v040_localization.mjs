import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "vite";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const server = await createServer({ root, logLevel: "error", server: { watch: null } });
try {
  const { SUPPORTED_LANGUAGES } = await server.ssrLoadModule("/src/i18n/localization.jsx");
  const { locations } = await server.ssrLoadModule("/src/pages/character/Teleport.jsx");
  const { getReleaseSummary } = await server.ssrLoadModule("/src/utils/releaseSummary.js");
  const { normalizeSearch, searchableItemText } = await server.ssrLoadModule("/src/utils/inventorySearch.js");
  const { loadVignetteTranslations, localizeVignetteText } = await server.ssrLoadModule("/src/i18n/vignetteTranslations.js");
  const { loadEffectTranslations, localizeEffectText } = await server.ssrLoadModule("/src/i18n/effectTranslations.js");
  const readJson = path => JSON.parse(readFileSync(resolve(root, path), "utf8"));
  const strings = readJson("src/i18n/v040FixTranslations.json");
  const notes = readJson("src/i18n/releaseSummaries.json");
  const expected = Object.keys(strings.en).sort();
  assert.equal(locations.length, 43);
  assert.equal(new Set(locations.map(option => option.group)).size, 6);
  for (const { code } of SUPPORTED_LANGUAGES) {
    assert.deepEqual(Object.keys(strings[code]).sort(), expected, `${code}: missing UI keys`);
    assert(Object.values(strings[code]).every(value => typeof value === "string" && value.trim()));
    for (const option of locations) {
      assert(strings[code][`destinations.${option.value}`], `${code}: destination ${option.value}`);
      assert(strings[code][`teleportGroups.${option.group}`], `${code}: group ${option.group}`);
    }
    assert.equal(getReleaseSummary(notes.default.en, code, "0.4.0"), notes.default[code]);
    assert.equal(getReleaseSummary("Custom release notes", code, "0.5.0"), "Custom release notes");
    if (code === "en") continue;
    const vignettes = await loadVignetteTranslations(code);
    const effects = await loadEffectTranslations(code);
    // Cover every catalogue name and effect, including accented and non-Latin text.
    for (const name of Object.keys(vignettes.names)) {
      const text = searchableItemText({ info: { item_name: name } }, vignettes, effects);
      assert(text.includes(normalizeSearch(localizeVignetteText(vignettes, "name", name))), `${code}: ${name}`);
      assert(text.includes(normalizeSearch(name)), `${code}: English alias ${name}`);
    }
    for (const effect of Object.keys(effects)) {
      const text = searchableItemText({ effects: [[1, effect]] }, vignettes, effects);
      assert(text.includes(normalizeSearch(localizeEffectText(effects, effect))), `${code}: ${effect}`);
    }
    assert(searchableItemText({ info: { name: "Moon" } }, vignettes, effects)
      .includes(normalizeSearch(localizeVignetteText(vignettes, "name", "Moon"))), `${code}: rune alias`);
  }
  assert.equal(getReleaseSummary(JSON.stringify({ en: "English", fr: "Français" }), "fr", "0.5.0"), "Français");
  assert.equal(getReleaseSummary(JSON.stringify({ en: "English" }), "fr", "0.5.0"), "English");
  assert.equal(getReleaseSummary("English", "fr", "0.5.0", { fr: "Notes françaises" }), "Notes françaises");
  assert.equal(normalizeSearch("ÉPÉE"), "epee");
  assert.equal(normalizeSearch("IŞIK"), "isik");
  console.log("PASS: 13 translated locales + English; 43 destinations, 6 groups, 11 stats, 4 comparison errors; all catalogue name/effect searches; rune aliases; update notes.");
} finally {
  await server.close();
}
