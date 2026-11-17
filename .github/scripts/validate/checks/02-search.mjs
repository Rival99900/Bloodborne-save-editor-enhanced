// Catalogue search and translated names/effects (from the v0.4.0 checks).
import assert from "node:assert/strict";

export default async function search({ server, languages, readJson }) {
  const { locations } = await server.ssrLoadModule("/src/pages/character/Teleport.jsx");
  const { getReleaseSummary } = await server.ssrLoadModule("/src/utils/releaseSummary.js");
  const { normalizeSearch, searchableItemText } = await server.ssrLoadModule(
    "/src/utils/inventorySearch.js",
  );
  const { loadVignetteTranslations, localizeVignetteText } = await server.ssrLoadModule(
    "/src/i18n/vignetteTranslations.js",
  );
  const { loadEffectTranslations, localizeEffectText } = await server.ssrLoadModule(
    "/src/i18n/effectTranslations.js",
  );
  // Short rune aliases must never alter a word in an already translated sentence.
  const fixture = {
    names: { Eye: "Œil", "[CUT] Moon": "[CUT] Lune" },
    descriptions: { example: 'Eyelid "Eye" / "Moon"' },
  };
  assert.equal(localizeVignetteText(fixture, "description", "example"), 'Eyelid "Œil" / "Lune"');
  assert.equal(localizeVignetteText(fixture, "name", "Moon"), "Lune");
  assert.equal(localizeVignetteText(fixture, "description", "Unknown"), "Unknown");
  const notes = readJson("src/i18n/releaseSummaries.json");
  assert.equal(locations.length, 43);
  assert.equal(new Set(locations.map((option) => option.group)).size, 6);
  for (const code of languages) {
    assert.equal(getReleaseSummary(notes.default.en, code, "0.4.0"), notes.default[code]);
    assert.equal(getReleaseSummary("Custom release notes", code, "0.5.0"), "Custom release notes");
    if (code === "en") continue;
    const vignettes = await loadVignetteTranslations(code);
    const effects = await loadEffectTranslations(code);
    for (const name of Object.keys(vignettes.names)) {
      const text = searchableItemText({ info: { item_name: name } }, vignettes, effects);
      assert(
        text.includes(normalizeSearch(localizeVignetteText(vignettes, "name", name))),
        `${code}: ${name}`,
      );
      assert(text.includes(normalizeSearch(name)), `${code}: English alias ${name}`);
    }
    for (const effect of Object.keys(effects)) {
      const text = searchableItemText({ effects: [[1, effect]] }, vignettes, effects);
      assert(
        text.includes(normalizeSearch(localizeEffectText(effects, effect))),
        `${code}: ${effect}`,
      );
    }
    assert(
      searchableItemText({ info: { name: "Moon" } }, vignettes, effects).includes(
        normalizeSearch(localizeVignetteText(vignettes, "name", "Moon")),
      ),
      `${code}: rune alias`,
    );
  }
  assert.equal(
    getReleaseSummary(JSON.stringify({ en: "English", fr: "Français" }), "fr", "0.5.0"),
    "Français",
  );
  assert.equal(getReleaseSummary(JSON.stringify({ en: "English" }), "fr", "0.5.0"), "English");
  assert.equal(
    getReleaseSummary("English", "fr", "0.5.0", { fr: "Notes françaises" }),
    "Notes françaises",
  );
  assert.equal(normalizeSearch("ÉPÉE"), "epee");
  assert.equal(normalizeSearch("IŞIK"), "isik");
  return "43 destinations, catalogue names and effects searchable in every language";
}
