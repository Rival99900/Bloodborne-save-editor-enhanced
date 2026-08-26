import { useMemo, useState } from "react";
import * as dialog from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import SelectSearch from "./SelectSearch";
import ConfirmDialog from "./ConfirmDialog";
import { useLocalization } from "../i18n/localization";

const NO_EFFECT_ID = 4294967295;
const EFFECT_SLOTS = 6;

function normalizeEffectLabel(label) {
  return String(label ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, " ");
}

const GEM_PRESETS = [
  {
    id: "apex-physical",
    category: "Attack",
    name: "Apex Physical",
    description: "Physical damage, full-health pressure and durability support.",
    effectIds: [165620, 151620, 146620],
  },
  {
    id: "apex-nourishing",
    category: "Attack",
    name: "Apex Nourishing",
    description: "All-damage amplification with full-health pressure and recovery.",
    effectIds: [127620, 151620, 143620],
  },
  {
    id: "bloodtinge-hunter",
    category: "Attack",
    name: "Bloodtinge Hunter",
    description: "High Bloodtinge damage with all-damage and recovery support.",
    effectIds: [122620, 127620, 143620],
  },
  {
    id: "blunt-breaker",
    category: "Attack",
    name: "Blunt Breaker",
    description: "High blunt damage with all-damage and durability support.",
    effectIds: [120620, 127620, 146620],
  },
  {
    id: "thrust-specialist",
    category: "Attack",
    name: "Thrust Specialist",
    description: "High thrust damage with all-damage and durability support.",
    effectIds: [121620, 127620, 146620],
  },
  {
    id: "all-damage-vanguard",
    category: "Attack",
    name: "Vanguard",
    description: "All-damage amplification with physical pressure and a high recovery bonus.",
    effectIds: [127620, 165620, 156620],
  },
  {
    id: "arcane-surge",
    category: "Elemental",
    name: "Arcane Surge",
    description: "Arcane damage with recovery and durability support.",
    effectIds: [123620, 143620, 146620],
  },
  {
    id: "flame-surge",
    category: "Elemental",
    name: "Flame Surge",
    description: "Fire damage with all-damage and recovery support.",
    effectIds: [124620, 127620, 143620],
  },
  {
    id: "bolt-surge",
    category: "Elemental",
    name: "Bolt Surge",
    description: "Bolt damage with all-damage and durability support.",
    effectIds: [125620, 127620, 146620],
  },
  {
    id: "elemental-ascendant",
    category: "Elemental",
    name: "Elemental Ascendant",
    description: "Arcane, fire and bolt effects in one deliberately experimental loadout.",
    effectIds: [123620, 124620, 125620],
  },
  {
    id: "sustained-hunt",
    category: "Recovery",
    name: "Sustained Hunt",
    description: "Recovery, durability and all-damage support for long exploration sessions.",
    effectIds: [143620, 146620, 127620],
  },
  {
    id: "abyssal-vitality",
    category: "Recovery",
    name: "Abyssal Vitality +75",
    description: "Uses the embedded +75 continuous HP recovery effect with durability and damage support.",
    effectIds: [156620, 146620, 127620],
  },
  {
    id: "forged-endurance",
    category: "Recovery",
    name: "Forged Endurance",
    description: "The strongest known bundled durability bonus paired with high recovery and physical damage.",
    effectIds: [146620, 156620, 165620],
  },
  {
    id: "last-stand",
    category: "Experimental",
    name: "Last Stand",
    description: "High near-death and full-health multipliers. Keep this loadout offline.",
    effectIds: [152620, 151620, 143620],
  },
  {
    id: "glass-cannon",
    category: "Experimental",
    name: "Glass Cannon",
    description: "Stacks physical, all-damage and near-death multipliers for testing only.",
    effectIds: [165620, 127620, 152620],
  },
  {
    id: "endless-hunt",
    category: "Experimental",
    name: "Endless Hunt",
    description: "Maximum known recovery and durability effects with a full-health damage bonus.",
    effectIds: [156620, 146620, 151620],
  },
];

