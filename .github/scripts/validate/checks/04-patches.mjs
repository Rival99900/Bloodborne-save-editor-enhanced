// Bloodborne save patches: every patch has a translated label (from the v0.6.0 checks).
import assert from "node:assert/strict";
import fs from "node:fs";

export default async function patches({ server, React, languages, flat, withLanguage }) {
  const { default: Patches, patchLabel } = await server.ssrLoadModule(
    "/src/pages/patches/Patches.jsx",
  );
  const { SaveContext } = await server.ssrLoadModule("/src/context/context.js");
  const records = [];
  for (const cusa of ["CUSA00207", "CUSA00900"]) {
    const source = fs.readFileSync(`src-tauri/resources/patches/${cusa}.savepatch`, "utf8");
    for (const match of source.matchAll(/^\[(.+)\]\r?\n([\s\S]*?)(?=^\[|$(?![\s\S]))/gm)) {
      const name = match[1];
      if (name.startsWith("INFO:") || name.startsWith("Group:")) continue;
      const kind = name.startsWith("Max ")
        ? "quantity"
        : name.startsWith("Turn Pebble")
          ? "conversion"
          : name.startsWith("Revered ")
            ? "coldblood"
            : name.startsWith("Guidance Rune")
              ? "guidance"
              : name.startsWith("Isz ")
                ? "isz"
                : "weapon";
      const item_name = name
        .replace(/^Max /, "")
        .split(" (Must")[0]
        .split("+10")[0]
        .replaceAll("’", "'");
      records.push({ name, kind, item_name });
    }
  }
  assert(records.length > 100);
  for (const code of languages) {
    const html = withLanguage(
      code,
      null,
      React.createElement(
        SaveContext.Provider,
        { value: { save: {}, setSave: () => {} } },
        React.createElement(Patches),
      ),
    );
    assert(
      !html.includes("patchErrors.") && !html.includes("patches."),
      `${code}: raw key in Patches`,
    );
    const names =
      code === "en"
        ? null
        : JSON.parse(fs.readFileSync(`src/i18n/vignetteTranslations/${code}.json`, "utf8"));
    const t = (key, vars = {}) => {
      assert(flat[code][key], `${code}:${key}`);
      return flat[code][key].replace("{{name}}", vars.name ?? "");
    };
    for (const patch of records) {
      const label = patchLabel(patch, t, names);
      assert(label && !label.includes("undefined"));
      if (names && ["quantity", "weapon", "conversion"].includes(patch.kind)) {
        const name = (
          patch.kind === "conversion"
            ? patch.name.split(" into ")[1].split(" (Must")[0]
            : patch.item_name
        ).replace("Bastard Of Loran", "Bastard of Loran");
        assert(names.names[name], `Missing item translation ${code}: ${name}`);
      }
    }
  }
  return `${records.length} patches labelled in every language`;
}
