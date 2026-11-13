// Coherence rules for a character, used by the Stats page (F1: recalculated
// level and HP) and by the save check (F2: values outside the normal game range).

// Total HP for each Vitality value, as listed by the Bloodborne wiki
// (bloodborne.wiki.fextralife.com/Vitality). Vitality below 7 has no entry.
const HP_BY_VITALITY = [
  511, 531, 552, 573, 594, 616, 638, 659, 682, 698, 719, 742, 767, 793, 821, 849, 878, 908,
  938, 970, 1001, 1034, 1066, 1100, 1123, 1147, 1170, 1193, 1216, 1239, 1261, 1283, 1304,
  1325, 1346, 1366, 1386, 1405, 1424, 1442, 1458, 1474, 1489, 1500, 1508, 1517, 1526, 1535,
  1544, 1553, 1562, 1571, 1580, 1588, 1597, 1606, 1615, 1623, 1632, 1641, 1649, 1658, 1666,
  1675, 1683, 1692, 1700, 1709, 1717, 1725, 1734, 1742, 1750, 1758, 1767, 1775, 1783, 1791,
  1799, 1807, 1814, 1822, 1830, 1837, 1845, 1852, 1860, 1867, 1874, 1881, 1888, 1894, 1900,
];
const FIRST_VITALITY = 7;

export const ATTRIBUTE_NAMES = ["Vitality", "Endurance", "Strength", "Skill", "Bloodtinge", "Arcane"];
// Every origin satisfies Level = sum of the six attributes - 50
// (Milquetoast: 60 points at level 10, Waste of Skin: 54 points at level 4).
const LEVEL_OFFSET = 50;
export const MAX_LEVEL = 99 * ATTRIBUTE_NAMES.length - LEVEL_OFFSET;
const LIMITS = { Insight: 999, Echoes: 999_999_999 };
const INVENTORY_MAX = 99;
const STORAGE_MAX = 600;
// Blood Vials and Quicksilver Bullets are carried 20 at a time; extras go to storage.
const CARRY_LIMIT_20 = new Set(["Blood Vial", "Quicksilver Bullets"]);
const MAX_WEAPON_LEVEL = 10;
const MAX_GEM_RATING = 20;

function statValue(stats, name) {
  const stat = stats?.find((entry) => entry.name === name);
  return stat == null ? undefined : Number(stat.value);
}

export function expectedHealth(vitality) {
  const index = Number(vitality) - FIRST_VITALITY;
  return Number.isInteger(index) && index >= 0 && index < HP_BY_VITALITY.length ? HP_BY_VITALITY[index] : undefined;
}

export function expectedLevel(stats) {
  const values = ATTRIBUTE_NAMES.map((name) => statValue(stats, name));
  if (values.some((value) => !Number.isFinite(value))) return undefined;
  return values.reduce((sum, value) => sum + value, 0) - LEVEL_OFFSET;
}

// Level and HP the game would show for these attributes. Missing entries are left out.
export function recalculatedStats(stats) {
  const level = expectedLevel(stats);
  const health = expectedHealth(statValue(stats, "Vitality"));
  return (stats ?? []).map((stat) => {
    if (stat.name === "Level" && level !== undefined && level >= 1) return { ...stat, value: level };
    if (stat.name === "Health" && health !== undefined) return { ...stat, value: health };
    return stat;
  });
}

// Weapon reinforcement is the hundreds digit of the id (Saw Cleaver +10 = 7001000).
export function weaponLevel(article) {
  const id = Number(article?.id);
  return Number.isFinite(id) ? Math.floor((id % 10000) / 100) : 0;
}

function articleName(article) {
  return article?.info?.item_name ?? String(article?.id ?? "?");
}

// Each issue: { severity: "warning" | "info", key, params } with a localization key.
export function checkSave(save) {
  const issues = [];
  if (!save) return issues;
  const stats = save.stats ?? [];

  const level = statValue(stats, "Level");
  const computedLevel = expectedLevel(stats);
  if (computedLevel !== undefined && level !== computedLevel) {
    issues.push({ severity: "warning", key: "saveCheck.levelMismatch", params: { level, expected: computedLevel } });
  }
  if (level > MAX_LEVEL) issues.push({ severity: "warning", key: "saveCheck.levelTooHigh", params: { level, max: MAX_LEVEL } });

  for (const name of ATTRIBUTE_NAMES) {
    const value = statValue(stats, name);
    if (value !== undefined && (value < 1 || value > 99)) {
      issues.push({ severity: "warning", key: "saveCheck.attributeRange", params: { name, value } });
    }
  }

  const health = statValue(stats, "Health");
  const computedHealth = expectedHealth(statValue(stats, "Vitality"));
  if (computedHealth !== undefined && health !== undefined && health !== computedHealth) {
    issues.push({ severity: "info", key: "saveCheck.healthMismatch", params: { health, expected: computedHealth } });
  }

  for (const [name, max] of Object.entries(LIMITS)) {
    const value = statValue(stats, name);
    if (value !== undefined && value > max) issues.push({ severity: "warning", key: "saveCheck.currencyRange", params: { name, value, max } });
  }

  const containers = [["inventory", save.inventory, INVENTORY_MAX], ["storage", save.storage, STORAGE_MAX]];
  for (const [place, container, max] of containers) {
    for (const article of Object.values(container?.articles ?? {}).flat()) {
      const name = articleName(article);
      const amount = Number(article.amount);
      const limit = place === "inventory" && CARRY_LIMIT_20.has(name) ? 20 : max;
      if (article.type_family === "Item" && amount > limit) {
        issues.push({ severity: "warning", key: `saveCheck.quantity.${place}`, params: { name, amount, max: limit } });
      }
      if (article.type_family === "Weapon" && weaponLevel(article) > MAX_WEAPON_LEVEL) {
        issues.push({ severity: "warning", key: "saveCheck.weaponLevel", params: { name, level: weaponLevel(article) } });
      }
    }
    for (const upgrade of Object.values(container?.upgrades ?? {}).flat()) {
      const rating = Number(upgrade?.info?.rating);
      if (upgrade.upgrade_type === "Gem" && rating > MAX_GEM_RATING) {
        issues.push({ severity: "warning", key: "saveCheck.gemRating", params: { name: upgrade.info?.name ?? "?", rating } });
      }
    }
  }
  return issues;
}
