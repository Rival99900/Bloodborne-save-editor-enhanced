import { SUPPORTED_LANGUAGES, useLocalization } from "../i18n/localization";

function Nav({ save, name, status, onOpenSave, onSaveChanges }) {
  const { language, setLanguage, t } = useLocalization();

  return (
    <nav className="nav" aria-label={t("nav.controls")}>
      <div className="brand-lockup">
        <img className="brand-mark" src="/assets/icon.png" alt="" />
        <div>
          <p className="brand-eyebrow">Bloodborne</p>
          <p className="brand-title">Save Editor</p>
        </div>
      </div>

      <div className="save-summary" aria-live="polite">
        <span className={`save-indicator ${save ? "is-loaded" : ""}`} aria-hidden="true" />
        <div>
          <p className="summary-label">{save ? t("nav.activeSave") : t("nav.noSaveLoaded")}</p>
          <p className="summary-value">{name || t("nav.openFileToBegin")}</p>
          {status ? <p className="summary-status">{status}</p> : null}
        </div>
      </div>

      <div className="nav-actions">
        <label className="language-select">
          <span>{t("language.label")}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {SUPPORTED_LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </label>
        <button className="control-button control-button--quiet" id="openSave" onClick={onOpenSave}>
          {t("nav.openSave")}
        </button>
        <button
          className="control-button control-button--primary"
          disabled={!save}
          onClick={onSaveChanges}
        >
          {t("nav.saveChanges")}
        </button>
      </div>
    </nav>
  );
}

export default Nav;
