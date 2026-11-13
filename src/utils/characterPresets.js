export const PRESET_STORAGE_KEY = 'bloodborne.character-presets.v1';
export const PRESET_STAT_NAMES = Object.freeze(['Health','Stamina','Level','Vitality','Endurance','Strength','Skill','Bloodtinge','Arcane']);
export const MAX_PRESETS = 20;
export function validatePreset(value) {
  if (!value || typeof value.id !== 'string' || !value.id || value.id.length > 100 || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 60) throw new Error('invalid');
  const stats = {};
  for (const key of PRESET_STAT_NAMES) {
    const number = value.stats?.[key];
    if (!Number.isInteger(number) || number < 0 || number > 2_000_000_000) throw new Error('invalid');
    stats[key] = number;
  }
  return { id: value.id, name: value.name.trim(), stats };
}
export function validatePresets(data) {
  if (!Array.isArray(data) || data.length > MAX_PRESETS) throw new Error('invalid');
  const values = data.map(validatePreset);
  if (new Set(values.map(p => p.id)).size !== values.length) throw new Error('invalid');
  return values;
}
export function readPresets(storage) {
  const raw = storage.getItem(PRESET_STORAGE_KEY);
  return raw === null ? [] : validatePresets(JSON.parse(raw));
}
export function writePresets(storage, presets) {
  storage.setItem(PRESET_STORAGE_KEY, JSON.stringify(validatePresets(presets)));
}
export function capturePreset(name, stats, id) {
  return validatePreset({id, name, stats: Object.fromEntries(stats.filter(s => PRESET_STAT_NAMES.includes(s.name)).map(s => [s.name, s.value]))});
}
export function applyPresetDraft(stats, preset) {
  const validated = validatePreset(preset);
  return stats.map(stat => Object.hasOwn(validated.stats, stat.name) ? {...stat, value: validated.stats[stat.name]} : {...stat});
}

// F7: share presets as a JSON file.
export const PRESET_EXPORT_FORMAT = 'bloodborne-save-editor.character-presets.v1';
export function exportPresets(presets) {
  return { format: PRESET_EXPORT_FORMAT, presets: validatePresets(presets) };
}
// Merges imported presets after the existing ones. Ids already present get a new
// id; the total stays within MAX_PRESETS. Returns { presets, added, skipped }.
export function mergeImportedPresets(existing, payload, makeId) {
  const list = Array.isArray(payload) ? payload : payload?.presets;
  if (!Array.isArray(list)) throw new Error('invalid');
  const incoming = list.map(validatePreset);
  const ids = new Set(existing.map(p => p.id));
  const merged = [...existing];
  let skipped = 0;
  for (const preset of incoming) {
    if (merged.length >= MAX_PRESETS) { skipped += 1; continue; }
    const id = ids.has(preset.id) ? makeId() : preset.id;
    ids.add(id);
    merged.push({ ...preset, id });
  }
  return { presets: validatePresets(merged), added: merged.length - existing.length, skipped };
}
