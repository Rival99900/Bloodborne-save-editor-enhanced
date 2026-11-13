// Collection trophies checked against the save (F3). Lists from the trophy
// guides: Hunter's Essence = the 26 base-game Hunter Weapons (15 right-hand,
// 11 left-hand), Hunter's Craft = the 9 special Hunter Tools, Weapon Master =
// one weapon at +10. Weapons are matched by family id, so Uncanny/Lost and
// reinforced versions count (Saw Cleaver +10 = 7001000, family 7000000).

export const HUNTER_WEAPONS = [
  // Right hand
  7000000, 5000000, 22000000, 7100000, 8000000, 8100000, 4000000, 5100000,
  10100000, 2000000, 10000000, 11000000, 13000000, 12000000, 9000000,
  // Left hand
  14000000, 6000000, 14200000, 6100000, 14100000, 15000000, 18100000,
  36000000, 20100000, 19000000, 18000000,
];
const LEFT_HAND = new Set([14000000, 6000000, 14200000, 6100000, 14100000, 15000000, 18100000, 36000000, 20100000, 19000000, 18000000]);

// Consumable ids of the special Hunter Tools (Madaras Whistle is not required).
export const HUNTER_TOOLS = [2060, 2020, 1310, 2070, 2000, 2110, 2080, 2010, 2050];

export function weaponFamily(id) {
  const value = Number(id);
  return value - (value % 100000);
}

export function isLeftHandFamily(family) {
  return LEFT_HAND.has(family);
}

function allArticles(save) {
  return [save?.inventory, save?.storage].flatMap((container) => Object.values(container?.articles ?? {}).flat());
}

export function trophyProgress(save) {
  const articles = allArticles(save);
  const weaponFamilies = new Set(
    articles.filter((article) => article.type_family === "Weapon").map((article) => weaponFamily(article.id)),
  );
  const itemIds = new Set(articles.filter((article) => article.type_family === "Item").map((article) => Number(article.id)));
  const maxLevel = articles
    .filter((article) => article.type_family === "Weapon")
    .reduce((max, article) => Math.max(max, Math.floor((Number(article.id) % 10000) / 100)), 0);

  return {
    weapons: HUNTER_WEAPONS.map((family) => ({ id: family, owned: weaponFamilies.has(family) })),
    tools: HUNTER_TOOLS.map((id) => ({ id, owned: itemIds.has(id) })),
    weaponMaster: { level: maxLevel, done: maxLevel >= 10 },
  };
}
