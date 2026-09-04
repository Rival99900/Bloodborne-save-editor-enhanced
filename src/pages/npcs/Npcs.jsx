import { useContext, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { basename } from "@tauri-apps/api/path";
import * as dialog from "@tauri-apps/plugin-dialog";
import DarkSelect from "../../components/DarkSelect";
import { ImagesContext } from "../../context/imagesContext";
import { useLocalization } from "../../i18n/localization";

const NPCS = [
  { key: "plainDoll", automatic: true },
  { key: "eileen" },
  { key: "alfred" },
  { key: "djura" },
  { key: "arianna" },
  { key: "adella" },
  { key: "chapelDweller" },
  { key: "iosefka" },
  { key: "gilbert" },
  { key: "patches" },
  { key: "valtr" },
  { key: "simon" },
];

function formatByte(value) {
  return `0x${Number(value).toString(16).toUpperCase().padStart(2, "0")}`;
}

function NpcRow({ npc }) {
  const { t } = useLocalization();
  const localizedName = t(`npcNames.${npc.key}`);
  const options = useMemo(
    () => [
      { label: t("bosses.alive"), value: "alive" },
      { label: t("bosses.dead"), value: "dead" },
    ],
    [t],
  );

  return (
    <article className="npc-row">
      <div>
        <strong>{localizedName}</strong>
        <span>{npc.automatic ? t("npcs.automaticNote") : t("npcs.unverifiedNote")}</span>
      </div>
      <DarkSelect
        className="boss-status-select"
        ariaLabel={`${localizedName} ${t("bosses.alive")} / ${t("bosses.dead")}`}
        options={options}
        value={npc.automatic ? "alive" : "unverified"}
        placeholder={t("npcs.unverified")}
        disabled
      />
    </article>
  );
}

function Npcs() {
  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();
  const [snapshots, setSnapshots] = useState({ before: null, after: null });
  const [differences, setDifferences] = useState(null);
  const [error, setError] = useState("");
  const [comparing, setComparing] = useState(false);

  async function chooseSnapshot(kind) {
    const path = await dialog.open({ multiple: false, title: t(`npcs.${kind}Reference`) });
    if (!path) return;
    setSnapshots((current) => ({ ...current, [kind]: { path, name: "…" } }));
    const name = await basename(path);
    setSnapshots((current) => ({ ...current, [kind]: { path, name } }));
    setDifferences(null);
    setError("");
  }

  async function compareSnapshots() {
    if (!snapshots.before || !snapshots.after) return;
    setComparing(true);
    setError("");
    try {
      const result = await invoke("compare_npc_flag_regions", {
        beforePath: snapshots.before.path,
        afterPath: snapshots.after.path,
      });
      setDifferences(result);
    } catch (comparisonError) {
      setDifferences(null);
      setError(String(comparisonError ?? t("npcs.compareFailed")));
    } finally {
      setComparing(false);
    }
  }

  return (
    <div
      className="npc-workspace"
      style={{ backgroundImage: `url(${images.backgrounds["statsBg.png"].src})` }}
    >
      <header className="npc-workspace__header">
        <p>{t("npcs.eyebrow")}</p>
        <h1>{t("npcs.title")}</h1>
        <span>{t("npcs.lead")}</span>
      </header>

      <section className="npc-list" aria-label={t("npcs.title")}>
        {NPCS.map((npc) => <NpcRow key={npc.key} npc={npc} />)}
      </section>

      <section className="npc-lab" aria-labelledby="npc-lab-title">
        <p className="npc-lab__eyebrow">{t("npcs.labEyebrow")}</p>
        <h2 id="npc-lab-title">{t("npcs.labTitle")}</h2>
        <p>{t("npcs.labLead")}</p>
        <div className="npc-lab__files">
          {(["before", "after"]).map((kind) => (
            <button key={kind} type="button" onClick={() => chooseSnapshot(kind)}>
              <span>{t(`npcs.${kind}Reference`)}</span>
              <strong>{snapshots[kind]?.name ?? t("npcs.chooseSave")}</strong>
            </button>
          ))}
        </div>
        <button
          className="npc-lab__compare"
          type="button"
          disabled={!snapshots.before || !snapshots.after || comparing}
          onClick={compareSnapshots}
        >
          {comparing ? t("npcs.comparing") : t("npcs.compare")}
        </button>
        {error ? <p className="npc-lab__error" role="alert">{error}</p> : null}
        {differences ? (
          <div className="npc-differences">
            <p>{differences.length ? t("npcs.candidateCount", { count: differences.length }) : t("npcs.noDifference")}</p>
            {differences.length ? (
              <div className="npc-differences__table" role="table" aria-label={t("npcs.candidates")}>
                {differences.map((difference) => (
                  <div key={difference.rel_offset} role="row">
                    <code>+{difference.rel_offset}</code>
                    <code>{formatByte(difference.before_value)}</code>
                    <span aria-hidden="true">→</span>
                    <code>{formatByte(difference.after_value)}</code>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Npcs;
