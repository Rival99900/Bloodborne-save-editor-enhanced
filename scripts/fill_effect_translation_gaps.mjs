import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rules = {
  nl: [
    ["Bolt ATK UP ", "Bliksem ATK omhoog "],
    ["ATK vs kin UP ", "ATK tegen verwanten omhoog "],
    ["ATK UP ", "ATK omhoog "],
  ],
  da: [["ATK DOWN ", "ATK NED "]],
  fi: [["ATK DOWN ", "ATK ALAS "]],
};

for (const [language, replacements] of Object.entries(rules)) {
  const path = resolve(root, "src/i18n/effectTranslations", `${language}.json`);
  const document = JSON.parse(readFileSync(path, "utf8"));
  let changed = 0;

  for (const [source, target] of Object.entries(document.effects ?? {})) {
    if (source !== target) continue;
    const rule = replacements.find(([prefix]) => source.startsWith(prefix));
    if (!rule) continue;
    const [prefix, translatedPrefix] = rule;
    document.effects[source] = `${translatedPrefix}${source.slice(prefix.length)}`;
    changed += 1;
  }

  writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  console.log(`${language}: completed ${changed} previously English effect labels`);
}
