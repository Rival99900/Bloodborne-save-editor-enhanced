import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const appearance = readFileSync(resolve(root, "src/pages/character/Appearance.jsx"), "utf8");
const character = readFileSync(resolve(root, "src/pages/character/Character.jsx"), "utf8");

const requiredAppearanceFragments = [
  "function Appearance({ onNotice })",
  "onNotice(nextNotice);",
  'invoke("import_appearance", { path })',
  "if (!updatedSave) return;",
  'showNotice({ tone: "success", title: t("characterForm.faceImported") });',
  'showNotice({ tone: "error", title: t("characterForm.faceActionFailed") });',
  "{!onNotice && notice ? (",
];

for (const fragment of requiredAppearanceFragments) {
  if (!appearance.includes(fragment)) {
    throw new Error(`Missing protected face-import notification fragment: ${fragment}`);
  }
}

const importIndex = appearance.indexOf('invoke("import_appearance", { path })');
const successIndex = appearance.indexOf('showNotice({ tone: "success", title: t("characterForm.faceImported") });');
if (successIndex <= importIndex) {
  throw new Error("The face-import success notification must run only after the import command resolves.");
}

if (!character.includes("<Appearance onNotice={setNotice} />")) {
  throw new Error("Character must own face-import notifications so save resynchronization cannot discard them.");
}

console.log("PASS: face-import success and error notifications are protected from remount regressions.");
