import { useMemo, useState, useContext } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../context/context";
import { useLocalization } from "../i18n/localization";
import useDialogFocus from "../utils/useDialogFocus";
import { weaponLevel } from "../utils/saveCheck";
import { weaponIsUpgradable } from "../utils/weaponLevels";
import * as dialog from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import {
  buildExport,
  IMPORT_CATEGORIES,
  importCounts,
  parseImport,
  selectImport,
  toCsv,
} from "../utils/containerTransfer";
import { readTextDocument, writeTextDocument } from "../utils/textDocuments";

const MAX_WEAPON_LEVEL = 10;
const OPEN_SHAPES = ["Radial", "Triangle", "Waning", "Circle", "Droplet"];
// The game reads up to five Gem slots on a weapon; three is the usual count.
const SLOT_COUNTS = [1, 2, 3, 4, 5];
const INFINITE_CODE = 0xb0000000;
// Game limits: 20 carried, 600 in Storage (patch 1.04).
const REFILL = [
  { id: 1000, key: "bulk.items.vials" },
  { id: 900, key: "bulk.items.bullets" },
];
const TABS = ["upgrades", "weapons", "slots", "items", "transfer"];
const IMPORT_ERRORS = ["format", "columns", "kind", "value", "tooMany"];
const SORTS = ["rating", "name", "shape"];

