import useDialogFocus from "../utils/useDialogFocus";
import { useId } from "react";

function StatusDialog({ title, description, closeLabel, tone = "success", onClose }) {
  const titleId = useId();
  const descriptionId = useId();

  const panelRef = useDialogFocus(onClose);

  return (
    <div className="confirm-dialog status-dialog" role="presentation" onMouseDown={onClose}>
      <section
        ref={panelRef}
        className="confirm-dialog__panel status-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className={`confirm-dialog__eyebrow status-dialog__eyebrow status-dialog__eyebrow--${tone}`}>
          {tone === "error" ? "!" : "✓"}
        </p>
        <h2 id={titleId}>{title}</h2>
        {description ? <p id={descriptionId} className="confirm-dialog__description">{description}</p> : null}
        <div className="confirm-dialog__actions">
          <button className="control-button control-button--primary" type="button" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default StatusDialog;
