import { useContext, useEffect, useMemo, useState } from "react";
import Item from "./Item";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../context/context";
import SearchAllitems from "./SearchAllitems";
import { getType } from "../utils/upgrades";

function ReplaceScreen({
  setSelected,
  selected,
  setReplaceScreen,
  isStorage,
}) {
  const [replacement, setReplacement] = useState(null);
  const { setSave } = useContext(SaveContext);
  const itemType = useMemo(() => getType(selected.article_type), [selected.article_type]);
  const replacementLabel = itemType === "key" || itemType === "chalice" ? "item" : itemType;

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
      const edited = await invoke("transform_item", {
        index: selected.index,
        id: selected.id,
        newId: Number.parseInt(replacement.id, 10),
        articleType: selected.article_type,
        isStorage,
      });

      setSave(edited);
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
      aria-label="Replace selected item"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section className="replace-dialog__card">
        <button className="replace-dialog__close" onClick={dismiss} aria-label="Close Replace item">
          ×
        </button>

        <aside className="replace-dialog__current">
          <span className="replace-dialog__eyebrow">Replacing</span>
          <Item item={selected} isSmall={true} />
          <p>
            Choose a compatible {replacementLabel} from the catalogue. The slot position is preserved.
          </p>
          <footer className="replace-dialog__actions">
            <button onClick={dismiss} id="cancelReplace">
              Cancel
            </button>
            <button id="confirmReplace" onClick={handleConfirm} disabled={!replacement}>
              Replace item
            </button>
          </footer>
        </aside>

        <SearchAllitems
          type={itemType}
          onChange={setReplacement}
          title={`Select a new ${replacementLabel}`}
          variant="replace"
        />
      </section>
    </div>
  );
}

export default ReplaceScreen;
