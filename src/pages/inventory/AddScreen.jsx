import { useContext, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../../context/context";
import { ItemsContext } from "../../context/itemsContext";
import SearchAllitems from "../../components/SearchAllitems";
import SelectSearch from "../../components/SelectSearch";
import DarkSelect from "../../components/DarkSelect";
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
  const [hasDirectUpgradeCapacity, setHasDirectUpgradeCapacity] = useState(null);
  const { setSave } = useContext(SaveContext);
  const { gemEffectCatalog, runeEffects } = useContext(ItemsContext);
  const { t } = useLocalization();
  const destinationLabel = isStorage ? t("sidebar.storage") : t("sidebar.inventory");

  const isStandardItem = ["item", "key", "chalice"].includes(catalog);
  const isEquipment = ["weapon", "armor"].includes(catalog);
  const isUpgrade = ["gem", "rune"].includes(catalog);
  const isDirectUpgradeUnavailable = isUpgrade && hasDirectUpgradeCapacity === false;
  const upgradeShapeOptions = useMemo(
    () => (catalog === "gem" ? GEM_SHAPES : RUNE_TYPES).map((entry) => ({
      value: entry,
      label: entry === "-" ? entry : t(`upgradeShape.${entry.toLowerCase()}`),
    })),
    [catalog, t],
  );
  const effectOptions = useMemo(
    () => (catalog === "gem" ? gemEffectCatalog : runeEffects),
    [catalog, gemEffectCatalog, runeEffects],
  );
  // Equipment can now be inserted into a verified free storage slot as well
  // as into the main inventory. The backend still rejects unsupported or full
  // destinations before any byte is changed.
  const availableCatalogs = CATALOGS;

  function dismiss() {
    setAddScreen(false);
  }

  useEffect(() => {
    let isCurrent = true;
    if (!isUpgrade) {
      setHasDirectUpgradeCapacity(null);
      return () => {
        isCurrent = false;
      };
    }

    setHasDirectUpgradeCapacity(null);
    invoke("get_direct_upgrade_capacity")
      .then((available) => {
        if (isCurrent) setHasDirectUpgradeCapacity(Boolean(available));
      })
      .catch((reason) => {
        console.warn("Unable to check direct Gem/Rune capacity", reason);
        if (isCurrent) setHasDirectUpgradeCapacity(null);
      });

    return () => {
      isCurrent = false;
    };
  }, [isUpgrade]);

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
        const editedSave = await setSave(t("revision.itemAdded"), () =>
          invoke("add_item", {
            id: selected.id,
            quantity,
            isStorage,
          }),
        );
        if (!editedSave) return;
        dismiss();
        return;
      }

      if (isEquipment) {
        if (!selected) return;
        const editedSave = await setSave(t("revision.equipmentAdded"), async () => {
          const result = await invoke("add_direct_equipment", {
            id: selected.id,
            isArmor: catalog === "armor",
            isStorage,
          });
          return result.save;
        });
        if (!editedSave) return;
        dismiss();
        return;
      }

      const effectIds = effects.map((effect) => Number(effect?.value ?? NO_EFFECT_ID));
      if (effectIds[0] === NO_EFFECT_ID) {
        setError(t("inventory.directUpgradePrimaryRequired"));
        return;
      }
      const editedSave = await setSave(t("revision.upgradeAdded"), async () => {
        const result = await invoke("add_direct_upgrade", {
          upgradeType: catalog === "gem" ? "Gem" : "Rune",
          shape,
          effectIds,
          isStorage,
        });
        return result.save;
      });
      if (!editedSave) return;
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
          <span className="inventory-dialog__eyebrow">{destinationLabel}</span>
          <h2>{isUpgrade ? t("inventory.addDirectUpgrade") : isEquipment ? t("inventory.addDirectEquipment") : t("inventory.addItem")}</h2>
          <p>{isUpgrade ? t("inventory.directUpgradeDescription") : isEquipment ? t("inventory.addNotice") : t("inventory.addDescription")}</p>
        </header>

        <div className="inventory-dialog__controls">
          <label>
            <span>{t("inventory.catalog")}</span>
            <DarkSelect
              className="inventory-dialog__select"
              ariaLabel={t("inventory.catalog")}
              options={availableCatalogs.map((entry) => ({ value: entry.value, label: t(entry.labelKey) }))}
              value={catalog}
              onChange={resetCatalog}
            />
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
              <DarkSelect
                className="inventory-dialog__select"
                ariaLabel={catalog === "gem" ? t("inventory.gemShape") : t("inventory.runeType")}
                options={upgradeShapeOptions}
                value={shape}
                onChange={setShape}
              />
            </label>
          ) : null}
        </div>

        <div className="inventory-dialog__body">
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
            <section className="inventory-dialog__standard-content">
              <p className="inventory-dialog__notice">
                {t("inventory.addNotice")}
              </p>
              <SearchAllitems key={catalog} type={catalog} onChange={setSelected} />
            </section>
          )}

          {isDirectUpgradeUnavailable || error ? (
            <p className="inventory-dialog__error" role="alert">
              <span aria-hidden="true">!</span>
              {isDirectUpgradeUnavailable ? t("inventory.directUpgradeUnavailable") : error}
            </p>
          ) : null}
        </div>

        <footer className="inventory-dialog__actions">
          <button onClick={dismiss} id="cancelReplace">{t("inventory.cancel")}</button>
          <button id="confirmReplace" onClick={handleConfirm} disabled={!canConfirm || isSubmitting || isDirectUpgradeUnavailable || isEquipment}>
            {isSubmitting ? t("forge.confirming") : isUpgrade ? t("inventory.addDirect") : isEquipment ? t("inventory.addEquipment") : t("inventory.addSelected")}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default AddScreen;
