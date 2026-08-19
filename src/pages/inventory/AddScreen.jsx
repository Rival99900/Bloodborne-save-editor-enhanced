import { useContext, useState } from "react";
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

  async function handleConfirm() {
    try {
      if (!selected) return;

      const editedSave = await invoke("add_item", {
        id: selected.id,
        quantity,
        isStorage,
      });

      setSave(editedSave);
      setAddScreen(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div id="replaceScreen" role="dialog" aria-modal="true" aria-label="Add catalogued item">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          gap: "1rem",
          padding: "1.5rem 3rem",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "end", width: "534px" }}>
          <label style={{ display: "grid", gap: "0.35rem", flex: 1 }}>
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
          <label style={{ display: "grid", gap: "0.35rem", width: "8rem" }}>
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

        <p style={{ width: "534px", color: "#c7bfaf", fontSize: "0.78rem", lineHeight: 1.45 }}>
          Weapons and armor keep additional slot data. Use <strong>Replace</strong> on an existing
          weapon or armor instead of Add so that this data remains valid.
        </p>

        <SearchAllitems key={catalog} type={catalog} onChange={setSelected} />

        <div>
          <button
            onClick={() => setAddScreen(false)}
            style={{ marginRight: "50px" }}
            id="cancelReplace"
          >
            Cancel
          </button>
          <button id="confirmReplace" onClick={handleConfirm} disabled={!selected}>
            Add selected item
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddScreen;
