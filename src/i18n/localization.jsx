import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import nl from "./locales/nl.json";
import pl from "./locales/pl.json";
import ru from "./locales/ru.json";
import da from "./locales/da.json";
import nb from "./locales/nb.json";
import fi from "./locales/fi.json";
import sv from "./locales/sv.json";
import tr from "./locales/tr.json";
import ptPT from "./locales/pt-PT.json";

// One file per language in ./locales (nested keys). New strings go into every
// file; `npm run validate` checks that the 14 files have the same keys and
// placeholders. English is the fallback for a missing key.
const LANGUAGE_STORAGE_KEY = "bloodborne-save-editor.language.v1";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español (España)" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "ru", label: "Русский" },
  { code: "da", label: "Dansk" },
  { code: "nb", label: "Norsk bokmål" },
  { code: "fi", label: "Suomi" },
  { code: "sv", label: "Svenska" },
  { code: "tr", label: "Türkçe" },
  { code: "pt-PT", label: "Português (Portugal)" },
];

const resources = { en, fr, it, de, es, nl, pl, ru, da, nb, fi, sv, tr, "pt-PT": ptPT };

const LocalizationContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

function readStoredLanguage() {
  try {
    const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.some(({ code }) => code === stored) ? stored : "en";
  } catch {
    return "en";
  }
}

function readKey(source, key) {
  return key.split(".").reduce((value, segment) => value?.[segment], source);
}

function interpolate(value, values) {
  return String(value).replace(/{{(\w+)}}/g, (_, name) => String(values[name] ?? ""));
}

export function LocalizationProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  const setLanguage = (nextLanguage) => {
    const languageExists = SUPPORTED_LANGUAGES.some(({ code }) => code === nextLanguage);
    setLanguageState(languageExists ? nextLanguage : "en");
  };

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The interface remains usable if persistent storage is unavailable.
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t(key, values = {}) {
        const translated = readKey(resources[language], key);
        const fallback = readKey(resources.en, key);
        return interpolate(translated ?? fallback ?? key, values);
      },
    }),
    [language],
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  return useContext(LocalizationContext);
}

export function getSupportedLanguageLabel(code) {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? code;
}
