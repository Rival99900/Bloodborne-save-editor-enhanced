import { useLocalization } from "../i18n/localization";
import LanguagePicker from "./LanguagePicker";

function Nav({
  save,
  name,
  statusKey,
  revisionCount,
  onOpenSave,
  onSaveChanges,
  onShowRevisions,
}) {
  const { t } = useLocalization();

  return (
    <nav className="nav" aria-label={t("nav.controls")}>
      <div className="brand-lockup">
        <img className="brand-mark" src="/assets/icon.png" alt="" />
        <div>
          <p className="brand-eyebrow">Bloodborne</p>
          <p className="brand-title">Save Editor <span className="brand-version">v0.4.0</span></p>
        </div>
      </div>

      <div className="save-summary" aria-live="polite">
        <span className={`save-indicator ${save ? "is-loaded" : ""}`} aria-hidden="true" />
        <div>
          <p className="summary-label">{save ? t("nav.activeSave") : t("nav.noSaveLoaded")}</p>
          <p className="summary-value">{name || t("nav.openFileToBegin")}</p>
          {statusKey ? <p className="summary-status">{t(statusKey)}</p> : null}
        </div>
      </div>

      <div className="nav-actions">
        <LanguagePicker />
        {save ? (
          <div className="nav-history" aria-label={t("revision.controls")}>
            <button className="control-button control-button--history" type="button" onClick={onShowRevisions}>
              {t("revision.changes", { count: revisionCount })}
            </button>
          </div>
        ) : null}
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
