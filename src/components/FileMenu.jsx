import { useEffect, useRef, useState } from "react";
import { useLocalization } from "../i18n/localization";

// "File" menu next to Open save (F9, F10, F11, F12).
function FileMenu({ recentFiles, hasSave, hasPath, onOpenRecent, onClearRecent, onBackups, onPs4, onShortcuts }) {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function close(event) {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "mousedown" && rootRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  const run = (action) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="file-menu" ref={rootRef}>
      <button
        type="button"
        className="control-button control-button--quiet file-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("fileMenu.label")}
        title={t("fileMenu.label")}
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
      {open ? (
        <div className="file-menu__panel" role="menu">
          <p className="file-menu__heading">{t("fileMenu.recent")}</p>
          {recentFiles.length === 0 ? (
            <p className="file-menu__empty">{t("fileMenu.noRecent")}</p>
          ) : (
            recentFiles.map((entry) => (
              <button key={entry.path} type="button" role="menuitem" className="file-menu__item" title={entry.path} onClick={run(() => onOpenRecent(entry))}>
                <span>{entry.name}</span>
                <small>{entry.remote ? `PS4 · ${entry.remote.path}` : entry.path}</small>
              </button>
            ))
          )}
          {recentFiles.length ? (
            <button type="button" role="menuitem" className="file-menu__item file-menu__item--quiet" onClick={run(onClearRecent)}>
              {t("fileMenu.clearRecent")}
            </button>
          ) : null}
          <hr />
          <button type="button" role="menuitem" className="file-menu__item" disabled={!hasSave || !hasPath} onClick={run(onBackups)}>
            {t("fileMenu.backups")}
          </button>
          <button type="button" role="menuitem" className="file-menu__item" onClick={run(onPs4)}>
            {t("fileMenu.ps4")}
          </button>
          <button type="button" role="menuitem" className="file-menu__item" onClick={run(onShortcuts)}>
            {t("fileMenu.shortcuts")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default FileMenu;