const SHAPE_KEYS = {
  radial: "radial",
  triangle: "triangle",
  waning: "waning",
  circle: "circle",
  droplet: "droplet",
  oath: "oath",
};

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
    const list = (container?.upgrades?.[upgradeType] ?? []).map((upgrade, index) => ({
      upgrade,
      index,
    }));
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? list.filter(({ upgrade }) =>
          `${upgrade.info?.name} ${upgrade.shape} ${upgrade.effects?.map((effect) => effect[1]).join(" ")}`
            .toLowerCase()
            .includes(needle),
        )
      : list;
    const collator = new Intl.Collator(language);
    return [...filtered].sort((a, b) => {
      if (sort === "rating")
        return (
          Number(b.upgrade.info?.rating ?? 0) - Number(a.upgrade.info?.rating ?? 0) ||
          a.index - b.index
        );
      if (sort === "shape")
        return collator.compare(a.upgrade.shape ?? "", b.upgrade.shape ?? "") || a.index - b.index;
      return (
        collator.compare(a.upgrade.info?.name ?? "", b.upgrade.info?.name ?? "") ||
        a.index - b.index
      );
    });
  }, [container, upgradeType, query, sort, language]);

  const weapons = useMemo(
    () =>
      ["RightHand", "LeftHand"].flatMap((type) =>
        (container?.articles?.[type] ?? []).map((article) => ({ article, type })),
      ),
    [container],
  );
  const upgradable = weapons.filter(
    ({ article }) => weaponIsUpgradable(article.id) && weaponLevel(article) < MAX_WEAPON_LEVEL,
  );
  const notUpgradable = weapons.filter(({ article }) => !weaponIsUpgradable(article.id)).length;
  const [openShape, setOpenShape] = useState("Radial");
  const [slotCount, setSlotCount] = useState(3);
  const closedSlots = weapons.reduce(
    (total, { article }) =>
      total +
      (article.slots ?? []).slice(0, slotCount).filter((slot) => slot.shape === "Closed").length,
    0,
  );
  const refillLimit = isStorage ? 600 : 20;
  const refillRows = REFILL.map((entry) => ({
    ...entry,
    amount:
      (container?.articles?.Consumable ?? []).find((item) => Number(item.id) === entry.id)
        ?.amount ?? 0,
  }));
  const refillNeeded = refillRows.some((row) => row.amount !== refillLimit);
  // Carried stacks with the bare code 0xB0000000 are never used up in game.
  const infinite = REFILL.every((entry) =>
    (save?.inventory?.articles?.Consumable ?? []).some(
      (item) => Number(item.id) === entry.id && Number(item.first_part) === INFINITE_CODE,
    ),
  );
  const [pendingImport, setPendingImport] = useState(null);
  const [importCategory, setImportCategory] = useState("all");
  const [keepGems, setKeepGems] = useState(true);
  const [progress, setProgress] = useState(null);
  const counts = pendingImport ? importCounts(pendingImport.data) : null;
  const selected = pendingImport
    ? selectImport(pendingImport.data, importCategory, keepGems)
    : null;
  const selectedTotal = selected
    ? selected.items.length + selected.equipment.length + selected.upgrades.length
    : 0;
  const location = isStorage ? "storage" : "inventory";

  async function exportContainer(kind) {
    if (busy) return;
    setStatus(null);
    try {
      const path = await dialog.save({
        title: t("bulk.transfer.exportTitle"),
        defaultPath: `bloodborne-${location}.${kind}`,
        filters: [{ name: kind.toUpperCase(), extensions: [kind] }],
      });
      if (!path) return;
      const data = buildExport(container, location);
      await writeTextDocument(
        path,
        kind === "csv" ? toCsv(data) : `${JSON.stringify(data, null, 2)}\n`,
      );
      setStatus({
        tone: "success",
        text: t("bulk.transfer.exported", {
          count: data.items.length + data.equipment.length + data.upgrades.length,
        }),
      });
    } catch (error) {
      console.error("Export failed.", error);
      setStatus({ tone: "error", text: t("bulk.transfer.writeFailed") });
    }
  }

  async function chooseImport() {
    if (busy) return;
    setStatus(null);
    setPendingImport(null);
    try {
      const path = await dialog.open({
        title: t("bulk.transfer.importTitle"),
        multiple: false,
        filters: [{ name: "JSON / CSV", extensions: ["json", "csv"] }],
      });
      if (!path) return;
      const text = await readTextDocument(path);
      const data = parseImport(text, String(path));
      if (!data.items.length && !data.equipment.length && !data.upgrades.length) {
        setStatus({ tone: "error", text: t("bulk.transfer.empty") });
        return;
      }
      setPendingImport({ data, name: String(path).split(/[\\/]/).pop() });
      setImportCategory("all");
      setKeepGems(true);
    } catch (error) {
      const code = IMPORT_ERRORS.includes(error?.message) ? error.message : "read";
      setStatus({ tone: "error", text: t(`bulk.transfer.errors.${code}`) });
    }
  }

  function toggle(index) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
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
    setBusy(true);
    setStatus(null);
    try {
      let moved = 0;
      const updated = await setSave(t("bulk.movedRevision", { count: checked.size }), async () => {
        const result = await invoke("move_upgrades", {
          upgradeType,
          indices: [...checked],
          isStorage,
        });
        moved = result.moved;
        return result.save;
      });
      if (updated) {
        setChecked(new Set());
        setStatus({
          tone: "success",
          text: t(isStorage ? "bulk.movedToInventory" : "bulk.movedToStorage", { count: moved }),
        });
      }
    } catch (error) {
      console.error("Unable to move upgrades.", error);
      setStatus({
        tone: "error",
        text: String(error).includes("Not enough free slots")
          ? t("bulk.noSpace")
          : t("bulk.failed"),
      });
    } finally {
      setBusy(false);
    }
  }

  async function upgradeAllWeapons() {
    if (busy || upgradable.length === 0) return;
    setBusy(true);
    setStatus(null);
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

  // Shared runner for the one-step bulk commands below.
  async function runBulk(label, command, args, done) {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      let result = null;
      const updated = await setSave(label, async () => {
        result = await invoke(command, { isStorage, ...args });
        return result.save;
      });
      if (updated) setStatus({ tone: "success", text: done(result) });
    } catch (error) {
      console.error(`Bulk action ${command} failed.`, error);
      setStatus({ tone: "error", text: t("bulk.failed") });
    } finally {
      setBusy(false);
    }
  }

  // Import with live progress ("import-progress" events from the backend).
  async function runImport() {
    if (busy || !selectedTotal) return;
    let stop = null;
    try {
      stop = await listen("import-progress", (event) => setProgress(event.payload));
    } catch {
      stop = null;
    }
    setProgress({ done: 0, total: selectedTotal });
    try {
      await runBulk(
        t("bulk.transfer.revision", { name: pendingImport.name }),
        "import_container",
        { data: selected },
        (result) => {
          setPendingImport(null);
          const report = result.report;
          const text = t("bulk.transfer.done", {
            added: report.items_added + report.equipment_added + report.upgrades_added,
            updated: report.items_updated,
            unchanged: report.unchanged,
            gems: report.gems_equipped ?? 0,
          });
          return report.skipped
            ? `${text} ${t("bulk.transfer.skipped", { count: report.skipped })}`
            : text;
        },
      );
    } finally {
      if (typeof stop === "function") stop();
      setProgress(null);
    }
  }

  return (
    <div className="bulk-backdrop">
      <div
        ref={panelRef}
        className="bulk-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-title"
      >
        <header className="bulk-dialog__header">
          <div>
            <p className="bulk-dialog__eyebrow">
              {t(isStorage ? "sidebar.storage" : "sidebar.inventory")}
            </p>
            <h2 id="bulk-title">{t("bulk.title")}</h2>
          </div>
          <button type="button" className="control-button control-button--quiet" onClick={onClose}>
            {t("saveFlow.close")}
          </button>
        </header>

        <div className="bulk-dialog__tabs" role="tablist">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              className={`control-button control-button--quiet ${tab === name ? "is-active" : ""}`}
              onClick={() => {
                setTab(name);
                setStatus(null);
              }}
            >
              {t(`bulk.tab.${name}`)}
            </button>
          ))}
        </div>

        {tab === "upgrades" ? (
          <>
            <div className="bulk-dialog__toolbar">
              <select
                value={upgradeType}
                onChange={(event) => {
                  setUpgradeType(event.target.value);
                  setChecked(new Set());
                }}
                aria-label={t("bulk.type")}
              >
                <option value="Gem">{t("inventory.filters.gems")}</option>
                <option value="Rune">{t("inventory.filters.runes")}</option>
              </select>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("bulk.filter")}
                aria-label={t("bulk.filter")}
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label={t("bulk.sort")}
              >
                {SORTS.map((name) => (
                  <option key={name} value={name}>
                    {t(`bulk.sortBy.${name}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="bulk-dialog__selection">
              <span>{t("bulk.selected", { count: checked.size, total: rows.length })}</span>
              <button
                type="button"
                className="control-button control-button--quiet"
                onClick={() => selectVisible(true)}
                disabled={rows.length === 0}
              >
                {t("bulk.selectVisible")}
              </button>
              <button
                type="button"
                className="control-button control-button--quiet"
                onClick={() => selectVisible(false)}
                disabled={checked.size === 0}
              >
                {t("bulk.clearSelection")}
              </button>
            </div>
            <div className="bulk-dialog__list" role="list">
              {rows.length === 0 ? (
                <p className="inventory-empty">{t("inventory.empty.category")}</p>
              ) : (
                rows.map(({ upgrade, index }) => (
                  <label key={`${upgradeType}-${index}`} className="bulk-row" role="listitem">
                    <input
                      type="checkbox"
                      checked={checked.has(index)}
                      onChange={() => toggle(index)}
                    />
                    <span className="bulk-row__name">{upgrade.info?.name}</span>
                    <span className="bulk-row__meta">
                      {upgradeType === "Gem"
                        ? `${t("vignette.rating")} ${upgrade.info?.rating ?? "—"}`
                        : ""}
                    </span>
                    <span className="bulk-row__meta">
                      {SHAPE_KEYS[String(upgrade.shape).toLowerCase()]
                        ? t(`upgradeShape.${SHAPE_KEYS[String(upgrade.shape).toLowerCase()]}`)
                        : upgrade.shape}
                    </span>
                    <span className="bulk-row__effect">{primaryEffect(upgrade)}</span>
                  </label>
                ))
              )}
            </div>
            <footer className="bulk-dialog__footer">
              <p>{t("bulk.moveNote")}</p>
              <button
                type="button"
                className="control-button control-button--primary"
                disabled={busy || checked.size === 0}
                onClick={moveSelected}
              >
                {busy
                  ? t("bulk.working")
                  : t(isStorage ? "bulk.moveToInventory" : "bulk.moveToStorage", {
                      count: checked.size,
                    })}
              </button>
            </footer>
          </>
        ) : tab === "slots" ? (
          <div className="bulk-dialog__weapons">
            <p>{t("bulk.slots.summary", { count: closedSlots })}</p>
            <div className="bulk-dialog__inline">
              <label className="bulk-dialog__inline">
                <span>{t("bulk.slots.shape")}</span>
                <select value={openShape} onChange={(event) => setOpenShape(event.target.value)}>
                  {OPEN_SHAPES.map((shape) => (
                    <option key={shape} value={shape}>
                      {t(`upgradeShape.${shape.toLowerCase()}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="bulk-dialog__inline">
                <span>{t("bulk.slots.count")}</span>
                <select
                  value={slotCount}
                  onChange={(event) => setSlotCount(Number(event.target.value))}
                >
                  {SLOT_COUNTS.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <footer className="bulk-dialog__footer">
              <p>{t("bulk.slots.note")}</p>
              <button
                type="button"
                className="control-button control-button--primary"
                disabled={busy || closedSlots === 0}
                aria-busy={busy}
                onClick={() =>
                  runBulk(
                    t("bulk.slots.revision", { count: closedSlots }),
                    "open_all_weapon_slots",
                    { shape: openShape, count: slotCount },
                    (result) => t("bulk.slots.done", { count: result.slots }),
                  )
                }
              >
                {busy ? t("bulk.working") : t("bulk.slots.action", { count: closedSlots })}
              </button>
            </footer>
          </div>
        ) : tab === "transfer" ? (
          <div className="bulk-dialog__weapons">
            <p>{t("bulk.transfer.summary")}</p>
            <div className="bulk-dialog__inline">
              <button
                type="button"
                className="control-button control-button--quiet"
                disabled={busy}
                onClick={() => exportContainer("json")}
              >
                {t("bulk.transfer.exportJson")}
              </button>
              <button
                type="button"
                className="control-button control-button--quiet"
                disabled={busy}
                onClick={() => exportContainer("csv")}
              >
                {t("bulk.transfer.exportCsv")}
              </button>
              <button
                type="button"
                className="control-button control-button--quiet"
                disabled={busy}
                onClick={chooseImport}
              >
                {t("bulk.transfer.import")}
              </button>
              {pendingImport ? (
                <>
                  <select
                    value={importCategory}
                    disabled={busy}
                    aria-label={t("bulk.transfer.what")}
                    onChange={(event) => setImportCategory(event.target.value)}
                  >
                    {IMPORT_CATEGORIES.map((name) => (
                      <option key={name} value={name} disabled={!counts[name]}>
                        {t(`bulk.transfer.categories.${name}`, { count: counts[name] })}
                      </option>
                    ))}
                  </select>
                  {["all", "weapons", "armor"].includes(importCategory) ? (
                    <select
                      value={keepGems ? "with" : "without"}
                      disabled={busy}
                      aria-label={t("bulk.transfer.gemsLabel")}
                      onChange={(event) => setKeepGems(event.target.value === "with")}
                    >
                      <option value="with">{t("bulk.transfer.withGems")}</option>
                      <option value="without">{t("bulk.transfer.withoutGems")}</option>
                    </select>
                  ) : null}
                </>
              ) : null}
            </div>
            {pendingImport ? (
              <div
                className="bulk-dialog__preview"
                role="group"
                aria-label={t("bulk.transfer.preview")}
              >
                <p>
                  <strong>{pendingImport.name}</strong>
                </p>
                <p>
                  {t("bulk.transfer.contents", {
                    items: selected.items.length,
                    equipment: selected.equipment.length,
                    upgrades: selected.upgrades.length,
                  })}
                </p>
                {progress ? (
                  <>
                    <progress
                      className="bulk-dialog__progress"
                      max={progress.total || 1}
                      value={progress.done}
                    />
                    <p aria-live="polite">
                      {t("bulk.transfer.progress", { done: progress.done, total: progress.total })}
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}
            <footer className="bulk-dialog__footer">
              <p>{t("bulk.transfer.note")}</p>
              <button
                type="button"
                className="control-button control-button--primary"
                disabled={busy || !pendingImport || !selectedTotal}
                aria-busy={busy}
                onClick={runImport}
              >
                {busy ? t("bulk.transfer.importing") : t("bulk.transfer.apply")}
              </button>
            </footer>
          </div>
        ) : tab === "items" ? (
          <div className="bulk-dialog__weapons">
            <p>{t("bulk.items.summary", { count: refillLimit })}</p>
            <ul>
              {refillRows.map((row) => (
                <li key={row.id}>
                  {t(row.key)} : {row.amount} → {refillLimit}
                </li>
              ))}
            </ul>
            <footer className="bulk-dialog__footer">
              <p>{t("bulk.items.note")}</p>
              <button
                type="button"
                className="control-button control-button--primary"
                disabled={busy || !refillNeeded}
                aria-busy={busy}
                onClick={() =>
                  runBulk(t("bulk.items.revision"), "refill_vials_and_bullets", {}, () =>
                    t("bulk.items.done", { count: refillLimit }),
                  )
                }
              >
                {busy ? t("bulk.working") : t("bulk.items.action", { count: refillLimit })}
              </button>
            </footer>
            {isStorage ? (
              <p className="tools-note bulk-dialog__section">{t("bulk.infinite.inventoryOnly")}</p>
            ) : (
              <section className="bulk-dialog__section">
                <h3>{t("bulk.infinite.title")}</h3>
                <p>{t("bulk.infinite.summary")}</p>
                <p className="tools-note">
                  {t(infinite ? "bulk.infinite.on" : "bulk.infinite.off")}
                </p>
                <footer className="bulk-dialog__footer">
                  <p>{t("bulk.infinite.note")}</p>
                  <button
                    type="button"
                    className="control-button control-button--primary"
                    disabled={busy}
                    aria-busy={busy}
                    onClick={() =>
                      runBulk(
                        t(infinite ? "bulk.infinite.revisionOff" : "bulk.infinite.revisionOn"),
                        "set_infinite_consumables",
                        { enable: !infinite },
                        () => t(infinite ? "bulk.infinite.doneOff" : "bulk.infinite.doneOn"),
                      )
                    }
                  >
                    {busy
                      ? t("bulk.working")
                      : t(infinite ? "bulk.infinite.disable" : "bulk.infinite.enable")}
                  </button>
                </footer>
              </section>
            )}
          </div>
        ) : (
          <div className="bulk-dialog__weapons">
            <p>{t("bulk.weaponsSummary", { total: weapons.length, count: upgradable.length })}</p>
            {notUpgradable ? (
              <p className="tools-note">{t("bulk.weaponsSkipped", { count: notUpgradable })}</p>
            ) : null}
            <ul>
              {upgradable.slice(0, 12).map(({ article, type }) => (
                <li key={`${type}-${article.index}`}>
                  {article.info?.item_name} +{weaponLevel(article)} → +{MAX_WEAPON_LEVEL}
                </li>
              ))}
              {upgradable.length > 12 ? (
                <li>{t("bulk.andMore", { count: upgradable.length - 12 })}</li>
              ) : null}
            </ul>
            <footer className="bulk-dialog__footer">
              <p>{t("bulk.weaponsNote")}</p>
              <button
                type="button"
                className="control-button control-button--primary"
                disabled={busy || upgradable.length === 0}
                onClick={upgradeAllWeapons}
              >
                {busy ? t("bulk.working") : t("bulk.weaponsAction", { count: upgradable.length })}
              </button>
            </footer>
          </div>
        )}
        {status ? (
          <p className={`bulk-dialog__status bulk-dialog__status--${status.tone}`} role="status">
            {status.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default BulkActions;
