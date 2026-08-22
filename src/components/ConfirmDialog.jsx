import { useEffect, useId } from "react";
import { useLocalization } from "../i18n/localization";

/**
 * Small in-app confirmation dialog used instead of platform-native confirms.
 * It keeps the selected language, visual system and keyboard behaviour consistent.
 */
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "primary",
  onConfirm,
  onCancel,
}) {
  const { t } = useLocalization();
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onCancel?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="confirm-dialog" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirm-dialog__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="confirm-dialog__eyebrow">{t("actions.confirm")}</p>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId} className="confirm-dialog__description">{description}</p>
        <div className="confirm-dialog__actions">
          <button className="control-button control-button--quiet" onClick={onCancel} autoFocus>
            {cancelLabel ?? t("forge.cancel")}
          </button>
          <button className={`control-button control-button--${tone}`} onClick={onConfirm}>
            {confirmLabel ?? t("actions.confirm")}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
