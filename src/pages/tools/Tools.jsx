import "./tools.css";
import { useContext, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as dialog from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { SaveContext } from "../../context/context";
import { ItemsContext } from "../../context/itemsContext";
import { ImagesContext } from "../../context/imagesContext";
import { useLocalization } from "../../i18n/localization";
import ConfirmDialog from "../../components/ConfirmDialog";
import { HUNTER_TOOLS, isLeftHandFamily, trophyProgress } from "../../utils/trophies";
import KNOWN_OFFSETS from "./knownOffsets";

function TrophyList({ title, owned, total, rows, description }) {
  const { t } = useLocalization();
  const done = owned === total;
  return (
    <section className={`trophy-card ${done ? "is-done" : ""}`}>
      <header>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <strong>{done ? t("tools.trophies.complete") : `${owned} / ${total}`}</strong>
      </header>
      <ul>
        {rows.map((row) => (
          <li key={row.key} className={row.owned ? "is-owned" : "is-missing"}>
            <span aria-hidden="true">{row.owned ? "✓" : "○"}</span>
            {row.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Trophies() {
  const { save, setSave } = useContext(SaveContext);
  const { weapons = [], items = [] } = useContext(ItemsContext);
  const { t } = useLocalization();
  const [confirm, setConfirm] = useState(null);
  const [status, setStatus] = useState(null);
  const progress = useMemo(() => trophyProgress(save), [save]);
  const nameOf = (list, id) => list.find((entry) => Number(entry.id) === Number(id))?.info?.item_name ?? String(id);

  const weaponRows = progress.weapons.map((weapon) => ({ key: weapon.id, owned: weapon.owned, name: nameOf(weapons, weapon.id) }));
  const toolRows = progress.tools.map((tool) => ({ key: tool.id, owned: tool.owned, name: nameOf(items, tool.id) }));
  const missingWeapons = progress.weapons.filter((weapon) => !weapon.owned);
  const missingTools = progress.tools.filter((tool) => !tool.owned);

  async function addMissing(kind) {
    setConfirm(null); setStatus(null);
    const list = kind === "tools" ? missingTools : missingWeapons;
    try {
      const updated = await setSave(t("tools.trophies.addedRevision", { count: list.length }), async () => {
        let latest = null;
        for (const entry of list) {
          if (kind === "tools") {
            latest = await invoke("add_item", { id: entry.id, quantity: 1, isStorage: false });
          } else {
            const result = await invoke("add_direct_equipment", { id: entry.id, isArmor: false, experimentalConfirmed: true, isStorage: false });
            latest = result.save;
          }
        }
        return latest;
      });
      if (updated) setStatus({ tone: "success", text: t("tools.trophies.added", { count: list.length }) });
    } catch (error) {
      console.error("Unable to add the missing entries.", error);
      setStatus({ tone: "error", text: t("tools.trophies.addFailed") });
    }
  }

  return (
    <div className="tools-trophies">
      <p className="tools-lead">{t("tools.trophies.lead")}</p>
      <div className="trophy-grid">
        <TrophyList
          title="Hunter's Essence"
          description={t("tools.trophies.essence")}
          owned={weaponRows.filter((row) => row.owned).length}
          total={weaponRows.length}
          rows={[...weaponRows.filter((row) => !isLeftHandFamily(row.key)), ...weaponRows.filter((row) => isLeftHandFamily(row.key))]}
        />
        <div className="trophy-column">
          <TrophyList
            title="Hunter's Craft"
            description={t("tools.trophies.craft")}
            owned={toolRows.filter((row) => row.owned).length}
            total={HUNTER_TOOLS.length}
            rows={toolRows}
          />
          <section className={`trophy-card ${progress.weaponMaster.done ? "is-done" : ""}`}>
            <header>
              <div>
                <h2>Weapon Master</h2>
                <p>{t("tools.trophies.master")}</p>
              </div>
              <strong>{progress.weaponMaster.done ? t("tools.trophies.complete") : `+${progress.weaponMaster.level} / +10`}</strong>
            </header>
          </section>
        </div>
      </div>
      <div className="tools-actions">
        <button type="button" className="control-button control-button--quiet" disabled={missingTools.length === 0} onClick={() => setConfirm("tools")}>
          {t("tools.trophies.addTools", { count: missingTools.length })}
        </button>
        <button type="button" className="control-button control-button--quiet" disabled={missingWeapons.length === 0} onClick={() => setConfirm("weapons")}>
          {t("tools.trophies.addWeapons", { count: missingWeapons.length })}
        </button>
      </div>
      <p className="tools-note">{t("tools.trophies.note")}</p>
      {status ? <p className={`bulk-dialog__status bulk-dialog__status--${status.tone}`} role="status">{status.text}</p> : null}
      {confirm ? (
        <ConfirmDialog
          title={t(confirm === "tools" ? "tools.trophies.confirmToolsTitle" : "tools.trophies.confirmWeaponsTitle")}
          description={t(confirm === "tools" ? "tools.trophies.confirmTools" : "tools.trophies.confirmWeapons")}
          confirmLabel={t("tools.trophies.confirmAdd")}
          cancelLabel={t("unsaved.cancel")}
          onConfirm={() => addMissing(confirm)}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}

const COMPARE_ERRORS = {
  "npcErrors.invalidSave": "tools.compare.errors.invalidSave",
  "npcErrors.identity": "tools.compare.errors.identity",
  "npcErrors.region": "tools.compare.errors.region",
  "npcErrors.tooDifferent": "tools.compare.errors.tooDifferent",
};

const toHex = (value) => `0x${value.toString(16).toUpperCase().padStart(2, "0")}`;
const toBits = (value) => value.toString(2).padStart(8, "0");

function Compare({ currentPath }) {
  const { t } = useLocalization();
  const [paths, setPaths] = useState({ before: currentPath ?? "", after: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function choose(which) {
    const path = await dialog.open({ multiple: false, title: t(`tools.compare.choose.${which}`) });
    if (path) setPaths((current) => ({ ...current, [which]: path }));
  }

  async function compare() {
    setBusy(true); setError(""); setResult(null);
    try {
      const differences = await invoke("compare_npc_flag_regions", { beforePath: paths.before, afterPath: paths.after });
      setResult(differences);
    } catch (compareError) {
      setError(t(COMPARE_ERRORS[String(compareError)] ?? "tools.compare.errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function exportJson() {
    const path = await dialog.save({ defaultPath: "bloodborne-flag-differences.json", filters: [{ name: "JSON", extensions: ["json"] }] });
    if (!path) return;
    const payload = {
      format: "bloodborne-save-editor.flag-differences.v1",
      before: paths.before,
      after: paths.after,
      differences: result.map((entry) => ({ ...entry, known: KNOWN_OFFSETS.get(entry.rel_offset) ?? null })),
    };
    await writeTextFile(path, `${JSON.stringify(payload, null, 2)}\n`);
  }

  return (
    <div className="tools-compare">
      <p className="tools-lead">{t("tools.compare.lead")}</p>
      {["before", "after"].map((which) => (
        <div key={which} className="compare-file">
          <span className="compare-file__label">{t(`tools.compare.${which}`)}</span>
          <span className="compare-file__path" title={paths[which]}>{paths[which] || t("tools.compare.noFile")}</span>
          <button type="button" className="control-button control-button--quiet" onClick={() => choose(which)}>{t("tools.compare.browse")}</button>
        </div>
      ))}
      <div className="tools-actions">
        <button type="button" className="control-button control-button--primary" disabled={busy || !paths.before || !paths.after} onClick={compare}>
          {t("tools.compare.run")}
        </button>
        {result?.length ? (
          <button type="button" className="control-button control-button--quiet" onClick={exportJson}>{t("tools.compare.export")}</button>
        ) : null}
      </div>
      {error ? <p className="bulk-dialog__status bulk-dialog__status--error" role="alert">{error}</p> : null}
      {result ? (
        result.length === 0 ? <p className="tools-note">{t("tools.compare.identical")}</p> : (
          <div className="compare-table-wrap">
            <p className="tools-note">{t("tools.compare.count", { count: result.length })}</p>
            <table className="compare-table">
              <thead>
                <tr>
                  <th>{t("tools.compare.offset")}</th>
                  <th>{t("tools.compare.before")}</th>
                  <th>{t("tools.compare.after")}</th>
                  <th>{t("tools.compare.bits")}</th>
                  <th>{t("tools.compare.known")}</th>
                </tr>
              </thead>
              <tbody>
                {result.map((entry) => (
                  <tr key={entry.rel_offset}>
                    <td>{entry.rel_offset}</td>
                    <td><code>{toHex(entry.before_value)}</code> <small>{toBits(entry.before_value)}</small></td>
                    <td><code>{toHex(entry.after_value)}</code> <small>{toBits(entry.after_value)}</small></td>
                    <td><code>{toBits(entry.before_value ^ entry.after_value)}</code></td>
                    <td>{KNOWN_OFFSETS.get(entry.rel_offset) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
      <p className="tools-note">{t("tools.compare.npcHint")}</p>
    </div>
  );
}

// F3 (trophy assistant) and F4 (flag comparison between two saves).
function Tools({ currentPath }) {
  const { t } = useLocalization();
  const [tab, setTab] = useState("trophies");
  const { images } = useContext(ImagesContext) ?? {};
  // Same parchment background as the Flags and Patch pages.
  const background = images?.backgrounds?.["statsBg.webp"]?.src ?? "/assets/itemsBg/statsBg.webp";
  return (
    <div className="tools-workspace" style={{ backgroundImage: `url(${background})` }}>
      <header className="flags-workspace__header">
        <p>{t("tools.eyebrow")}</p>
        <h1>{t("tools.title")}</h1>
        <span>{t("tools.description")}</span>
      </header>
      <div className="bulk-dialog__tabs" role="tablist">
        {["trophies", "compare"].map((name) => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} className={`control-button control-button--quiet ${tab === name ? "is-active" : ""}`} onClick={() => setTab(name)}>
            {t(`tools.tab.${name}`)}
          </button>
        ))}
      </div>
      {tab === "trophies" ? <Trophies /> : <Compare currentPath={currentPath} />}
    </div>
  );
}

export default Tools;
