import { useMemo, useState, useContext } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../context/context";
import { useLocalization } from "../i18n/localization";
import useDialogFocus from "../utils/useDialogFocus";
import { weaponLevel } from "../utils/saveCheck";
import { weaponIsUpgradable } from "../utils/weaponLevels";

const MAX_WEAPON_LEVEL = 10;
const SORTS = ["rating", "name", "shape"];

const SHAPE_KEYS = { radial: "radial", triangle: "triangle", waning: "waning", circle: "circle", droplet: "droplet", oath: "oath" };

function primaryEffect(upgrade) {
  return upgrade?.effects?.[0]?.[1] ?? "";
}

// F6 (move Gems/Runes in bulk) and F8 (every weapon to +10), on Inventory or Storage.
function BulkActions({ isStorage, onClose }) {
  const { save, setSave } = useContext(SaveContext);
  const { t, language } = useLocalization();
  const panelRef = useDialogFocus(onClose);
  const container = isStorage ? save.storage : save.inventory;
  const [tab, setTab] = useState("upgrades");
  const [upgradeType, setUpgradeType] = useState("Gem");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("rating");
  const [checked, setChecked] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  // Index = position in the source list, which is what the backend expects.
  const rows = useMemo(() => {
    const list = (container?.upgrades?.[upgradeType] ?? []).map((upgrade, index) => ({ upgrade, index }));
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? list.filter(({ upgrade }) => `${upgrade.info?.name} ${upgrade.shape} ${upgrade.effects?.map((effect) => effect[1]).join(" ")}`.toLowerCase().includes(needle))
      : list;
    const collator = new Intl.Collator(language);
    return [...filtered].sort((a, b) => {
      if (sort === "rating") return Number(b.upgrade.info?.rating ?? 0) - Number(a.upgrade.info?.rating ?? 0) || a.index - b.index;
      if (sort === "shape") return collator.compare(a.upgrade.shape ?? "", b.upgrade.shape ?? "") || a.index - b.index;
      return collator.compare(a.upgrade.info?.name ?? "", b.upgrade.info?.name ?? "") || a.index - b.index;
    });
  }, [container, upgradeType, query, sort, language]);

  const weapons = useMemo(
    () => ["RightHand", "LeftHand"].flatMap((type) => (container?.articles?.[type] ?? []).map((article) => ({ article, type }))),
    [container],
  );
  const upgradable = weapons.filter(({ article }) => weaponIsUpgradable(article.id) && weaponLevel(article) < MAX_WEAPON_LEVEL);
  const notUpgradable = weapons.filter(({ article }) => !weaponIsUpgradable(article.id)).length;

  function toggle(index) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  function selectVisible(select) {
    setChecked((current) => {
      const next = new Set(current);
      rows.forEach(({ index }) => (select ? next.add(index) : next.delete(index)));
      return next;
    });
  }

  async function moveSelected() {
    if (busy || checked.size === 0) return;
    setBusy(true); setStatus(null);
    try {
      let moved = 0;
      const updated = await setSave(t("bulk.movedRevision", { count: checked.size }), async () => {
        const result = await invoke("move_upgrades", { upgradeType, indices: [...checked], isStorage });
        moved = result.moved;
        return result.save;
      });
      if (updated) {
        setChecked(new Set());
        setStatus({ tone: "success", text: t(isStorage ? "bulk.movedToInventory" : "bulk.movedToStorage", { count: moved }) });
      }
    } catch (error) {
      console.error("Unable to move upgrades.", error);
      setStatus({ tone: "error", text: String(error).includes("Not enough free slots") ? t("bulk.noSpace") : t("bulk.failed") });
    } finally {
      setBusy(false);
    }
  }

  async function upgradeAllWeapons() {
    if (busy || upgradable.length === 0) return;
    setBusy(true); setStatus(null);
    try {
      let count = upgradable.length;
      // One atomic backend step: every weapon or none.
      const updated = await setSave(t("bulk.weaponsRevision", { count }), async () => {
        const result = await invoke("upgrade_all_weapons", { isStorage, level: MAX_WEAPON_LEVEL });
        count = result.upgraded;
        return result.save;
      });
      if (updated) setStatus({ tone: "success", text: t("bulk.weaponsDone", { count }) });
    } catch (error) {
      console.error("Unable to upgrade weapons.", error);
      setStatus({ tone: "error", text: t("bulk.failed") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bulk-backdrop">
      <div ref={panelRef} className="bulk-dialog" role="dialog" aria-modal="true" aria-labelledby="bulk-title">
        <header className="bulk-dialog__header">
          <div>
            <p className="bulk-dialog__eyebrow">{t(isStorage ? "sidebar.storage" : "sidebar.inventory")}</p>
            <h2 id="bulk-title">{t("bulk.title")}</h2>
          </div>
          <button type="button" className="control-button control-button--quiet" onClick={onClose}>{t("saveFlow.close")}</button>
        </header>

        <div className="bulk-dialog__tabs" role="tablist">
          {["upgrades", "weapons"].map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              className={`control-button control-button--quiet ${tab === name ? "is-active" : ""}`}
              onClick={() => setTab(name)}
            >
              {t(`bulk.tab.${name}`)}
            </button>
          ))}
        </div>

        {tab === "upgrades" ? (
          <>
            <div className="bulk-dialog__toolbar">
              <select value={upgradeType} onChange={(event) => { setUpgradeType(event.target.value); setChecked(new Set()); }} aria-label={t("bulk.type")}>
                <option value="Gem">{t("inventory.filters.gems")}</option>
                <option value="Rune">{t("inventory.filters.runes")}</option>
              </select>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("bulk.filter")} aria-label={t("bulk.filter")} />
              <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label={t("bulk.sort")}>
                {SORTS.map((name) => <option key={name} value={name}>{t(`bulk.sortBy.${name}`)}</option>)}
              </select>
            </div>
            <div className="bulk-dialog__selection">
              <span>{t("bulk.selected", { count: checked.size, total: rows.length })}</span>
              <button type="button" className="control-button control-button--quiet" onClick={() => selectVisible(true)} disabled={rows.length === 0}>{t("bulk.selectVisible")}</button>
              <button type="button" className="control-button control-button--quiet" onClick={() => selectVisible(false)} disabled={checked.size === 0}>{t("bulk.clearSelection")}</button>
            </div>
            <div className="bulk-dialog__list" role="list">
              {rows.length === 0 ? <p className="inventory-empty">{t("inventory.empty.category")}</p> : rows.map(({ upgrade, index }) => (
                <label key={`${upgradeType}-${index}`} className="bulk-row" role="listitem">
                  <input type="checkbox" checked={checked.has(index)} onChange={() => toggle(index)} />
                  <span className="bulk-row__name">{upgrade.info?.name}</span>
                  <span className="bulk-row__meta">{upgradeType === "Gem" ? `${t("vignette.rating")} ${upgrade.info?.rating ?? "—"}` : ""}</span>
                  <span className="bulk-row__meta">{SHAPE_KEYS[String(upgrade.shape).toLowerCase()] ? t(`upgradeShape.${SHAPE_KEYS[String(upgrade.shape).toLowerCase()]}`) : upgrade.shape}</span>
                  <span className="bulk-row__effect">{primaryEffect(upgrade)}</span>
                </label>
              ))}
            </div>
            <footer className="bulk-dialog__footer">
              <p>{t("bulk.moveNote")}</p>
              <button type="button" className="control-button control-button--primary" disabled={busy || checked.size === 0} onClick={moveSelected}>
                {t(isStorage ? "bulk.moveToInventory" : "bulk.moveToStorage", { count: checked.size })}
              </button>
            </footer>
          </>
        ) : (
          <div className="bulk-dialog__weapons">
            <p>{t("bulk.weaponsSummary", { total: weapons.length, count: upgradable.length })}</p>
            {notUpgradable ? <p className="tools-note">{t("bulk.weaponsSkipped", { count: notUpgradable })}</p> : null}
            <ul>
              {upgradable.slice(0, 12).map(({ article, type }) => (
                <li key={`${type}-${article.index}`}>{article.info?.item_name} +{weaponLevel(article)} → +{MAX_WEAPON_LEVEL}</li>
              ))}
              {upgradable.length > 12 ? <li>{t("bulk.andMore", { count: upgradable.length - 12 })}</li> : null}
            </ul>
            <footer className="bulk-dialog__footer">
              <p>{t("bulk.weaponsNote")}</p>
              <button type="button" className="control-button control-button--primary" disabled={busy || upgradable.length === 0} onClick={upgradeAllWeapons}>
                {t("bulk.weaponsAction", { count: upgradable.length })}
              </button>
            </footer>
          </div>
        )}
        {status ? <p className={`bulk-dialog__status bulk-dialog__status--${status.tone}`} role="status">{status.text}</p> : null}
      </div>
    </div>
  );
}

export default BulkActions;
