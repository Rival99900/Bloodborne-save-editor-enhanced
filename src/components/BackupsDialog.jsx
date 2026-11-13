import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLocalization } from "../i18n/localization";
import useDialogFocus from "../utils/useDialogFocus";

// F9: timestamped copies kept next to the open save, with restoration.
function BackupsDialog({ path, dirty, onRestored, onClose }) {
  const { t, language } = useLocalization();
  const panelRef = useDialogFocus(onClose);
  const [entries, setEntries] = useState(null);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    invoke("list_backups", { path })
      .then((list) => { if (active) setEntries(list); })
      .catch(() => { if (active) { setEntries([]); setError(t("backups.listFailed")); } });
    return () => { active = false; };
  }, [path, t]);

  const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "medium" });
  const sizeFormat = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });

  async function restore(entry) {
    setBusy(true); setError("");
    try {
      await invoke("restore_backup", { path, backup: entry.path });
      await onRestored(path);
    } catch (restoreError) {
      console.error("Unable to restore the backup.", restoreError);
      setError(t("backups.restoreFailed"));
      setBusy(false);
    }
  }

  return (
    <div className="bulk-backdrop">
      <div ref={panelRef} className="bulk-dialog tool-dialog" role="dialog" aria-modal="true" aria-labelledby="backups-title">
        <header className="bulk-dialog__header">
          <div>
            <p className="bulk-dialog__eyebrow">{t("backups.eyebrow")}</p>
            <h2 id="backups-title">{t("backups.title")}</h2>
          </div>
          <button type="button" className="control-button control-button--quiet" onClick={onClose}>{t("saveFlow.close")}</button>
        </header>
        <p className="tool-dialog__lead">{t("backups.description")}</p>
        {dirty ? <p className="tool-dialog__warning">{t("backups.dirtyWarning")}</p> : null}
        <div className="bulk-dialog__list tool-dialog__list" role="list">
          {entries === null ? <p className="inventory-empty">{t("backups.loading")}</p> : null}
          {entries?.length === 0 ? <p className="inventory-empty">{t("backups.empty")}</p> : null}
          {entries?.map((entry) => (
            <div key={entry.path} className="tool-row" role="listitem">
              <span>{dateFormat.format(new Date(entry.created * 1000))}</span>
              <span className="bulk-row__meta">{sizeFormat.format(entry.size / 1024)} KiB</span>
              {pending === entry.path ? (
                <span className="tool-row__actions">
                  <button type="button" className="control-button control-button--quiet" disabled={busy} onClick={() => setPending(null)}>{t("unsaved.cancel")}</button>
                  <button type="button" className="control-button control-button--primary" disabled={busy} onClick={() => restore(entry)}>{t("backups.confirmRestore")}</button>
                </span>
              ) : (
                <button type="button" className="control-button control-button--quiet" disabled={busy} onClick={() => setPending(entry.path)}>{t("backups.restore")}</button>
              )}
            </div>
          ))}
        </div>
        {error ? <p className="bulk-dialog__status bulk-dialog__status--error" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}

export default BackupsDialog;
