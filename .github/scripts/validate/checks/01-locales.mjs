// The 14 locale files: same keys, filled values, same placeholders; every
// static t("…") key of the interface exists; every release summary is translated.
import assert from "node:assert/strict";
import fs from "node:fs";

const placeholders = (value) =>
  [...String(value).matchAll(/\{\{\w+\}\}/g)].map((match) => match[0]).sort();

export default function locales({ languages, flat, sourceFiles, readJson, withLanguage }) {
  const english = flat.en;
  const keys = Object.keys(english).sort();
  for (const code of languages) {
    assert.deepEqual(Object.keys(flat[code]).sort(), keys, `${code}: keys differ from English`);
    for (const key of keys) {
      const value = flat[code][key];
      assert.equal(typeof value, typeof english[key], `${code}: type of ${key}`);
      if (typeof value !== "string") continue;
      if (english[key].trim()) assert(value.trim(), `${code}: empty ${key}`);
      assert.deepEqual(
        placeholders(value),
        placeholders(english[key]),
        `${code}: placeholders of ${key}`,
      );
      assert.doesNotMatch(value, /�|Ã©|â€™/, `${code}: broken encoding in ${key}`);
    }
  }

  // Static keys only; template keys are covered by the feature checks.
  const used = [
    ...new Set(
      sourceFiles("src")
        .filter((file) => !file.includes("/i18n/"))
        .flatMap((file) =>
          [...fs.readFileSync(file, "utf8").matchAll(/\bt\(\s*["'`]([A-Za-z0-9_.]+)["'`]/g)].map(
            (match) => match[1],
          ),
        ),
    ),
  ].sort();
  for (const code of languages) {
    withLanguage(code, (t) => {
      for (const key of used)
        assert.notEqual(t(key, { count: 1 }), key, `${code}: missing string ${key}`);
    });
  }
  withLanguage("en", (t) => assert.equal(t("vignette.cursedPrefix"), "Cursed"));

  const notes = readJson("src/i18n/releaseSummaries.json");
  for (const [version, summary] of Object.entries(notes.versions)) {
    for (const code of languages)
      assert(summary[code]?.trim(), `Release summary ${version}: ${code}`);
  }
  return `${languages.length} languages, ${keys.length} keys, ${used.length} static keys used`;
}
