import { useContext, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../../context/context";
import { ItemsContext } from "../../context/itemsContext";
import SearchAllitems from "../../components/SearchAllitems";
import SelectSearch from "../../components/SelectSearch";
import { useLocalization } from "../../i18n/localization";

const NO_EFFECT_ID = 4294967295;
const CATALOGS = [
  { value: "item", labelKey: "inventory.catalogItems" },
  { value: "key", labelKey: "inventory.catalogKeyItems" },
  { value: "chalice", labelKey: "inventory.catalogChaliceItems" },
  { value: "weapon", labelKey: "inventory.catalogWeapons" },
  { value: "armor", labelKey: "inventory.catalogArmors" },
  { value: "gem", labelKey: "inventory.catalogGems" },
  { value: "rune", labelKey: "inventory.catalogRunes" },
];

const GEM_SHAPES = ["Radial", "Triangle", "Waning", "Circle", "Droplet"];
const RUNE_TYPES = ["-", "Oath"];

function AddScreen({ type = "item", setAddScreen, isStorage }) {
  const [selected, setSelected] = useState(null);
  const [catalog, setCatalog] = useState(type);
  const [quantity, setQuantity] = useState(1);
  const [shape, setShape] = useState("Radial");
  const [effects, setEffects] = useState(Array(6).fill(null));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setSave } = useContext(SaveContext);
  const { gemEffectCatalog, runeEffects } = useContext(ItemsContext);
  const { t } = useLocalization();

  const isStandardItem = ["item", "key", "chalice"].includes(catalog);
  const isEquipment = ["weapon", "armor"].includes(catalog);
  const isUpgrade = ["gem", "rune"].includes(catalog);
  const effectOptions = useMemo(
    () => (catalog === "gem" ? gemEffectCatalog : runeEffects),
    [catalog, gemEffectCatalog, runeEffects],
  );
  const availableCatalogs = isStorage
    ? CATALOGS.filter((entry) => !["weapon", "armor"].includes(entry.value))
    : CATALOGS;

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

  function resetCatalog(nextCatalog) {
    setCatalog(nextCatalog);
    setSelected(null);
    setError("");
    setEffects(Array(6).fill(null));
    setShape(nextCatalog === "rune" ? "-" : "Radial");
  }

  function updateEffect(index, effect) {
    setEffects((previous) => {
      const next = [...previous];
      next[index] = effect;
      return next;
    });
  }

  async function handleConfirm() {
    setError("");
    try {
      setIsSubmitting(true);
      if (isStandardItem) {
        if (!selected) return;
        const editedSave = await invoke("add_item", {
          id: selected.id,
          quantity,
          isStorage,
        });
        setSave(editedSave);
        dismiss();
        return;
      }

      if (isEquipment) {
        if (!selected) return;
        const result = await invoke("add_direct_equipment", {
          id: selected.id,
          isArmor: catalog === "armor",
        });
        setSave(result.save);
        dismiss();
        return;
      }

      const effectIds = effects.map((effect) => Number(effect?.value ?? NO_EFFECT_ID));
      if (effectIds[0] === NO_EFFECT_ID) {
        setError(t("inventory.directUpgradePrimaryRequired"));
        return;
      }
      const result = await invoke("add_direct_upgrade", {
        upgradeType: catalog === "gem" ? "Gem" : "Rune",
        shape,
        effectIds,
        isStorage,
      });
      setSave(result.save);
      dismiss();
    } catch (reason) {
      console.error(reason);
      const message = typeof reason === "string" ? reason : "";
      setError(
        /No safe unreferenced gem or rune record/i.test(message)
          ? t("inventory.directUpgradeUnavailable")
          : message || t("inventory.directAddFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canConfirm = isUpgrade
    ? effects[0] != null
    : selected != null;

  return (
    <div
      id="replaceScreen"
      className="inventory-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={t("inventory.addDialogLabel")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section className="inventory-dialog__card inventory-dialog__card--add">
        <button className="inventory-dialog__close" onClick={dismiss} aria-label={t("inventory.closeAddLabel")}>
          ×
        </button>

        <header className="inventory-dialog__header">
          <span className="inventory-dialog__eyebrow">{t("inventory.title")}</span>
          <h2>{isUpgrade ? t("inventory.addDirectUpgrade") : isEquipment ? t("inventory.addDirectEquipment") : t("inventory.addItem")}</h2>
          <p>{isUpgrade ? t("inventory.directUpgradeDescription") : isEquipment ? t("inventory.directEquipmentDescription") : t("inventory.addDescription")}</p>
        </header>

        <div className="inventory-dialog__controls">
          <label>
            <span>{t("inventory.catalog")}</span>
            <select value={catalog} onChange={(event) => resetCatalog(event.target.value)}>
              {availableCatalogs.map((entry) => (
                <option key={entry.value} value={entry.value}>{t(entry.labelKey)}</option>
              ))}
            </select>
          </label>
          {isStandardItem ? (
            <label className="inventory-dialog__quantity">
              <span>{t("inventory.quantity")}</span>
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
          ) : null}
          {isUpgrade ? (
            <label>
              <span>{catalog === "gem" ? t("inventory.gemShape") : t("inventory.runeType")}</span>
              <select value={shape} onChange={(event) => setShape(event.target.value)}>
                {(catalog === "gem" ? GEM_SHAPES : RUNE_TYPES).map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {isUpgrade ? (
          <section className="direct-upgrade-builder" aria-label={t("inventory.directUpgradeBuilder")}>
            <p className="inventory-dialog__notice">{t("inventory.directUpgradeNotice")}</p>
            <div className="direct-upgrade-builder__effects">
              {effects.map((effect, index) => (
                <label key={index}>
                  <span>{t("forge.effect", { index: index + 1 })}</span>
                  <SelectSearch
                    key={`${catalog}-${index}-${effect?.value ?? "empty"}`}
                    defaultValue={t("forge.noEffect")}
                    selected={effect?.value ?? null}
                    options={effectOptions}
                    compact
                    maxListHeight={320}
                    onChange={(nextEffect) => updateEffect(index, nextEffect)}
                  />
                </label>
              ))}
            </div>
          </section>
        ) : (
          <>
            <p className="inventory-dialog__notice">
              {isEquipment ? t("inventory.directEquipmentNotice") : t("inventory.addNotice")}
            </p>
            <SearchAllitems key={catalog} type={catalog} onChange={setSelected} />
          </>
        )}

        {error ? (
          <p className="inventory-dialog__error" role="alert">
            <span aria-hidden="true">!</span>
            {error}
          </p>
        ) : null}

        <footer className="inventory-dialog__actions">
          <button onClick={dismiss} id="cancelReplace">{t("inventory.cancel")}</button>
          <button id="confirmReplace" onClick={handleConfirm} disabled={!canConfirm || isSubmitting}>
            {isSubmitting ? t("forge.confirming") : isUpgrade ? t("inventory.addDirect") : isEquipment ? t("inventory.addEquipment") : t("inventory.addSelected")}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default AddScreen;
