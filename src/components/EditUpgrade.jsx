import { useContext, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getGemPath, getRunePath, getUnique } from "../utils/upgrades";
import { SaveContext } from "../context/context";
import { ItemsContext } from "../context/itemsContext";
import SelectSearch from "./SelectSearch";
import useDraw from "../utils/useDraw";
import GemPresetPanel from "./GemPresetPanel";

function EditUpgrade({
  setSelected,
  selected,
  setEditScreen,
  selectedRef,
  confirmCb,
  isStorage,
  equipped,
  slot,
}) {
  const { gemEffects, runeEffects, runePresets } = useContext(ItemsContext);
  const { drawCanvas } = useDraw();

  const [edited, setEdited] = useState(JSON.parse(JSON.stringify(selected)));
  const {
    shape,
    effects,
    upgrade_type,
    info: { effect, rating, level, name, note },
    source,
  } = edited;
  const { setSave, save } = useContext(SaveContext);
  const [readyToConfirm, setReadyToConfirm] = useState(false);
  const [forgeOpen, setForgeOpen] = useState(false);

  useEffect(() => {
    if (readyToConfirm) {
      handleConfirm();
    }
  }, [readyToConfirm]);

  async function handleConfirm(confirmCb) {
    try {
      const info = equipped
        ? {
            equipped: {
              articleType: equipped.article_type,
              articleIndex: equipped.index,
              slotIndex: slot,
            },
          }
        : {
            upgradeType: selected.upgrade_type,
            upgradeIndex: selected.index,
          };

      info.isStorage = isStorage;
      info.isGem = upgrade_type === "Gem";
      let updatedSave = null;
      if (shape !== selected.shape) {
        updatedSave = await invoke("edit_shape", {
          newShape: shape,
          info,
        });
      }

      for (const [index, effect] of effects.entries()) {
        const [id] = effect;
        if (Number(id) === Number(selected.effects[index]?.[0])) continue;

        updatedSave = await invoke("edit_effect", {
          newEffectId: Number(id),
          index,
          info,
        });
      }

      if (updatedSave) {
        setSave(updatedSave);
      }

      const committedUpgrade = JSON.parse(JSON.stringify(edited));
      setSelected(committedUpgrade);

      if (typeof confirmCb === "function") {
        confirmCb(committedUpgrade);
      } else if (selectedRef?.current) {
        const ctx = selectedRef.current.getContext("2d");
        selectedRef.current.dataset.item = JSON.stringify(committedUpgrade);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        await drawCanvas(ctx, committedUpgrade);
      }

      setEditScreen(false);
    } catch (error) {
      console.log(error);
    }
  }

  function applyGemPreset({ preset, effects: presetEffects }) {
    const primary = presetEffects[0];
    const primaryEffect = gemEffects.find((entry) => Number(entry.value) === Number(primary[0]));

    setEdited((previous) => ({
      ...previous,
      effects: presetEffects,
      info: {
        ...previous.info,
        name: `${preset.name} Forge Gem`,
        effect: primary[1],
        rating: primaryEffect?.rating ?? previous.info.rating,
        level: primaryEffect?.level ?? previous.info.level,
        note: "Gem Forge preset using validated in-game effect IDs.",
      },
    }));
    setForgeOpen(false);
  }

  async function transformUpgrade() {
    const sourceName = upgrade_type === "Gem" ? "gem" : "rune";
    const destinationName = upgrade_type === "Gem" ? "rune" : "gem";
    const accepted = window.confirm(
      `Convert this ${sourceName} into a ${destinationName}? Keep the automatic backup until you have tested the save.`,
    );
    if (!accepted) return;

    try {
      const result = await invoke("transform_upgrade", {
        upgradeType: upgrade_type,
        upgradeIndex: selected.index,
        isStorage,
      });
      setSave(result.save);
      setSelected(result.upgrade);
      setEdited(result.upgrade);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div id="replaceScreen" className="upgrade-editor" role="dialog" aria-modal="true" aria-label="Edit gem or rune">
      {forgeOpen && upgrade_type === "Gem" ? (
        <GemPresetPanel
          gemEffects={gemEffects}
          onApply={applyGemPreset}
          onClose={() => setForgeOpen(false)}
        />
      ) : null}
      <div
        className="upgrade-editor__layout"
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 5rem",
          height: "95%",
        }}
      >
        <div
          className="upgrade-editor__preview"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          {/* To replace */}
          <div>
            <span>Editing:</span>
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "375px",
                height: "375px",
                background: `url(/assets/gems/gem_bg.png)`,
                backgroundSize: "contain",
                borderRadius: "5px",
              }}
            >
              <img
                width={"373px"}
                style={{ borderRadius: "10px" }}
                src={
                  upgrade_type === "Gem"
                    ? getGemPath(
                        effects,
                        shape,
                        level,
                        getUnique(effects[0][0], shape, source),
                      )
                    : getRunePath(name, shape, rating)
                }
                alt=""
              />
            </div>
          </div>
          <div className="upgrade-editor__actions">
            {upgrade_type === "Gem" ? (
              <button onClick={() => setForgeOpen(true)} style={{ marginRight: "1rem" }}>
                Gem Forge
              </button>
            ) : null}
            {!equipped ? (
              <button onClick={transformUpgrade} style={{ marginRight: "1rem" }}>
                Convert to {upgrade_type === "Gem" ? "Rune" : "Gem"}
              </button>
            ) : null}
            <button
              onClick={() => setEditScreen(false)}
              style={{ marginRight: "50px" }}
            >
              Cancel
            </button>
            <button onClick={() => handleConfirm(confirmCb)}>Confirm</button>
          </div>
        </div>
        {/* List and input */}
        <div
          className="upgrade-editor__effects-panel"
          style={{
            position: "relative",
            marginTop: "20px",
            height: "95%",
            width: "371px",
            borderRadius: "0px",
            background: `url(/assets/${
              upgrade_type === "Gem"
                ? "gems/gem_effects_bg"
                : "runes/rune_effects_bg"
            }.png)`,
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            className="upgrade-info"
            style={{
              fontSize: "18px",
              userSelect: "none",
              color: "#b8b7ad",
            }}
          >
            {upgrade_type === "Gem" ? (
              <>
                <span
                  style={{
                    position: "absolute",
                    right: 15,
                    top: 20,
                  }}
                >
                  {rating}
                </span>
                <SelectSearch
                  style={{
                    position: "absolute",
                    right: 15,
                    top: 60,
                    textAlign: "right",
                  }}
                  selected={shape}
                  readOnly={true}
                  options={[
                    { label: "Radial", value: 1 },
                    { label: "Triangle", value: 2 },
                    { label: "Waning", value: 4 },
                    { label: "Circle", value: 8 },
                    { label: "Droplet", value: 64 },
                  ]}
                  onChange={(e) => {
                    const { label } = e;
                    setEdited((prevEdited) => {
                      const newEdited = { ...prevEdited };
                      newEdited.shape = label;

                      return newEdited;
                    });
                  }}
                />
              </>
            ) : (
              <SelectSearch
                style={{
                  position: "absolute",
                  right: 15,
                  top: 20,
                  textAlign: "right",
                }}
                selected={shape}
                readOnly={true}
                options={[
                  { label: "-", value: 1 },
                  { label: "Oath", value: 2 },
                ]}
                onChange={(e) => {
                  const { label } = e;
                  setEdited((prevEdited) => {
                    const newEdited = { ...prevEdited };
                    newEdited.shape = label;

                    return newEdited;
                  });
                }}
              />
            )}
          </div>
          <div
            className="effects"
            style={{
              fontSize: "18px",
              userSelect: "none",
              color: "#b8b7ad",
              position: "absolute",
              top: 180,
              left: 40,
              width: "calc(100% - 40px)",
            }}
          >
            {effects.map(([id, name], i) => (
              <div className="effect" key={`${id}-${i}`}>
                <SelectSearch
                  defaultValue={"No Effect"}
                  onChange={(e) => {
                    const { name, level, rating, value, label, note } = e;
                    setEdited((prevEdited) => ({
                      ...prevEdited,
                      effects: prevEdited.effects.map((currentEffect, effectIndex) =>
                        effectIndex === i ? [Number(value), label] : currentEffect,
                      ),
                      info:
                        i === 0
                          ? {
                              ...prevEdited.info,
                              effect: label,
                              note,
                              name,
                              level,
                              rating,
                            }
                          : prevEdited.info,
                    }));
                  }}
                  selected={name}
                  options={upgrade_type === "Gem" ? gemEffects : runeEffects}
                />
                <div
                  className="line"
                  style={{
                    position: "absolute",
                    left: -29,
                    width: "350px",
                    height: "1px",
                    background: `url(/assets/line.png)`,
                  }}
                ></div>
              </div>
            ))}
            {upgrade_type === "Rune" && (
              <SelectSearch
                defaultValue={"Select a rune preset"}
                onChange={async (e) => {
                  const { info, effects, shape } = e;
                  if (!info?.name) return;
                  setEdited((prevEdited) => {
                    const newEdited = { ...prevEdited };
                    newEdited.info = {
                      ...newEdited.info,
                      ...info,
                    };
                    newEdited.shape = shape;
                    newEdited.effects = [...effects];

                    return newEdited;
                  });
                  setReadyToConfirm(true);
                }}
                selected={""}
                options={runePresets}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditUpgrade;

/**
 * Tear Stone gem:
 * Source: F1 49 02 80
 * Primary Effect: F0 F6 2F 00
 * Shape: Droplet
 *
 * Gold Pendand gem:
 * Source: F2 49 02 80
 * Primary Effect: DF CF 2F 00
 * Shape: Radial
 *
 * Brooch gem:
 * Source: F0 49 02 80
 * Effects: BC B3 2F 00 | 54 77 2E 00
 * Shape: Droplet
 */
