import CharacterPresets from "../../components/CharacterPresets";
import { useContext, useEffect, useState, useRef } from "react";
import { SaveContext } from "../../context/context";
import Stat from "../../components/Stat";
import StatusDialog from "../../components/StatusDialog";
import { invoke } from "@tauri-apps/api/core";
import { ImagesContext } from "../../context/imagesContext";
import { useLocalization } from "../../i18n/localization";

const cloneStats = (stats) => JSON.parse(JSON.stringify(stats));
const EDITABLE_STAT_NAMES = new Set(["Echoes", "Insight", "Voice", "Gender", "Ng", "Origin"]);

function Stats() {
  const { save, setSave } = useContext(SaveContext);
  const [editedStats, setEditedStats] = useState(() => cloneStats(save.stats));
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [resetEpoch, setResetEpoch] = useState(0);
  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();

  function restoreStatsDraft(nextSave = save) {
    setEditedStats(cloneStats(nextSave.stats));
    setResetEpoch((current) => current + 1);
  }

  function resetStats() {
    restoreStatsDraft(save);
    setNotice({
      tone: "success",
      title: t("actions.resetCompleted"),
      description: t("stats.resetDescription"),
    });
  }

  // A save can change after Undo/Redo or after another page confirms a
  // mutation. Keep the local draft aligned with that active snapshot without
  // recording an additional change.
  useEffect(() => {
    restoreStatsDraft(save);
  }, [save]);

  async function confirmStats() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const draft = cloneStats(editedStats);
      const changedStats = draft.filter((stat) => {
        const currentStat = save.stats.find((entry) => entry.name === stat.name);
        return currentStat?.value !== stat.value;
      });

      // Confirming an untouched draft is harmless, but it must not create an
      // undo entry or mark the active save as dirty.
      if (changedStats.length === 0) {
        setNotice({ tone: "success", title: t("actions.changesConfirmed") });
        return;
      }

      if (changedStats.some(stat => !Number.isInteger(stat.value) || stat.value < 0 || stat.value > 2_000_000_000)) throw new Error("Invalid stat value");
      const updatedSave = await setSave(t("revision.statsUpdated"), async (current) => {
        for (const stat of changedStats) {
          await invoke("edit_stat", {
            relOffset: stat.rel_offset,
            length: stat.length,
            times: stat.times,
            value: Number.parseInt(stat.value, 10),
          });
        }
        const values = new Map(changedStats.map(stat => [stat.name, stat.value]));
        return { ...current, stats: current.stats.map(stat => values.has(stat.name) ? {...stat, value: values.get(stat.name)} : stat) };
      });
      if (updatedSave) {
        setEditedStats(cloneStats(updatedSave.stats));
        setNotice({ tone: "success", title: t("actions.changesConfirmed") });
      }
    } catch (error) {
      console.error("Unable to update statistics.", error);
      setNotice({tone: "error", title: t("presets.applyFailed")});
    } finally {
      busyRef.current = false; setBusy(false);
    }
  }

  return (
    <div
      className="stats-workspace"
      key={resetEpoch}
      style={{
        alignContent: "start",
        gridColumn: "2/4",
        display: "flex",
        flexDirection: "column",

        gap: "0.8rem 0",
        alignItems: "stretch",
        justifyItems: "center",

        fontSize: "1.5rem",
        background: `url(${images.backgrounds["statsBg.png"].src})`,
        backgroundSize: "cover",
      }}
    >
      <CharacterPresets stats={editedStats} onLoad={setEditedStats} disabled={busy}/>
      <div className="stats-fields">
      {editedStats
        .filter((stat) => !EDITABLE_STAT_NAMES.has(stat.name))
        .map((stat) => (
          <Stat
            editedStats={editedStats}
            setEditedStats={setEditedStats}
            key={`${resetEpoch}-${stat.name}`}
            stat={stat}
            disabled={busy}
          />
        ))}
      </div>
      <div className="editor-action-row stats-actions">
        <button className="control-button control-button--quiet" type="button" disabled={busy} onClick={resetStats}>
          {t("actions.reset")}
        </button>
        <button className="control-button control-button--primary" type="button" disabled={busy} onClick={confirmStats}>
          {t("actions.confirm")}
        </button>
      </div>
      {notice ? (
        <StatusDialog
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
          closeLabel={t("saveFlow.close")}
          onClose={() => setNotice(null)}
        />
      ) : null}
    </div>
  );
}

export default Stats;
