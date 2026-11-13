import weapons from "../../src-tauri/resources/weapons.json";

// Same rule as `weapon_is_upgradable` in the backend: NPC-only "Bloody"
// variants (x80000) and catalogue entries without a durability (Adella's
// End-Quest Dagger) have no reinforced versions.
export function weaponIsUpgradable(id) {
  const value = Number(id);
  if (!Number.isFinite(value)) return false;
  const variant = (value % 100000) - (value % 10000);
  if (variant === 80000) return false;
  const base = String(value - (value % 10000));
  return Object.values(weapons).some((hand) => hand[base] && hand[base].durability != null);
}
