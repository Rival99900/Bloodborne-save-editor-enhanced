// Generated display translations. English effect strings and IDs remain canonical for save operations.
const translationLoaders = {
  fr: () => import("./effectTranslations/fr.json"),
  it: () => import("./effectTranslations/it.json"),
  de: () => import("./effectTranslations/de.json"),
  es: () => import("./effectTranslations/es.json"),
  nl: () => import("./effectTranslations/nl.json"),
  pl: () => import("./effectTranslations/pl.json"),
  ru: () => import("./effectTranslations/ru.json"),
  da: () => import("./effectTranslations/da.json"),
  nb: () => import("./effectTranslations/nb.json"),
  fi: () => import("./effectTranslations/fi.json"),
  sv: () => import("./effectTranslations/sv.json"),
  tr: () => import("./effectTranslations/tr.json"),
  "pt-PT": () => import("./effectTranslations/pt-PT.json"),
};

const cache = new Map();

export async function loadEffectTranslations(language) {
  const loader = translationLoaders[language];
  if (!loader) return undefined;
  if (!cache.has(language)) {
    cache.set(language, loader().then((module) => module.default?.effects ?? {}).catch(() => undefined));
  }
  return cache.get(language);
}

// Translation data occasionally contains a duplicated or contradictory sign such as
// `++18.8%` or `+-10`. This is presentation-only normalization: canonical effect
// IDs and the source strings persisted in a save are never changed.
export function normalizeEffectDisplaySigns(text) {
  if (typeof text !== "string") return text;
  return text.replace(/[+-]\s*[+-](?=\s*(?:\d|[.,]\d))/g, (match) => match.trim().at(-1));
}

export function localizeEffectText(translations, sourceText) {
  if (!sourceText || !translations) return normalizeEffectDisplaySigns(sourceText);
  return normalizeEffectDisplaySigns(translations[sourceText] ?? sourceText);
}
