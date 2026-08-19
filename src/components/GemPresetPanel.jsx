import { useMemo, useState } from "react";

const NO_EFFECT_ID = 4294967295;

const GEM_PRESETS = [
  {
    id: "apex-physical",
    category: "Attack",
    name: "Apex Physical",
    description: "Physical damage, full-health pressure and weapon durability.",
    effectIds: [165620, 151620, 146220],
  },
  {
    id: "apex-nourishing",
    category: "Attack",
    name: "Apex Nourishing",
    description: "All damage, full-health pressure and regeneration.",
    effectIds: [127620, 151620, 143620],
  },
  {
    id: "bloodtinge-hunter",
    category: "Attack",
    name: "Bloodtinge Hunter",
    description: "High Bloodtinge damage with all-damage support.",
    effectIds: [122620, 127620, 143620],
  },
  {
    id: "blunt-breaker",
    category: "Attack",
    name: "Blunt Breaker",
    description: "High blunt damage with all-damage and durability support.",
    effectIds: [120620, 127620, 146220],
  },
  {
    id: "thrust-specialist",
    category: "Attack",
    name: "Thrust Specialist",
    description: "High thrust damage with all-damage support.",
    effectIds: [121620, 127620, 146220],
  },
  {
    id: "arcane-surge",
    category: "Elemental",
    name: "Arcane Surge",
    description: "Arcane damage with regeneration and durability support.",
    effectIds: [123620, 143620, 146220],
  },
  {
    id: "flame-surge",
    category: "Elemental",
    name: "Flame Surge",
    description: "Fire damage with all-damage and regeneration support.",
    effectIds: [124620, 127620, 143620],
  },
  {
    id: "bolt-surge",
    category: "Elemental",
    name: "Bolt Surge",
    description: "Bolt damage with all-damage and durability support.",
    effectIds: [125620, 127620, 146220],
  },
  {
    id: "sustained-hunt",
    category: "Utility",
    name: "Sustained Hunt",
    description: "Health recovery, durability and all-damage support.",
    effectIds: [143620, 146220, 127620],
  },
  {
    id: "last-stand",
    category: "Experimental",
    name: "Last Stand",
    description: "High near-death and full-health multipliers. Offline only.",
    effectIds: [152620, 151620, 143620],
  },
];

function GemPresetPanel({ gemEffects, onApply, onClose }) {
  const [category, setCategory] = useState("All");
  const effectById = useMemo(
    () => new Map(gemEffects.map((effect) => [Number(effect.value), effect])),
    [gemEffects],
  );
  const categories = ["All", "Attack", "Elemental", "Utility", "Experimental"];
  const visiblePresets = GEM_PRESETS.filter(
    (preset) => category === "All" || preset.category === category,
  );

  function formatEffects(effectIds) {
    return effectIds
      .map((id) => effectById.get(id)?.label ?? `Validated effect ${id}`)
      .join(" · ");
  }

  function applyPreset(preset) {
    const effects = [...preset.effectIds, NO_EFFECT_ID, NO_EFFECT_ID, NO_EFFECT_ID]
      .slice(0, 6)
      .map((id) => [id, effectById.get(id)?.label ?? "No Effect"]);

    onApply({ preset, effects });
  }

  return (
    <div className="gem-forge" role="dialog" aria-modal="true" aria-label="Gem Forge presets">
      <div className="gem-forge__header">
        <div>
          <p className="gem-forge__eyebrow">Gem Forge</p>
          <h2>Validated effect presets</h2>
        </div>
        <button className="gem-forge__close" onClick={onClose} aria-label="Close Gem Forge">
          Close
        </button>
      </div>

      <p className="gem-forge__notice">
        Every preset uses effect identifiers already bundled with the editor. Experimental presets
        are deliberately powerful; use them offline and retain the automatic backup.
      </p>

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
            <button onClick={() => applyPreset(preset)}>Load preset</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default GemPresetPanel;
