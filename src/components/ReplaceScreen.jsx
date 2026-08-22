import { useContext, useEffect, useMemo, useState } from "react";
import Item from "./Item";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../context/context";
import SearchAllitems from "./SearchAllitems";
import { getType } from "../utils/upgrades";
import { useLocalization } from "../i18n/localization";

function ReplaceScreen({
  setSelected,
  selected,
  setReplaceScreen,
  isStorage,
}) {
  const [replacement, setReplacement] = useState(null);
  const { t } = useLocalization();
  const { setSave } = useContext(SaveContext);
  const itemType = useMemo(() => getType(selected.article_type), [selected.article_type]);
  const replacementLabel = itemType === "key" || itemType === "chalice" ? t("inventory.item") : t(`inventory.type.${itemType}`);

  function dismiss() {
    setReplaceScreen(false);
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") dismiss();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleConfirm() {
    if (!replacement) return;

    try {
      const edited = await setSave(t("revision.itemReplaced"), () =>
        invoke("transform_item", {
          index: selected.index,
          id: selected.id,
          newId: Number.parseInt(replacement.id, 10),
          articleType: selected.article_type,
          isStorage,
        }),
      );
      if (!edited) return;
      setSelected(null);
      dismiss();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div
      id="replaceScreen"
      className="replace-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={t("inventory.replaceDialogLabel")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section className="replace-dialog__card">
        <button className="replace-dialog__close" onClick={dismiss} aria-label={t("inventory.closeReplaceLabel")}>
          ×
        </button>

        <aside className="replace-dialog__current">
          <span className="replace-dialog__eyebrow">{t("inventory.replacing")}</span>
          <Item item={selected} isSmall={true} />
          <p>
            {t("inventory.replaceDescription", { type: replacementLabel })}
          </p>
          <footer className="replace-dialog__actions">
            <button onClick={dismiss} id="cancelReplace">
              {t("inventory.cancel")}
            </button>
            <button id="confirmReplace" onClick={handleConfirm} disabled={!replacement}>
              {t("inventory.replaceItem")}
            </button>
          </footer>
        </aside>

        <SearchAllitems
          type={itemType}
          onChange={setReplacement}
          title={t("inventory.selectNew", { type: replacementLabel })}
          variant="replace"
        />
      </section>
    </div>
  );
}

export default ReplaceScreen;
