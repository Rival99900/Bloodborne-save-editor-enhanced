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
import LampControl, { LAMPS } from "./LampControl";
import { useLocalization } from "../../i18n/localization";

const cloneStats = (stats) => JSON.parse(JSON.stringify(stats));

function Character() {
  const { save, setSave } = useContext(SaveContext);
  const [username, setUsername] = useState(save.username.string);
  const [editedStats, setEditedStats] = useState(() => cloneStats(save.stats));
  const [editedPlaytime, setEditedPlaytime] = useState(save.playtime);
  const [editedCoordinates, setEditedCoordinates] = useState(() => ({
    ...save.position.coordinates,
  }));
  const [notice, setNotice] = useState(null);
  const [resetEpoch, setResetEpoch] = useState(0);
  // Lamps: state read from the save, and the draft edited until Confirm.
  const [savedLamps, setSavedLamps] = useState([]);
  const [lampDraft, setLampDraft] = useState([]);
  const [lampError, setLampError] = useState(null);
  // Teleport destination chosen in the list: applied with Confirm, like the rest.
  const [pendingTeleport, setPendingTeleport] = useState(null);
  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();

  function restoreCharacterDraft(nextSave = save) {
    setEditedStats(cloneStats(nextSave.stats));
    setEditedPlaytime(nextSave.playtime);
    setEditedCoordinates({ ...nextSave.position.coordinates });
    setUsername(nextSave.username.string);
    setLampDraft(savedLamps);
    setPendingTeleport(null);
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

  // The lamp bits live in the backend save: read them again after every
  // change of the active save (open, Undo/Redo, Confirm).
  useEffect(() => {
    let active = true;
    invoke("get_lamp_flags")
      .then((states) => {
        if (!active) return;
        setSavedLamps(states);
        setLampDraft(states);
        setLampError(null);
      })
      .catch((error) => {
        if (active) setLampError(String(error));
      });
    return () => {
      active = false;
    };
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
      const teleport = pendingTeleport;
      const baseCoordinates = teleport
        ? { x: teleport.x, y: teleport.y, z: teleport.z }
        : save.position.coordinates;
      const coordinatesChanged = ["x", "y", "z"].some(
        (axis) => Number(draftCoordinates[axis]) !== Number(baseCoordinates?.[axis]),
      );

      const lampChanges = LAMPS.filter(
        (lamp) => lampDraft.length && lampDraft[lamp.index] !== savedLamps[lamp.index],
      ).map((lamp) => ({ eventFlag: lamp.eventFlag, enabled: Boolean(lampDraft[lamp.index]) }));

      // The confirmation dialog remains available for an unchanged form, but it
      // must not mark the save as dirty or add a no-op entry to Undo/Redo.
      if (
        !changedStats.length &&
        !usernameChanged &&
        !playtimeChanged &&
        !coordinatesChanged &&
        !lampChanges.length &&
        !teleport
      ) {
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
        if (lampChanges.length) {
          await invoke("set_lamp_flags", { changes: lampChanges });
        }
        if (teleport) {
          await invoke("teleport", teleport);
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
          position: {
            ...current.position,
            ...(teleport ? { loaded_map: teleport.mapId } : {}),
            coordinates:
              coordinatesChanged || teleport ? draftCoordinates : current.position.coordinates,
          },
          stats: changedStats.length ? draftStats : current.stats,
          playtime: playtimeChanged ? editedPlaytime : current.playtime,
          username: usernameChanged
            ? { ...current.username, string: nextUsername }
            : current.username,
        };
      });
      if (updatedSave) {
        setEditedStats(cloneStats(updatedSave.stats));
        setEditedPlaytime(updatedSave.playtime);
        setEditedCoordinates({ ...updatedSave.position.coordinates });
        setUsername(updatedSave.username.string);
        setPendingTeleport(null);
        setNotice({ tone: "success", title: t("actions.changesConfirmed") });
      }
    } catch (error) {
      console.error("Unable to update character data.", error);
    }
  }

  return (
    <div
      key={resetEpoch}
      className="character-workspace"
      style={{
        background: `url(${images.backgrounds["statsBg.webp"].src})`,
        backgroundSize: "cover",
        position: "relative",
      }}
    >
      <div className="character-fields">
        <div className="character-detail-row character-name-row">
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
          <Stat
            editedStats={editedStats}
            setEditedStats={setEditedStats}
            stat={editedStats.find((stat) => stat.name === "Echoes")}
            width="100%"
            borderless
          />
          <Stat
            editedStats={editedStats}
            setEditedStats={setEditedStats}
            stat={editedStats.find((stat) => stat.name === "Insight")}
            width="100%"
            borderless
          />
        </div>
        <div id="characterData">
          <CharacterInfo
            key={`character-info-${resetEpoch}`}
            editedStats={editedStats}
            setEditedStats={setEditedStats}
          />
          <Appearance onNotice={setNotice} />
          <IszGlitch />
          <Playtime key={`playtime-${resetEpoch}`} ms={editedPlaytime} setMs={setEditedPlaytime} />
          <Coordinates
            key={`coordinates-${resetEpoch}`}
            coordinates={editedCoordinates}
            setCoordinates={setEditedCoordinates}
          />
          <Teleport
            key={`teleport-${resetEpoch}`}
            pending={pendingTeleport}
            onSelect={(location) => {
              setPendingTeleport(location);
              setEditedCoordinates({ x: location.x, y: location.y, z: location.z });
            }}
          />
          <LampControl
            draft={lampDraft}
            saved={savedLamps}
            setDraft={setLampDraft}
            error={lampError}
          />
        </div>
      </div>
      <div className="editor-action-row">
        <button
          className="control-button control-button--quiet"
          type="button"
          onClick={resetCharacter}
        >
          {t("actions.reset")}
        </button>
        <button
          className="control-button control-button--primary"
          type="button"
          onClick={confirmCharacter}
        >
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
