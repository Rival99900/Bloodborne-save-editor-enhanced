import { useContext, useState } from "react";
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [resetEpoch, setResetEpoch] = useState(0);
  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();

  function restoreStatsDraft(nextSave = save) {
    setEditedStats(cloneStats(nextSave.stats));
    setShowSuccess(false);
    setResetEpoch((current) => current + 1);
  }

  function resetStats() {
    restoreStatsDraft();
  }

  async function confirmStats() {
    try {
      const draft = cloneStats(editedStats);
      const updatedSave = await setSave(t("revision.statsUpdated"), async (current) => {
        for (const stat of draft) {
          const currentStat = current.stats.find((entry) => entry.name === stat.name);
          if (currentStat?.value !== stat.value) {
            await invoke("edit_stat", {
              relOffset: stat.rel_offset,
              length: stat.length,
              times: stat.times,
              value: Number.parseInt(stat.value, 10),
            });
          }
        }
        return { ...current, stats: draft };
      });
      if (updatedSave) {
        setEditedStats(cloneStats(updatedSave.stats));
        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Unable to update statistics.", error);
    }
  }

  return (
    <div
      key={resetEpoch}
      style={{
        alignContent: "center",
        gridColumn: "2/4",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "repeat(5, 50px)",
        gap: "0.8rem 0",
        alignItems: "center",
        justifyItems: "center",
        placeItems: "center",
        fontSize: "1.5rem",
        background: `url(${images.backgrounds["statsBg.png"].src})`,
        backgroundSize: "cover",
      }}
    >
      {editedStats
        .filter((stat) => !EDITABLE_STAT_NAMES.has(stat.name))
        .map((stat) => (
          <Stat
            editedStats={editedStats}
            setEditedStats={setEditedStats}
            key={stat.name}
            stat={stat}
          />
        ))}
      <div className="editor-action-row">
        <button className="control-button control-button--quiet" type="button" onClick={resetStats}>
          {t("actions.reset")}
        </button>
        <button className="control-button control-button--primary" type="button" onClick={confirmStats}>
          {t("actions.confirm")}
        </button>
      </div>
      {showSuccess ? (
        <StatusDialog
          title={t("actions.changesConfirmed")}
          closeLabel={t("saveFlow.close")}
          onClose={() => setShowSuccess(false)}
        />
      ) : null}
    </div>
  );
}

export default Stats;
