import "./character.css";
import { useContext, useEffect, useState } from "react";
import { SaveContext } from "../../context/context";
import Stat from "../../components/Stat";
import StatusDialog from "../../components/StatusDialog";
import { invoke } from "@tauri-apps/api/core";
import { ImagesContext } from "../../context/imagesContext";
import Playtime from "./Playtime";
import { represent } from "../../utils/playtime";
import CharacterInfo from "./CharacterInfo";
import Appearance from "./Appearance";
import IszGlitch from "./IszGlitch";
import Coordinates from "./Coordinates";
import Teleport from "./Teleport";
import { useLocalization } from "../../i18n/localization";

const cloneStats = (stats) => JSON.parse(JSON.stringify(stats));

function Character() {
  const { save, setSave } = useContext(SaveContext);
  const [username, setUsername] = useState(save.username.string);
  const [editedStats, setEditedStats] = useState(() => cloneStats(save.stats));
  const [editedPlaytime, setEditedPlaytime] = useState(save.playtime);
  const [editedCoordinates, setEditedCoordinates] = useState(() => ({ ...save.position.coordinates }));
  const [notice, setNotice] = useState(null);
  const [resetEpoch, setResetEpoch] = useState(0);
  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();

  function restoreCharacterDraft(nextSave = save) {
    setEditedStats(cloneStats(nextSave.stats));
    setEditedPlaytime(nextSave.playtime);
    setEditedCoordinates({ ...nextSave.position.coordinates });
    setUsername(nextSave.username.string);
    setResetEpoch((current) => current + 1);
  }

  function resetCharacter() {
    restoreCharacterDraft(save);
    setNotice({
      tone: "success",
      title: t("actions.resetCompleted"),
      description: t("characterForm.resetDescription"),
    });
  }

  // Undo/Redo and edits confirmed on another page replace the active save
  // snapshot. Update every local Character draft from that snapshot without
  // creating a new mutation or revision entry.
  useEffect(() => {
    restoreCharacterDraft(save);
  }, [save]);

  async function confirmCharacter() {
    try {
      const nextUsername = username.length > 0 ? username : save.username.string;
      const draftStats = cloneStats(editedStats);
      const draftCoordinates = { ...editedCoordinates };
      if (!username.length) setUsername(save.username.string);

      const changedStats = draftStats.filter((stat) => {
        const currentStat = save.stats.find((entry) => entry.name === stat.name);
        return currentStat?.value !== stat.value;
      });
      const usernameChanged = nextUsername !== save.username.string;
      const playtimeChanged = editedPlaytime !== save.playtime;
      const coordinatesChanged = ["x", "y", "z"].some(
        (axis) => Number(draftCoordinates[axis]) !== Number(save.position.coordinates?.[axis]),
      );

      // The confirmation dialog remains available for an unchanged form, but it
      // must not mark the save as dirty or add a no-op entry to Undo/Redo.
      if (!changedStats.length && !usernameChanged && !playtimeChanged && !coordinatesChanged) {
        setNotice({ tone: "success", title: t("actions.changesConfirmed") });
        return;
      }

      const updatedSave = await setSave(t("revision.characterUpdated"), async (current) => {
        for (const stat of changedStats) {
          await invoke("edit_stat", {
            relOffset: stat.rel_offset,
            length: stat.length,
            times: stat.times,
            value: Number.parseInt(stat.value, 10),
          });
        }

        if (usernameChanged) {
          await invoke("set_username", { newUsername: nextUsername });
        }
        if (playtimeChanged) {
          await invoke("set_playtime", { newPlaytime: represent(editedPlaytime) });
        }
        if (coordinatesChanged) {
          await invoke("edit_coordinates", {
            x: Number(draftCoordinates.x),
            y: Number(draftCoordinates.y),
            z: Number(draftCoordinates.z),
          });
        }

        return {
          ...current,
          position: coordinatesChanged
            ? { ...current.position, coordinates: draftCoordinates }
            : current.position,
          stats: changedStats.length ? draftStats : current.stats,
          playtime: playtimeChanged ? editedPlaytime : current.playtime,
          username: usernameChanged ? { ...current.username, string: nextUsername } : current.username,
        };
      });
      if (updatedSave) {
        setEditedStats(cloneStats(updatedSave.stats));
        setEditedPlaytime(updatedSave.playtime);
        setEditedCoordinates({ ...updatedSave.position.coordinates });
        setUsername(updatedSave.username.string);
        setNotice({ tone: "success", title: t("actions.changesConfirmed") });
      }
    } catch (error) {
      console.error("Unable to update character data.", error);
    }
  }

  return (
    <div
      key={resetEpoch}
      style={{
        gridColumn: "2/4",
        display: "grid",
        gridTemplateRows: "minmax(370px, 60vh) min-content",
        gap: "5rem",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        background: `url(${images.backgrounds["statsBg.png"].src})`,
        backgroundSize: "cover",
        position: "relative",
      }}
    >
      <div
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          height: "100%",
          paddingBottom: "2px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderBottom: "1px solid rgb(107, 95, 73)",
          }}
        >
          <label htmlFor="username">{t("characterForm.name")}</label>
          <input
            id="username"
            type="text"
            autoComplete="off"
            spellCheck="false"
            maxLength={16}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            style={{
              width: "17ch",
              padding: "5px",
              textAlign: "right",
              background: "none",
            }}
          />
        </div>
        <div id="currency" style={{ padding: "0 0px" }}>
          <Stat editedStats={editedStats} setEditedStats={setEditedStats} stat={editedStats.find((stat) => stat.name === "Echoes")} width="100%" />
          <Stat editedStats={editedStats} setEditedStats={setEditedStats} stat={editedStats.find((stat) => stat.name === "Insight")} width="100%" />
        </div>
        <div id="characterData">
          <CharacterInfo key={`character-info-${resetEpoch}`} editedStats={editedStats} setEditedStats={setEditedStats} />
          <Appearance onNotice={setNotice} />
          <IszGlitch />
          <Playtime key={`playtime-${resetEpoch}`} ms={editedPlaytime} setMs={setEditedPlaytime} />
          <Coordinates key={`coordinates-${resetEpoch}`} coordinates={editedCoordinates} setCoordinates={setEditedCoordinates} />
          <Teleport setSave={setSave} setEditedCoordinates={setEditedCoordinates} />
        </div>
      </div>
      <div className="editor-action-row">
        <button className="control-button control-button--quiet" type="button" onClick={resetCharacter}>
          {t("actions.reset")}
        </button>
        <button className="control-button control-button--primary" type="button" onClick={confirmCharacter}>
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

export default Character;