const GEM_PRESET_IDS = new Set(GEM_PRESETS.map((preset) => preset.id));

function GemPresetPanel({
  gemEffects,
  userGemPresets = [],
  onApply,
  onDeletePreset,
  onDuplicatePreset,
  onExportPresets,
  onImportPresets,
  onClose,
  forgeType = "gem",
  builtInPresets = GEM_PRESETS,
}) {
  const { t } = useLocalization();
  const isRuneForge = forgeType === "rune";
  const subject = isRuneForge ? "Rune" : "Gem";
  const [category, setCategory] = useState("All");
  const [mode, setMode] = useState("presets");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [libraryStatus, setLibraryStatus] = useState("");
  const [isLibraryBusy, setIsLibraryBusy] = useState(false);
  const [customEffects, setCustomEffects] = useState(() =>
    Array(EFFECT_SLOTS).fill(NO_EFFECT_ID),
  );

  const effectById = useMemo(
    () => new Map(gemEffects.map((effect) => [Number(effect.value), effect])),
    [gemEffects],
  );
  const effectByLabel = useMemo(
    () => new Map(gemEffects.flatMap((effect) => [
      [normalizeEffectLabel(effect.label), effect],
      [normalizeEffectLabel(effect.sourceLabel), effect],
    ])),
    [gemEffects],
  );
  const categories = [
    "All",
    ...Array.from(new Set(builtInPresets.map((preset) => preset.category).filter(Boolean))),
  ];
  const visiblePresets = builtInPresets.filter(
    (preset) => category === "All" || preset.category === category,
  );

  function categoryLabel(value) {
    return t(`forge.categories.${value}`);
  }

  function localizedPresetText(preset) {
    if (GEM_PRESET_IDS.has(preset.id)) {
      return {
        name: t(`forge.builtIn.${preset.id}.name`),
        description: t(`forge.builtIn.${preset.id}.description`),
      };
    }
    if (String(preset.id).startsWith("rune-forge-")) {
      return { name: preset.name, description: t("forge.runePresetDescription") };
    }
    return { name: preset.name, description: preset.description };
  }

  function personalDescription(preset) {
    const stored = String(preset.info?.note ?? "").trim();
    return /^(Personal Forge preset|Preset de forge personnel|__personal_forge_preset__)/i.test(stored)
      ? t("forge.personalPresetDescription")
      : stored || t("forge.personalPresetDescription");
  }

  function resolveEffects(effectEntries) {
    return [...effectEntries, ...Array(EFFECT_SLOTS).fill(NO_EFFECT_ID)]
      .slice(0, EFFECT_SLOTS)
      .map((entry) => {
        const [storedId, storedLabel] = Array.isArray(entry) ? entry : [entry, ""];
        const resolved =
          effectById.get(Number(storedId)) ?? effectByLabel.get(normalizeEffectLabel(storedLabel));

        // A personal preset may come from a previous editor version. Its old ID is
        // never written back unless it is still in the embedded gem catalogue.
        return resolved
          ? [Number(resolved.value), resolved.sourceLabel ?? resolved.label]
          : [NO_EFFECT_ID, "No Effect"];
      });
  }

  function formatEffects(effectIds) {
    return resolveEffects(effectIds)
      .filter(([id]) => id !== NO_EFFECT_ID)
      .map(([id, label]) => effectById.get(Number(id))?.label ?? label)
      .join(" · ");
  }

  function applyPreset(preset) {
    onApply({ preset, effects: resolveEffects(preset.effectIds) });
  }

  function applySavedPreset(preset) {
    onApply({
      preset: {
        ...preset,
        category: "Personal",
        description: t("forge.personalPresetDescription"),
      },
      effects: resolveEffects(preset.effects),
    });
  }

  function changeCustomEffect(index, option) {
    setCustomEffects((previous) =>
      previous.map((effectId, effectIndex) =>
        effectIndex === index ? Number(option.value) : effectId,
      ),
    );
  }

  function applyCustom() {
    const activeCount = customEffects.filter((id) => id !== NO_EFFECT_ID).length;
    if (!activeCount) return;

    onApply({
      preset: {
        id: `custom-forge-${forgeType}`,
        category: "Custom",
        name: t("forge.customName", { subject }),
        description: t("forge.customDescription", { count: activeCount }),
      },
      effects: resolveEffects(customEffects),
    });
  }

  function deletePreset(preset) {
    setPendingDelete(preset);
  }

  function confirmDeletePreset() {
    if (pendingDelete) onDeletePreset?.(pendingDelete.id);
    setPendingDelete(null);
  }

  function duplicatePreset(preset) {
    const duplicate = onDuplicatePreset?.(preset.id);
    if (duplicate) setLibraryStatus(t("forge.duplicateCreated", { name: duplicate.name }));
  }

  async function exportPresets() {
    if (!onExportPresets) return;
    try {
      setIsLibraryBusy(true);
      setLibraryStatus("");
      const path = await dialog.save({
        title: t("forge.exportTitle"),
        defaultPath: "bloodborne-forge-presets.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return;
      await writeTextFile(path, `${JSON.stringify(onExportPresets(), null, 2)}\n`);
      setLibraryStatus(t("forge.exportedStatus"));
    } catch (error) {
      console.error("Unable to export Forge presets.", error);
      setLibraryStatus(t("forge.libraryFailed"));
    } finally {
      setIsLibraryBusy(false);
    }
  }

  async function importPresets() {
    if (!onImportPresets) return;
    try {
      setIsLibraryBusy(true);
      setLibraryStatus("");
      const path = await dialog.open({
        title: t("forge.importTitle"),
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return;
      const payload = JSON.parse(await readTextFile(path));
      const imported = onImportPresets(payload);
      setLibraryStatus(t("forge.importedStatus", { count: imported }));
    } catch (error) {
      console.error("Unable to import Forge presets.", error);
      setLibraryStatus(t("forge.libraryFailed"));
    } finally {
      setIsLibraryBusy(false);
    }
  }

  return (
    <>
      {pendingDelete ? (
        <ConfirmDialog
          title={t("forge.delete")}
          description={t("forge.deleteConfirm", { name: pendingDelete.name })}
          confirmLabel={t("forge.delete")}
          tone="danger"
          onConfirm={confirmDeletePreset}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
      <div className="gem-forge" role="dialog" aria-modal="true" aria-label={t("forge.modeLabel", { subject })}>
      <div className="gem-forge__header">
        <div>
          <p className="gem-forge__eyebrow">{isRuneForge ? t("forge.runeForge") : t("forge.gemForge")}</p>
          <h2>{t("forge.title")}</h2>
        </div>
        <button className="gem-forge__close" onClick={onClose} aria-label={t("forge.closeLabel", { subject })}>
          {t("forge.close")}
        </button>
      </div>

      <p className="gem-forge__notice">{t("forge.notice")}</p>

      <div className="gem-forge__modes" aria-label={t("forge.modeLabel", { subject })}>
        <button className={mode === "presets" ? "is-active" : ""} onClick={() => setMode("presets")}>
          {t("forge.presets")}
        </button>
        <button className={mode === "custom" ? "is-active" : ""} onClick={() => setMode("custom")}>
          {t("forge.customSet")}
        </button>
        <button className={mode === "personal" ? "is-active" : ""} onClick={() => setMode("personal")}>
          {t("forge.myPresets")} {userGemPresets.length ? `(${userGemPresets.length})` : ""}
        </button>
      </div>

      {mode === "presets" ? (
        <>
          <div className="gem-forge__filters" aria-label={t("forge.presetCategories")}>
            {categories.map((entry) => (
              <button
                key={entry}
                className={entry === category ? "is-active" : ""}
                onClick={() => setCategory(entry)}
              >
                {categoryLabel(entry)}
              </button>
            ))}
          </div>

          <div className="gem-forge__grid">
            {visiblePresets.map((preset) => {
              const copy = localizedPresetText(preset);
              return (
              <article className="gem-forge__card" key={preset.id}>
                <span>{categoryLabel(preset.category)}</span>
                <h3>{copy.name}</h3>
                <p>{copy.description}</p>
                <small>{formatEffects(preset.effectIds)}</small>
                <button onClick={() => applyPreset(preset)}>{t("forge.loadIntoDraft")}</button>
              </article>
              );
            })}
          </div>
        </>
      ) : null}

      {mode === "custom" ? (
          <section className="gem-forge__custom" aria-label={t("forge.customSetLabel", { subject: subject.toLowerCase() })}>
          <div>
            <span className="gem-forge__eyebrow">{t("forge.customSet")}</span>
            <h3>{t("forge.buildSixEffect", { subject: subject.toLowerCase() })}</h3>
            <p>{t("forge.customSetDescription")}</p>
          </div>

          <div className="gem-forge__custom-grid">
            {customEffects.map((effectId, index) => (
              <label key={index}>
                <span>{t("forge.effect", { index: index + 1 })}</span>
                <SelectSearch
                  selected={effectById.get(effectId)?.label ?? t("forge.noEffect")}
                  defaultValue={t("forge.noEffect")}
                  options={gemEffects}
                  onChange={(option) => changeCustomEffect(index, option)}
                />
              </label>
            ))}
          </div>

          <div className="gem-forge__custom-preview">
            <span>{t("forge.draftPreview")}</span>
            <p>{formatEffects(customEffects) || t("forge.draftEmpty")}</p>
          </div>

          <button className="gem-forge__apply-custom" onClick={applyCustom}>
            {t("forge.loadCustomDraft")}
          </button>
        </section>
      ) : null}

      {mode === "personal" ? (
        <section className="gem-forge__personal" aria-label={t("forge.personalPresetsLabel", { subject: subject.toLowerCase() })}>
          <div className="gem-forge__personal-header">
            <div>
              <span className="gem-forge__eyebrow">{t("forge.myPresets")}</span>
              <h3>{t("forge.sharedPresetsTitle")}</h3>
              <p>{t("forge.sharedPresetsDescription")}</p>
            </div>
            <div className="gem-forge__library-actions">
              <button onClick={importPresets} disabled={isLibraryBusy}>{t("forge.importPresets")}</button>
              <button onClick={exportPresets} disabled={isLibraryBusy || !userGemPresets.length}>{t("forge.exportPresets")}</button>
            </div>
          </div>
          {libraryStatus ? <p className="gem-forge__library-status" role="status">{libraryStatus}</p> : null}

          {userGemPresets.length ? (
            <div className="gem-forge__grid">
              {userGemPresets.map((preset) => (
                <article className="gem-forge__card gem-forge__card--personal" key={preset.id}>
                  <span>{t("forge.personal")}</span>
                  <h3>{preset.name}</h3>
                  <p>{personalDescription(preset)}</p>
                  <small>{formatEffects(preset.effects.map(([id]) => id))}</small>
                  <div className="gem-forge__card-actions">
                    <button onClick={() => applySavedPreset(preset)}>{t("forge.loadIntoDraft")}</button>
                    <button onClick={() => duplicatePreset(preset)}>{t("forge.duplicate")}</button>
                    <button className="gem-forge__delete" onClick={() => deletePreset(preset)}>
                      {t("forge.delete")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="gem-forge__empty-personal">
              <p>{t("forge.noPersonalPreset")}</p>
              <span>{t("forge.noPersonalPresetDescription")}</span>
            </div>
          )}
        </section>
      ) : null}
      </div>
    </>
  );
}

export default GemPresetPanel;
