import "./character.css";
import { useContext, useState } from "react";
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
  const [showSuccess, setShowSuccess] = useState(false);
  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();

  function resetCharacter() {
    setEditedStats(cloneStats(save.stats));
    setEditedPlaytime(save.playtime);
    setEditedCoordinates({ ...save.position.coordinates });
    setUsername(save.username.string);
  }

  async function confirmCharacter() {
    try {
      const nextUsername = username.length > 0 ? username : save.username.string;
      const draftStats = cloneStats(editedStats);
      const draftCoordinates = { ...editedCoordinates };
      if (!username.length) setUsername(save.username.string);

      const updatedSave = await setSave(t("revision.characterUpdated"), async (current) => {
        for (const stat of draftStats) {
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

        if (nextUsername !== current.username.string) {
          await invoke("set_username", { newUsername: nextUsername });
        }
        await invoke("set_playtime", { newPlaytime: represent(editedPlaytime) });
        await invoke("edit_coordinates", {
          x: Number(draftCoordinates.x),
          y: Number(draftCoordinates.y),
          z: Number(draftCoordinates.z),
        });

        return {
          ...current,
          position: { ...current.position, coordinates: draftCoordinates },
          stats: draftStats,
          playtime: editedPlaytime,
          username: { ...current.username, string: nextUsername },
        };
      });
      if (updatedSave) {
        setEditedStats(cloneStats(updatedSave.stats));
        setEditedPlaytime(updatedSave.playtime);
        setEditedCoordinates({ ...updatedSave.position.coordinates });
        setUsername(updatedSave.username.string);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Unable to update character data.", error);
    }
  }

  return (
    <div
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
          <CharacterInfo editedStats={editedStats} setEditedStats={setEditedStats} />
          <Appearance />
          <IszGlitch />
          <Playtime ms={editedPlaytime} setMs={setEditedPlaytime} />
          <Coordinates coordinates={editedCoordinates} setCoordinates={setEditedCoordinates} />
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

export default Character;
