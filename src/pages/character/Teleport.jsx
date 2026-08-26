import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLocalization } from "../../i18n/localization";
import DarkSelect from "../../components/DarkSelect";

const locations = [
  ["Hunter's Dream", "Hunter's Dream", -8, -6, -18, [21, 0]],
  ["Yharnam Headstone", "1st Floor Sickroom", -199.74, -50.759, 179.42, [24, 1]],
  ["Yharnam Headstone", "Central Yharnam", -193.4, -28.646, 68.5, [24, 1]],
  ["Yharnam Headstone", "Great Bridge", -124.488, -27.021, 64.673, [24, 1]],
  ["Yharnam Headstone", "Tomb of Oedon", -33.811, -40.722, 87.303, [24, 1]],
  ["Yharnam Headstone", "Cathedral Ward", 16.775, -9.511, 103.27, [24, 0]],
  ["Yharnam Headstone", "Grand Cathedral Ward", 67.808, 35.713, 339.689, [24, 0]],
  ["Yharnam Headstone", "Upper Cathedral Ward", -24.643, 40.621, 250.57, [24, 2]],
  ["Yharnam Headstone", "Lumenflower Gardens", 45.335, 51.403, 300.35, [24, 2]],
  ["Yharnam Headstone", "Altar of Despair", 114.86, 4.443, 425.02, [24, 2]],
  ["Yharnam Headstone", "Old Yharnam", 126.4, -65.214, 36, [23, 0]],
  ["Yharnam Headstone", "Church of the Good Chalice", -139.979, -126.664, 57.359, [23, 0]],
  ["Yharnam Headstone", "Graveyard of the Darkbeast", 111.86, -120.783, -65.249, [23, 0]],
  ["Frontier Headstone", "Hemwick Charnel Lane", -172, -22, 485.5, [22, 0]],
  ["Frontier Headstone", "Witch's Abode", -336.3, 2.4, 733, [22, 0]],
  ["Frontier Headstone", "Forbidden Woods", -190, -76.3, 252, [27, 0]],
  ["Frontier Headstone", "Forbidden Grave", -335, -186.5, 479, [27, 0]],
  ["Frontier Headstone", "Byrgenwerth", -400.4, -180.8, 414.6, [32, 0]],
  ["Unseen Headstone", "Yahar'gul, Unseen Village", 257.4, -51.4, 70, [28, 0]],
  ["Unseen Headstone", "Yahar'gul Chapel", 260.4, -88, -55.6, [28, 0]],
  ["Unseen Headstone", "Advent Plaza", 418.8, -123.6, -253.4, [28, 0]],
  ["Unseen Headstone", "Hypogean Gaol", 219.6, -97.6, -78.8, [28, 0]],
  ["Unseen Headstone", "Forsaken Castle Cainhurst", -4.5, 33.8, -187.9, [25, 0]],
  ["Unseen Headstone", "Logarius' Seat", 47.8, 111.8, -350.4, [25, 0]],
  ["Unseen Headstone", "Vileblood Queen's Chamber", 122.4, 129, -455, [25, 0]],
  ["Unseen Headstone", "Abandoned Old Workshop", 129.8, -19.9, 140.8, [21, 1]],
  ["Nightmare Headstone", "Lecture Building", -472.37, -185.25, 594.9, [32, 0]],
  ["Nightmare Headstone", "Lecture Building 2nd Floor", -444.22, -177.25, 514.19, [32, 0]],
  ["Nightmare Headstone", "Nightmare Frontier", 0.35, 1500, 0, [33, 0]],
  ["Nightmare Headstone", "Nightmare of Mensis", -104.65, 1462.28, -42.65, [33, 0]],
  ["Nightmare Headstone", "Mergo's Loft: Base", 84.58, 986.7, -0.37, [26, 0]],
  ["Nightmare Headstone", "Mergo's Loft: Middle", 136.69, 1061.26, -14.86, [26, 0]],
  ["Nightmare Headstone", "Wet Nurse's Lunarium", 140.72, 1124.3, -37.98, [26, 0]],
  ["Hunter's Nightmare Headstone", "Hunter's Nightmare", -481.68, 1490.49, -497.73, [34, 0]],
  ["Hunter's Nightmare Headstone", "Nightmare Church", -434.08, 1503.18, -594.52, [34, 0]],
  ["Hunter's Nightmare Headstone", "Nightmare Grand Cathedral", -433.09, 1535.71, -261.57, [34, 0]],
  ["Hunter's Nightmare Headstone", "Underground Corpse Pile", -406.81, 1503.79, -743, [34, 0]],
  ["Hunter's Nightmare Headstone", "Research Hall", -318.67, 1553.02, -824.22, [35, 0]],
  ["Hunter's Nightmare Headstone", "Lumenwood Garden", -432.15, 1593, -824.37, [35, 0]],
  ["Hunter's Nightmare Headstone", "Astral Clocktower", -454.88, 1595.57, -824.44, [35, 0]],
  ["Hunter's Nightmare Headstone", "Fishing Hamlet", -619.2, 1594.3, -817.2, [36, 0]],
  ["Hunter's Nightmare Headstone", "Lighthouse Hut", -645.2, 1614.66, -867.2, [36, 0]],
  ["Hunter's Nightmare Headstone", "Coast", -695.2, 1577.27, -943.2, [36, 0]],
].map(([group, name, x, y, z, mapId], index) => ({
  value: String(index),
  label: name,
  group,
  area: group === name ? group : group.replace(/ Headstone$/, ""),
  node: group === name ? "" : name,
  location: { x, y, z, mapId },
}));

function Teleport({ setSave, setEditedCoordinates }) {
  const { t } = useLocalization();
  const [selectedLocation, setSelectedLocation] = useState("");

  async function handleChange(value, option) {
    const { x, y, z, mapId } = option.location;
    try {
      const updatedSave = await setSave(t("revision.characterUpdated"), async (current) => {
        await invoke("teleport", option.location);
        return {
          ...current,
          position: {
            coordinates: { x, y, z },
            loaded_map: mapId,
          },
        };
      });
      if (updatedSave) {
        setSelectedLocation(value);
        setEditedCoordinates({ x, y, z });
      }
    } catch (error) {
      console.error("Unable to teleport the character.", error);
    }
  }

  return (
    <div className="teleport-control">
      <span>{t("characterForm.teleport")}</span>
      <DarkSelect
        className="teleport-select"
        ariaLabel={t("characterForm.teleport")}
        options={locations}
        value={selectedLocation}
        placeholder={t("characterForm.selectLocation")}
        renderValue={(option) => option.node || option.area}
        renderOption={(option, isSelected) => (
          <span className="teleport-option">
            <span className="teleport-option__title">{option.group}</span>
            <span className="teleport-option__area">{option.area}</span>
            {option.node ? <span className="teleport-option__node">{option.node}</span> : null}
            {isSelected ? <span className="dark-select__selected" aria-hidden="true">✓</span> : null}
          </span>
        )}
        onChange={handleChange}
      />
    </div>
  );
}

export default Teleport;
