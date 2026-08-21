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
import { useLocalization } from "../i18n/localization";

const NO_EFFECT_ID = 4294967295;
const EFFECT_SLOT_COUNT = 6;
const GEM_SHAPE_OPTIONS = [
  { label: "Radial", value: 1 },
  { label: "Triangle", value: 2 },
  { label: "Waning", value: 4 },
  { label: "Circle", value: 8 },
  { label: "Droplet", value: 64 },
];
const RUNE_TYPE_OPTIONS = [
  { label: "-", value: 1 },
  { label: "Oath", value: 2 },
];

function normalizeUpgradeShape(shape, upgradeType) {
  const options = upgradeType === "Rune" ? RUNE_TYPE_OPTIONS : GEM_SHAPE_OPTIONS;
  const value = String(shape ?? "").trim();
  const matchingOption = options.find(
    (option) =>
      option.label.toLowerCase() === value.toLowerCase() || String(option.value) === value,
  );

  return matchingOption?.label ?? options[0].label;
}

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
  const { t } = useLocalization();
  const {
    gemEffectCatalog,
    nativeGemEffectIds,
    runePresets,
    userForgePresets,
    saveUserForgePreset,
    deleteUserForgePreset,
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

  const [edited, setEdited] = useState(() => {
    const draft = JSON.parse(JSON.stringify(selected));
    return {
      ...draft,
      shape: normalizeUpgradeShape(draft.shape, draft.upgrade_type),
    };
  });
  const {
    shape,
    effects,
    upgrade_type,
    info: { rating, level, name },
    source,
  } = edited;
  const [isConfirming, setIsConfirming] = useState(false);
  const [forgeOpen, setForgeOpen] = useState(false);
  // Rune presets are one-time actions; the field intentionally remains blank until chosen.
  const [runePresetSelection, setRunePresetSelection] = useState(null);
  // A personal preset is opt-in. Never present the current rune or gem name as a preset
  // that appears to have been selected automatically when the editor opens.
  const [presetName, setPresetName] = useState("");
  const [presetStatus, setPresetStatus] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const runeForgePresets = useMemo(
    () =>
      runePresets.map((preset, index) => ({
        id: `rune-forge-${index}`,
        category: "Rune",
        name: preset.label,
        description: preset.info?.note || "Validated Caryll Rune preset.",
        effectIds: preset.effects,
        info: preset.info,
        shape: preset.shape,
      })),
    [runePresets],
  );

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
        typeof error === "string" ? error : error?.message || t("forge.unableToApply"),
      );
    } finally {
      confirmInFlightRef.current = false;
      setIsConfirming(false);
    }
  }

  function applyForgePreset({ preset, effects: presetEffects }) {
    if (!Array.isArray(presetEffects)) return;

    const normalizedEffects = Array.from({ length: EFFECT_SLOT_COUNT }, (_, index) => {
      const requestedId = Number(presetEffects[index]?.[0]);
      const entry = gemEffectCatalogById.get(requestedId);
      return entry ? [Number(entry.value), entry.label] : [NO_EFFECT_ID, "No Effect"];
    });
    const primary = normalizedEffects[0];
    const primaryEffect = gemEffectCatalogById.get(Number(primary[0]));

    setEdited((previous) => ({
      ...previous,
      shape: normalizeUpgradeShape(preset.shape, upgrade_type),
      effects: normalizedEffects,
      info: {
        ...previous.info,
        ...preset.info,
        name: preset.info?.name ?? `${preset.name} Forge ${upgrade_type}`,
        effect: primary[1],
        rating: primaryEffect?.rating ?? preset.info?.rating ?? previous.info.rating,
        level: primaryEffect?.level ?? preset.info?.level ?? previous.info.level,
        note: preset.info?.note ?? `${upgrade_type} Forge preset using validated in-game effect IDs.`,
      },
    }));
    setPresetName(preset.name || `Custom Forge ${upgrade_type}`);
    setPresetStatus("");
    setForgeOpen(false);
  }

  function saveCurrentForgePreset() {
    const saved = saveUserForgePreset({
      name: presetName,
      sourceType: upgrade_type,
      shape,
      effects,
      info: {
        ...edited.info,
        name: presetName.trim() || edited.info.name || `Custom Forge ${upgrade_type}`,
        note: `Personal Forge preset saved from ${upgrade_type} Forge and shared with both forges.`,
      },
    });

    setPresetName(saved.name);
    setPresetStatus(t("forge.savedStatus", { name: saved.name }));
  }

  async function transformUpgrade() {
    const sourceName = upgrade_type === "Gem" ? "gem" : "rune";
    const destinationName = upgrade_type === "Gem" ? "rune" : "gem";
    const accepted = window.confirm(
      t("forge.convertConfirm", { source: sourceName, destination: destinationName }),
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
    <div id="replaceScreen" className="upgrade-editor" role="dialog" aria-modal="true" aria-label={t("forge.dialogLabel", { subject: upgrade_type })}>
      {forgeOpen ? (
        <GemPresetPanel
          gemEffects={gemEffectCatalog}
          userGemPresets={userForgePresets}
          onApply={applyForgePreset}
          onDeletePreset={deleteUserForgePreset}
          onClose={() => setForgeOpen(false)}
          forgeType={upgrade_type.toLowerCase()}
          builtInPresets={upgrade_type === "Gem" ? undefined : runeForgePresets}
        />
      ) : null}
      <div className="upgrade-editor__layout">
        <div className="upgrade-editor__preview">
          <div>
            <span>{t("forge.editing")}</span>
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
            <>
                <button onClick={() => setForgeOpen(true)}>
                  {upgrade_type === "Gem" ? t("forge.gemForge") : t("forge.runeForge")}
                </button>
                <div className="upgrade-editor__preset-save">
                  <label>
                    <span>{t("forge.presetName")}</span>
                    <input
                      value={presetName}
                      maxLength={60}
                      onChange={(event) => {
                        setPresetName(event.target.value);
                        setPresetStatus("");
                      }}
                      aria-label={t("forge.personalPresetName", { subject: upgrade_type.toLowerCase() })}
                    />
                  </label>
                  <button onClick={saveCurrentForgePreset}>{t("forge.saveAsPreset")}</button>
                  {presetStatus ? <span className="upgrade-editor__preset-status">{presetStatus}</span> : null}
                </div>
              </>
            {!equipped ? (
              <button onClick={transformUpgrade} disabled={isConfirming}>
                {t("forge.convertTo", { subject: upgrade_type === "Gem" ? "Rune" : "Gem" })}
              </button>
            ) : null}
            <button onClick={() => setEditScreen(false)} disabled={isConfirming}>
              {t("forge.cancel")}
            </button>
            <button onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? t("forge.confirming") : t("forge.confirm")}
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
                    width: "8.25rem",
                    textAlign: "right",
                  }}
                  selected={shape}
                  readOnly={true}
                  options={GEM_SHAPE_OPTIONS}
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
                  width: "8.25rem",
                  textAlign: "right",
                }}
                selected={shape}
                readOnly={true}
                options={RUNE_TYPE_OPTIONS}
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
                  defaultValue={t("forge.noEffect")}
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
                  options={gemEffectCatalog}
                />
                <div className="line" aria-hidden="true" />
              </div>
            ))}
            {upgrade_type === "Rune" ? (
              <SelectSearch
                key={`rune-preset-${runePresetSelection ?? "empty"}`}
                defaultValue={t("forge.runePresetPlaceholder")}
                onChange={(event) => {
                  const { info, effects: presetEffects, shape: presetShape } = event;
                  if (upgrade_type !== "Rune" || !info?.name || !Array.isArray(presetEffects)) return;
                  setEdited((previous) => ({
                    ...previous,
                    info: {
                      ...previous.info,
                      ...info,
                    },
                    shape: normalizeUpgradeShape(presetShape, "Rune"),
                    effects: [...presetEffects],
                  }));
                  // Presets are immediate one-time actions, not a persistent field value.
                  setRunePresetSelection(null);
                }}
                selected={runePresetSelection}
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
