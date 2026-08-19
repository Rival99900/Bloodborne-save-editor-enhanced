import { useContext, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../../context/context";
import SearchAllitems from "../../components/SearchAllitems";

const CATALOGS = [
  { value: "item", label: "Items and consumables" },
  { value: "key", label: "Key items" },
  { value: "chalice", label: "Chalice items" },
];

function AddScreen({ type = "item", setAddScreen, isStorage }) {
  const [selected, setSelected] = useState(null);
  const [catalog, setCatalog] = useState(type);
  const [quantity, setQuantity] = useState(1);
  const { setSave } = useContext(SaveContext);

  function dismiss() {
    setAddScreen(false);
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") dismiss();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleConfirm() {
    try {
      if (!selected) return;

      const editedSave = await invoke("add_item", {
        id: selected.id,
        quantity,
        isStorage,
      });

      setSave(editedSave);
      dismiss();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div
      id="replaceScreen"
      className="inventory-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Add catalogued item"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section className="inventory-dialog__card inventory-dialog__card--add">
        <button className="inventory-dialog__close" onClick={dismiss} aria-label="Close Add item">
          ×
        </button>

        <header className="inventory-dialog__header">
          <span className="inventory-dialog__eyebrow">Inventory</span>
          <h2>Add an item</h2>
          <p>Select an item from a safe catalogue and choose its quantity.</p>
        </header>

        <div className="inventory-dialog__controls">
          <label>
            <span>Catalog</span>
            <select
              value={catalog}
              onChange={(event) => {
                setCatalog(event.target.value);
                setSelected(null);
              }}
            >
              {CATALOGS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory-dialog__quantity">
            <span>Quantity</span>
            <input
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                setQuantity(Number.isFinite(nextValue) ? Math.min(99, Math.max(1, nextValue)) : 1);
              }}
            />
          </label>
        </div>

        <p className="inventory-dialog__notice">
          Weapons and armor keep additional slot data. Use <strong>Replace</strong> on an existing
          weapon or armor instead of Add so that this data remains valid.
        </p>

        <SearchAllitems key={catalog} type={catalog} onChange={setSelected} />

        <footer className="inventory-dialog__actions">
          <button onClick={dismiss} id="cancelReplace">
            Cancel
          </button>
          <button id="confirmReplace" onClick={handleConfirm} disabled={!selected}>
            Add selected item
          </button>
        </footer>
      </section>
    </div>
  );
}

export default AddScreen;
