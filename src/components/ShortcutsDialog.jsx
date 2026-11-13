import { useLocalization } from "../i18n/localization";
import useDialogFocus from "../utils/useDialogFocus";

// F11: list of the keyboard shortcuts handled in App.jsx.
const SHORTCUTS = [
  ["Ctrl + O", "shortcuts.open"],
  ["Ctrl + S", "shortcuts.save"],
  ["Ctrl + Z", "shortcuts.undo"],
  ["Ctrl + Y / Ctrl + Shift + Z", "shortcuts.redo"],
  ["Ctrl + + / Ctrl + −", "shortcuts.zoom"],
  ["Ctrl + 0", "shortcuts.zoomReset"],
  ["Esc", "shortcuts.close"],
  ["F1", "shortcuts.help"],
];

function ShortcutsDialog({ onClose }) {
  const { t } = useLocalization();
  const panelRef = useDialogFocus(onClose);
  return (
    <div className="bulk-backdrop">
      <div ref={panelRef} className="bulk-dialog tool-dialog tool-dialog--narrow" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
        <header className="bulk-dialog__header">
          <h2 id="shortcuts-title">{t("shortcuts.title")}</h2>
          <button type="button" className="control-button control-button--quiet" onClick={onClose}>{t("saveFlow.close")}</button>
        </header>
        <dl className="shortcuts-list">
          {SHORTCUTS.map(([keys, labelKey]) => (
            <div key={labelKey}>
              <dt><kbd>{keys}</kbd></dt>
              <dd>{t(labelKey)}</dd>
            </div>
          ))}
        </dl>
        <p className="tool-dialog__note">{t("shortcuts.dragDrop")}</p>
      </div>
    </div>
  );
}

export default ShortcutsDialog;
