import { useContext, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  getGemFallbackPath,
  getGemPath,
  getRuneFallbackPath,
  getRunePath,
  getUnique,
} from "../utils/upgrades";
import { SaveContext } from "../context/context";
import { ItemsContext } from "../context/itemsContext";
import SelectSearch from "./SelectSearch";
import useDraw from "../utils/useDraw";
import GemPresetPanel from "./GemPresetPanel";

const NO_EFFECT_ID = 4294967295;
const EFFECT_SLOT_COUNT = 6;

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
  const {
    runeEffects,
    gemEffectCatalog,
    nativeGemEffectIds,
    runePresets,
    userGemPresets,
    saveUserGemPreset,
    deleteUserGemPreset,
  } = useContext(ItemsContext);
  const { drawCanvas } = useDraw();
  const { setSave } = useContext(SaveContext);
  const confirmInFlightRef = useRef(false);

  // A merged lookup (native gem effects + Caryll Rune effects) so a slot carrying a
  // rune-origin effect id — produced by other save-edit tools, or valid in-game data —
  // can still be found, re-selected, and described instead of silently going blank.
  const gemEffectCatalogById = useMemo(
    () => new Map(gemEffectCatalog.map((entry) => [Number(entry.value), entry])),
    [gemEffectCatalog],
  );

  const [edited, setEdited] = useState(JSON.parse(JSON.stringify(selected)));
  const {
    shape,
    effects,
    upgrade_type,
    info: { rating, level, name },
    source,
  } = edited;
  const [isConfirming, setIsConfirming] = useState(false);
  const [forgeOpen, setForgeOpen] = useState(false);
  const [presetName, setPresetName] = useState(() => `${selected.info?.name || "Custom"} Gem`);
  const [presetStatus, setPresetStatus] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // The primary effect can be a Caryll Rune id sitting in a Blood Gem slot (see the
  // catalog merge above). When that's the case there is no honest gem color for it,
  // so the preview should show the rune it actually corresponds to.
  const primaryEffectEntry =
    upgrade_type === "Gem" ? gemEffectCatalogById.get(Number(effects[0]?.[0])) : undefined;
  const primaryIsRuneOrigin =
    Boolean(primaryEffectEntry) && !nativeGemEffectIds.has(Number(effects[0]?.[0]));

  async function handleConfirm() {
    if (confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setIsConfirming(true);
    setConfirmError("");

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

      for (const [index, currentEffect] of effects.entries()) {
        const [id] = currentEffect;
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

      if (typeof confirmCb === "function") {
        // Equipped weapon slots own their visual state in the parent. Updating it only here
        // prevents the editor from briefly rendering a second/stale gem during confirmation.
        confirmCb(committedUpgrade);
      } else {
        setSelected(committedUpgrade);
        if (selectedRef?.current) {
          const ctx = selectedRef.current.getContext("2d");
          selectedRef.current.dataset.item = JSON.stringify(committedUpgrade);
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          await drawCanvas(ctx, committedUpgrade);
        }
      }

      setEditScreen(false);
    } catch (error) {
      // Surface it instead of failing silently — a rejected `invoke` previously left
      // Confirm looking like it did nothing at all, with no clue in the UI why.
      console.error("Unable to confirm the gem or rune edit.", error);
      setConfirmError(
        typeof error === "string" ? error : error?.message || "Unable to apply this change.",
      );
    } finally {
      confirmInFlightRef.current = false;
      setIsConfirming(false);
    }
  }

  function applyGemPreset({ preset, effects: presetEffects }) {
    if (upgrade_type !== "Gem" || !Array.isArray(presetEffects)) return;

    const normalizedEffects = Array.from({ length: EFFECT_SLOT_COUNT }, (_, index) => {
      const requestedId = Number(presetEffects[index]?.[0]);
      const entry = gemEffectCatalogById.get(requestedId);
      return entry ? [Number(entry.value), entry.label] : [NO_EFFECT_ID, "No Effect"];
    });
    const primary = normalizedEffects[0];
    const primaryEffect = gemEffectCatalogById.get(Number(primary[0]));

    setEdited((previous) => ({
      ...previous,
      shape: preset.shape ?? previous.shape,
      effects: normalizedEffects,
      info: {
        ...previous.info,
        ...preset.info,
        name: preset.info?.name ?? `${preset.name} Forge Gem`,
        effect: primary[1],
        rating: primaryEffect?.rating ?? previous.info.rating,
        level: primaryEffect?.level ?? previous.info.level,
        note: preset.info?.note ?? "Gem Forge preset using validated in-game effect IDs.",
      },
    }));
    setPresetName(preset.name || "Custom Forge Gem");
    setPresetStatus("");
    setForgeOpen(false);
  }

  function saveCurrentGemPreset() {
    if (upgrade_type !== "Gem") return;

    const saved = saveUserGemPreset({
      name: presetName,
      shape,
      effects,
      info: {
        ...edited.info,
        name: presetName.trim() || edited.info.name || "Custom Forge Gem",
        note: "Personal Gem Forge preset saved on this device.",
      },
    });

    setPresetName(saved.name);
    setPresetStatus(`Saved “${saved.name}” in My presets.`);
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
      // Conversion already writes a complete, valid six-slot upgrade in Rust. Closing
      // here prevents a second Confirm from reapplying the stale pre-conversion draft.
      setEditScreen(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div id="replaceScreen" className="upgrade-editor" role="dialog" aria-modal="true" aria-label="Edit gem or rune">
      {forgeOpen && upgrade_type === "Gem" ? (
        <GemPresetPanel
          gemEffects={gemEffectCatalog}
          userGemPresets={userGemPresets}
          onApply={applyGemPreset}
          onDeletePreset={deleteUserGemPreset}
          onClose={() => setForgeOpen(false)}
        />
      ) : null}
      <div className="upgrade-editor__layout">
        <div className="upgrade-editor__preview">
          <div>
            <span>Editing:</span>
            <div className="upgrade-editor__art-frame">
              <img
                className="upgrade-editor__art"
                src={
                  upgrade_type === "Gem"
                    ? getGemPath(
                        effects,
                        shape,
                        level,
                        getUnique(effects[0][0], shape, source),
                        primaryIsRuneOrigin ? primaryEffectEntry : undefined,
                      )
                    : getRunePath(name, shape, rating)
                }
                alt=""
                onError={(event) => {
                  const fallback =
                    upgrade_type === "Gem"
                      ? primaryIsRuneOrigin
                        ? getRuneFallbackPath()
                        : getGemFallbackPath()
                      : getRuneFallbackPath(shape);
                  if (!event.currentTarget.src.endsWith(fallback)) {
                    event.currentTarget.src = fallback;
                  }
                }}
              />
            </div>
          </div>
          <div className="upgrade-editor__actions">
            {upgrade_type === "Gem" ? (
              <>
                <button onClick={() => setForgeOpen(true)}>Gem Forge</button>
                <div className="upgrade-editor__preset-save">
                  <label>
                    <span>Preset name</span>
                    <input
                      value={presetName}
                      maxLength={60}
                      onChange={(event) => {
                        setPresetName(event.target.value);
                        setPresetStatus("");
                      }}
                      aria-label="Personal gem preset name"
                    />
                  </label>
                  <button onClick={saveCurrentGemPreset}>Save as preset</button>
                  {presetStatus ? <span className="upgrade-editor__preset-status">{presetStatus}</span> : null}
                </div>
              </>
            ) : null}
            {!equipped ? (
              <button onClick={transformUpgrade} disabled={isConfirming}>
                Convert to {upgrade_type === "Gem" ? "Rune" : "Gem"}
              </button>
            ) : null}
            <button onClick={() => setEditScreen(false)} disabled={isConfirming}>
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? "Confirming…" : "Confirm"}
            </button>
            {confirmError ? (
              <span className="upgrade-editor__confirm-error" role="alert">
                {confirmError}
              </span>
            ) : null}
          </div>
        </div>
        <div
          className={`upgrade-editor__effects-panel upgrade-editor__effects-panel--${upgrade_type.toLowerCase()}`}
        >
          <div className="upgrade-editor__info">
            {upgrade_type === "Gem" ? (
              <>
                <span
                  style={{
                    position: "absolute",
                    right: "0.9375rem",
                    top: "1.25rem",
                  }}
                >
                  {rating}
                </span>
                <SelectSearch
                  style={{
                    position: "absolute",
                    right: "0.9375rem",
                    top: "3.75rem",
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
                  onChange={(event) => {
                    const { label } = event;
                    setEdited((previous) => ({ ...previous, shape: label }));
                  }}
                />
              </>
            ) : (
              <SelectSearch
                style={{
                  position: "absolute",
                  right: "0.9375rem",
                  top: "1.25rem",
                  textAlign: "right",
                }}
                selected={shape}
                readOnly={true}
                options={[
                  { label: "-", value: 1 },
                  { label: "Oath", value: 2 },
                ]}
                onChange={(event) => {
                  const { label } = event;
                  setEdited((previous) => ({ ...previous, shape: label }));
                }}
              />
            )}
          </div>
          <div className="effects upgrade-editor__effects">
            {effects.map(([, effectName], index) => (
              <div className="effect" key={index}>
                <SelectSearch
                  defaultValue="No Effect"
                  onChange={(event) => {
                    const { name: effectOwnerName, level: effectLevel, rating: effectRating, value, label, note } = event;
                    setEdited((previous) => ({
                      ...previous,
                      effects: previous.effects.map((currentEffect, effectIndex) =>
                        effectIndex === index ? [Number(value), label] : currentEffect,
                      ),
                      info:
                        index === 0
                          ? {
                              ...previous.info,
                              effect: label,
                              note,
                              name: effectOwnerName,
                              level: effectLevel,
                              rating: effectRating,
                            }
                          : previous.info,
                    }));
                  }}
                  selected={effectName}
                  options={upgrade_type === "Gem" ? gemEffectCatalog : runeEffects}
                />
                <div className="line" aria-hidden="true" />
              </div>
            ))}
            {upgrade_type === "Rune" ? (
              <SelectSearch
                defaultValue="Select a rune preset"
                onChange={(event) => {
                  const { info, effects: presetEffects, shape: presetShape } = event;
                  if (upgrade_type !== "Rune" || !info?.name || !Array.isArray(presetEffects)) return;
                  setEdited((previous) => ({
                    ...previous,
                    info: {
                      ...previous.info,
                      ...info,
                    },
                    shape: presetShape,
                    effects: [...presetEffects],
                  }));
                }}
                selected=""
                options={runePresets}
              />
            ) : null}
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
