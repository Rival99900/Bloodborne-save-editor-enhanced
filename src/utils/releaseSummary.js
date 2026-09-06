import summaries from "../i18n/releaseSummaries.json";

const legacySummary = "See the GitHub release for improvements and safe-save guidance.";

// A feed may send either plain release notes or a JSON string of localized notes.
// Version overrides and the default sentence are editable in releaseSummaries.json.
export function getReleaseSummary(body, language, version, localizedNotes) {
  if (localizedNotes && typeof localizedNotes[language] === "string" && localizedNotes[language].trim()) {
    return localizedNotes[language];
  }
  const configured = summaries.versions[String(version).replace(/^v/, "")] ?? summaries.default;
  if (typeof body === "string" && body.trim() && body.trim() !== legacySummary) {
    try {
      const localized = JSON.parse(body);
      if (localized && typeof localized === "object" && !Array.isArray(localized)) {
        if (typeof localized[language] === "string") return localized[language];
        if (typeof localized.en === "string") return localized.en;
      }
      return body;
    } catch {
      // Existing feeds use plain text, which remains readable unchanged.
      return body;
    }
  }
  return configured[language] ?? configured.en ?? summaries.default.en;
}
