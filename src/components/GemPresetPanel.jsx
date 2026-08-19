import { useMemo, useState } from "react";
import SelectSearch from "./SelectSearch";

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

function GemPresetPanel({ gemEffects, userGemPresets = [], onApply, onDeletePreset, onClose }) {
  const [category, setCategory] = useState("All");
  const [mode, setMode] = useState("presets");
  const [customEffects, setCustomEffects] = useState(() =>
    Array(EFFECT_SLOTS).fill(NO_EFFECT_ID),
  );

  const effectById = useMemo(
    () => new Map(gemEffects.map((effect) => [Number(effect.value), effect])),
    [gemEffects],
  );
  const effectByLabel = useMemo(
    () => new Map(gemEffects.map((effect) => [normalizeEffectLabel(effect.label), effect])),
    [gemEffects],
  );
  const categories = ["All", "Attack", "Elemental", "Recovery", "Experimental"];
  const visiblePresets = GEM_PRESETS.filter(
    (preset) => category === "All" || preset.category === category,
  );

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
          ? [Number(resolved.value), resolved.label]
          : [NO_EFFECT_ID, "No Effect"];
      });
  }

  function formatEffects(effectIds) {
    return resolveEffects(effectIds)
      .filter(([id]) => id !== NO_EFFECT_ID)
      .map(([, label]) => label)
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
        description: "Personal Gem Forge preset stored on this device.",
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
        id: "custom-forge",
        category: "Custom",
        name: "Custom Forge Gem",
        description: `Custom set with ${activeCount} selected effect${activeCount > 1 ? "s" : ""}.`,
      },
      effects: resolveEffects(customEffects),
    });
  }

  function deletePreset(preset) {
    if (window.confirm(`Delete the personal preset “${preset.name}”?`)) {
      onDeletePreset?.(preset.id);
    }
  }

  return (
    <div className="gem-forge" role="dialog" aria-modal="true" aria-label="Gem Forge presets">
      <div className="gem-forge__header">
        <div>
          <p className="gem-forge__eyebrow">Gem Forge</p>
          <h2>Validated effects and custom sets</h2>
        </div>
        <button className="gem-forge__close" onClick={onClose} aria-label="Close Gem Forge">
          Close
        </button>
      </div>

      <p className="gem-forge__notice">
        Loading a preset only updates the visible draft. Select <strong>Confirm</strong> in the
        editor to write it to the save. Every effect below comes from the editor’s embedded gem
        catalogue. The strongest known durability effect is applied where relevant; no fictional
        “infinite durability” identifier is written.
      </p>

      <div className="gem-forge__modes" aria-label="Gem Forge mode">
        <button className={mode === "presets" ? "is-active" : ""} onClick={() => setMode("presets")}>
          Presets
        </button>
        <button className={mode === "custom" ? "is-active" : ""} onClick={() => setMode("custom")}>
          Custom set
        </button>
        <button className={mode === "personal" ? "is-active" : ""} onClick={() => setMode("personal")}>
          My presets {userGemPresets.length ? `(${userGemPresets.length})` : ""}
        </button>
      </div>

      {mode === "presets" ? (
        <>
          <div className="gem-forge__filters" aria-label="Preset categories">
            {categories.map((entry) => (
              <button
                key={entry}
                className={entry === category ? "is-active" : ""}
                onClick={() => setCategory(entry)}
              >
                {entry}
              </button>
            ))}
          </div>

          <div className="gem-forge__grid">
            {visiblePresets.map((preset) => (
              <article className="gem-forge__card" key={preset.id}>
                <span>{preset.category}</span>
                <h3>{preset.name}</h3>
                <p>{preset.description}</p>
                <small>{formatEffects(preset.effectIds)}</small>
                <button onClick={() => applyPreset(preset)}>Load into draft</button>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {mode === "custom" ? (
        <section className="gem-forge__custom" aria-label="Custom gem effect set">
          <div>
            <span className="gem-forge__eyebrow">Custom set</span>
            <h3>Build a six-effect gem</h3>
            <p>
              Choose up to six known gem effects. Empty slots stay as <em>No Effect</em>. The
              editor validates every selected ID again when you confirm.
            </p>
          </div>

          <div className="gem-forge__custom-grid">
            {customEffects.map((effectId, index) => (
              <label key={index}>
                <span>Effect {index + 1}</span>
                <SelectSearch
                  selected={effectById.get(effectId)?.label ?? "No Effect"}
                  defaultValue="No Effect"
                  options={gemEffects}
                  onChange={(option) => changeCustomEffect(index, option)}
                />
              </label>
            ))}
          </div>

          <div className="gem-forge__custom-preview">
            <span>Draft preview</span>
            <p>{formatEffects(customEffects) || "Choose at least one effect to load a custom draft."}</p>
          </div>

          <button className="gem-forge__apply-custom" onClick={applyCustom}>
            Load custom set into draft
          </button>
        </section>
      ) : null}

      {mode === "personal" ? (
        <section className="gem-forge__personal" aria-label="Personal gem presets">
          <div className="gem-forge__personal-header">
            <div>
              <span className="gem-forge__eyebrow">My presets</span>
              <h3>Saved gems on this device</h3>
              <p>Use “Save as preset” in the editor to keep any edited gem here.</p>
            </div>
          </div>

          {userGemPresets.length ? (
            <div className="gem-forge__grid">
              {userGemPresets.map((preset) => (
                <article className="gem-forge__card gem-forge__card--personal" key={preset.id}>
                  <span>Personal</span>
                  <h3>{preset.name}</h3>
                  <p>{preset.info?.note || "Personal Gem Forge preset."}</p>
                  <small>{formatEffects(preset.effects.map(([id]) => id))}</small>
                  <div className="gem-forge__card-actions">
                    <button onClick={() => applySavedPreset(preset)}>Load into draft</button>
                    <button className="gem-forge__delete" onClick={() => deletePreset(preset)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="gem-forge__empty-personal">
              <p>No personal preset has been saved yet.</p>
              <span>Edit a gem, then use <strong>Save as preset</strong> before confirming it.</span>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default GemPresetPanel;
