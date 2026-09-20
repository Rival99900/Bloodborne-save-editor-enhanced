import { invoke } from "@tauri-apps/api/core";
import { memo, useContext, useState } from "react";
import { useLocalization } from "../../i18n/localization";
import { SaveContext } from "../../context/context";
import ConfirmDialog from "../../components/ConfirmDialog";
import StatusDialog from "../../components/StatusDialog";

function Flag({ label, offset, values, info, impact, warning = "", category = "Known flag", isMask = false }) {
  const { t } = useLocalization();
  const { setSave } = useContext(SaveContext);
  const [isApplying, setIsApplying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  async function apply() {
    setIsApplying(true);
    try {
      const editedSave = await setSave(t("revision.flagUpdated"), async () => {
        if (isMask) return invoke("apply_mask", { offset, mask: values[0] });

        let updatedSave = null;
        for (let index = 0; index < values.length; index += 1) {
          updatedSave = await invoke("set_flag", {
            offset: offset + index,
            newValue: values[index],
          });
        }
        return updatedSave;
      });
      if (!editedSave) return;
      setNotice({ tone: "success" });
    } catch (error) {
      setNotice({ tone: "error", error: String(error) });
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <>
      {notice ? (
        <StatusDialog
          title={label}
          tone={notice.tone}
          description={notice.tone === "error"
            ? t("flags.card.applyFailed", { error: notice.error })
            : t("flags.card.applied")}
          closeLabel={t("saveFlow.close")}
          onClose={() => setNotice(null)}
        />
      ) : null}
      {confirmOpen ? (
        <ConfirmDialog
          title={label}
          description={`${impact}\n\n${t("flags.card.confirm")}`}
          confirmLabel={t("flags.card.apply")}
          onConfirm={() => {
            setConfirmOpen(false);
            apply();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
      <article className="flag-card">
      <div className="flag-card__content">
        <span className="flag-card__category">{category}</span>
        <h2>{label}</h2>
        <p>{info}</p>
        {expanded ? (
          <div className="flag-card__details">
            <p><strong>{t("flags.card.whatChanges")}</strong> {impact}</p>
            {warning ? <p><strong>{t("flags.card.careful")}</strong> {warning}</p> : null}
            <p className="flag-card__technical">{t("flags.card.bytePattern")} {values.join(" · ")}</p>
          </div>
        ) : null}
      </div>

      <div className="flag-card__actions">
        <button className="flag-card__details-button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? t("flags.card.hideDetails") : t("flags.card.showDetails")}
        </button>
        <button className="buttonBg flag-card__apply" onClick={() => setConfirmOpen(true)} disabled={isApplying}>
          {isApplying ? t("flags.card.applying") : t("flags.card.apply")}
        </button>
        </div>
      </article>
    </>
  );
}

export default memo(Flag);
