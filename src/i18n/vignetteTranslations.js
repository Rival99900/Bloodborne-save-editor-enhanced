// Generated from audited local checkpoints. Do not use this data for save serialization.
// English strings and catalogue identifiers remain the only values used by backend operations.
const translationLoaders = {
  "fr": () => import("./vignetteTranslations/fr.json"),
  "it": () => import("./vignetteTranslations/it.json"),
  "de": () => import("./vignetteTranslations/de.json"),
  "es": () => import("./vignetteTranslations/es.json"),
  "nl": () => import("./vignetteTranslations/nl.json"),
  "pl": () => import("./vignetteTranslations/pl.json"),
  "ru": () => import("./vignetteTranslations/ru.json"),
  "da": () => import("./vignetteTranslations/da.json"),
  "nb": () => import("./vignetteTranslations/nb.json"),
  "fi": () => import("./vignetteTranslations/fi.json"),
  "sv": () => import("./vignetteTranslations/sv.json"),
  "tr": () => import("./vignetteTranslations/tr.json"),
  "pt-PT": () => import("./vignetteTranslations/pt-PT.json"),
};

const cachedLanguages = new Map();

export async function loadVignetteTranslations(language) {
  const loader = translationLoaders[language];
  if (!loader) return undefined;
  if (!cachedLanguages.has(language)) {
    cachedLanguages.set(language, loader().then((module) => module.default).catch(() => undefined));
  }
  return cachedLanguages.get(language);
}

function normalizeDisplayText(value) {
  // Some generated JSON resources preserved a literal escape before apostrophes
  // and quotes. This is display-only normalization; source keys and save data
  // remain canonical English strings.
  return typeof value === "string" ? value.replace(/\\+(['"`])/g, "$1") : value;
}

export function localizeVignetteText(translations, kind, sourceText) {
  if (!sourceText || !translations) return normalizeDisplayText(sourceText);
  const bucket = kind === "name" ? "names" : "descriptions";
  const values = translations[bucket] ?? {};
  const direct = values[sourceText];

  // Runtime rune cards use names such as "Moon", whereas the same official
  // wording is already present in the catalogue as "[CUT] Moon". Reusing the
  // display value keeps the internal English key intact and avoids duplicating
  // translations across two representations of the same rune name.
  const cutAlias =
    kind === "name" && !direct && !String(sourceText).startsWith("[CUT] ")
      ? values[`[CUT] ${sourceText}`]?.replace(/^\[CUT\]\s*/u, "")
      : undefined;

  const resolved = direct ?? cutAlias ?? sourceText;

  // Translate only explicitly quoted rune names. Replacing every occurrence of
  // a short source name can corrupt an already translated word (e.g. Eye in Eyelid).
  if (kind === "description" && direct) {
    return normalizeDisplayText(resolved).replace(/"([^"\n]+)"/g, (quoted, name) => {
      const target = translations.names?.[name]
        ?? translations.names?.[`[CUT] ${name}`]?.replace(/^\[CUT\]\s*/u, "");
      return target ? `"${normalizeDisplayText(target)}"` : quoted;
    });
  }

  return normalizeDisplayText(resolved);
}
