import SaveDiffTable from "./SaveDiffTable";
import useDialogFocus from "../utils/useDialogFocus";
import { useLocalization } from "../i18n/localization";

function formatTime(timestamp, language) {
  try {
    return new Intl.DateTimeFormat(language, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

function RevisionPanel({ entries, diff, summary = [], onClose, onUndo, onRedo, canUndo, canRedo }) {
  const { language, t } = useLocalization();
  const panelRef = useDialogFocus(onClose);

  return (
    <div className="revision-panel" role="dialog" aria-modal="true" aria-labelledby="revision-title" ref={panelRef}>
      <section className="revision-panel__card">
        <div className="revision-panel__header">
          <div>
            <span className="revision-panel__eyebrow">{t("revision.eyebrow")}</span>
            <h2 id="revision-title">{t("revision.title")}</h2>
          </div>
          <button className="revision-panel__close" type="button" onClick={onClose} aria-label={t("revision.close")}>×</button>
        </div>
        <p className="revision-panel__description">{t("revision.description")}</p>
        <div className="revision-panel__actions">
          <button type="button" onClick={onUndo} disabled={!canUndo}>{t("revision.undo")}</button>
          <button type="button" onClick={onRedo} disabled={!canRedo}>{t("revision.redo")}</button>
        </div>
        <div className="revision-panel__content">
          <details className="revision-diff" open><summary>{t("diff.details")}</summary><SaveDiffTable diff={diff}/></details>
          {summary.length ? (
            <section className="revision-panel__summary" aria-labelledby="revision-summary-title">
              <h3 id="revision-summary-title">{t("revision.summaryTitle")}</h3>
              <ul>
                {summary.map((entry) => (
                  <li key={entry.key}>{t(entry.key, { count: entry.count })}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {entries.length ? (
            <ol className="revision-panel__list">
              {[...entries].reverse().map((entry) => (
                <li key={entry.id}>
                  <span className="revision-panel__time">{formatTime(entry.timestamp, language)}</span>
                  <div className="revision-entry__body"><span>{entry.labelKey ? t(entry.labelKey) : entry.label}</span></div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="revision-panel__empty">{t("revision.empty")}</p>
          )}
        </div>
        <p className="revision-panel__notice">{t("revision.notice")}</p>
      </section>
    </div>
  );
}

export default RevisionPanel;
