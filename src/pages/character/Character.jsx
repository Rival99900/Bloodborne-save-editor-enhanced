import "./character.css";
import { useContext, useState } from "react";
import { SaveContext } from "../../context/context";
import Stat from "../../components/Stat";
import { invoke } from "@tauri-apps/api/core";
import { ImagesContext } from "../../context/imagesContext";
import Playtime from "./Playtime";
import { represent } from "../../utils/playtime";
import CharacterInfo from "./CharacterInfo";
import Appearance from "./Appearance";
import IszGlitch from "./IszGlitch";
import Coordinates from "./Coordinates";
import Teleport from "./Teleport";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useLocalization } from "../../i18n/localization";

function Character() {
  const { save, setSave } = useContext(SaveContext);
  const [username, setUsername] = useState(save.username.string);
  const [editedStats, setEditedStats] = useState(
    JSON.parse(JSON.stringify(save.stats)),
  );
  const [editedPlaytime, setEditedPlaytime] = useState(save.playtime);
  const [editedCoordinates, setEditedCoordinates] = useState(
    save.position.coordinates,
  );

  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();

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
            onChange={(e) => {
              setUsername(e.target.value);
            }}
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
            stat={save.stats.find((x) => x.name === "Echoes")}
            width={"100%"}
          />

          <Stat
            editedStats={editedStats}
            setEditedStats={setEditedStats}
            stat={save.stats.find((x) => x.name === "Insight")}
            width={"100%"}
          />
        </div>
        <div id="characterData">
          <CharacterInfo
            editedStats={editedStats}
            setEditedStats={setEditedStats}
          />
          {/* Appearance */}
          <Appearance />
          {/* Isz glitch */}
          <IszGlitch />
          <Playtime ms={editedPlaytime} setMs={setEditedPlaytime} />
          <Coordinates
            coordinates={editedCoordinates}
            setCoordinates={setEditedCoordinates}
          />
          <Teleport
            setSave={setSave}
            setEditedCoordinates={setEditedCoordinates}
          />
        </div>
      </div>
      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          justifySelf: "center",
          width: "100%",
        }}
      >
        <button
          className="btn-underline"
          style={{
            position: "relative",
            padding: "0 1rem",
          }}
          onClick={() => {
            setEditedStats(JSON.parse(JSON.stringify(save.stats)));
            setEditedPlaytime(save.playtime);
            setEditedCoordinates(save.position.coordinates);
            setUsername(save.username.string);
          }}
        >
          {t("actions.reset")}
        </button>

        <button
          className="btn-underline"
          style={{
            position: "relative",
            padding: "0 1rem",
          }}
          onClick={async () => {
            try {
              const nextUsername = username.length > 0 ? username : save.username.string;
              if (!username.length) setUsername(save.username.string);

              const updatedSave = await setSave(t("revision.characterUpdated"), async (current) => {
                for (const [index, stat] of editedStats.entries()) {
                  if (save.stats[index].value !== stat.value) {
                    await invoke("edit_stat", {
                      relOffset: stat.rel_offset,
                      length: stat.length,
                      times: stat.times,
                      value: Number.parseInt(stat.value, 10),
                    });
                  }
                }

                if (nextUsername !== save.username.string) {
                  await invoke("set_username", { newUsername: nextUsername });
                }
                await invoke("set_playtime", { newPlaytime: represent(editedPlaytime) });
                await invoke("edit_coordinates", {
                  x: Number(editedCoordinates.x),
                  y: Number(editedCoordinates.y),
                  z: Number(editedCoordinates.z),
                });

                return {
                  ...current,
                  position: { ...current.position, coordinates: JSON.parse(JSON.stringify(editedCoordinates)) },
                  stats: JSON.parse(JSON.stringify(editedStats)),
                  playtime: editedPlaytime,
                  username: { ...current.username, string: nextUsername },
                };
              });
              if (updatedSave) await dialog.message(t("actions.changesConfirmed"));
            } catch (error) {
              console.error("Unable to update character data.", error);
            }
          }}
        >
          {t("actions.confirm")}
        </button>
      </div>
    </div>
  );
}

export default Character;
