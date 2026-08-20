function getType(type) {
  if (!type) return "";
  switch (type.toLowerCase()) {
    case "consumable":
    case "material":
      return "item";
    case "lefthand":
    case "righthand":
      return "weapon";
    default:
      return type.toLowerCase();
  }
}

const GEM_SHAPES = new Set(["radial", "triangle", "waning", "circle", "droplet"]);
const GEM_COLORS = new Set(["blue", "purple", "yellow", "orange", "green", "white", "red"]);
const RUNE_TIER_LIMITS = {
  anti_clockwise_metamorphosis: 2,
  beast: 2,
  blood_rapture: 2,
  clawmark: 2,
  clockwise_metamorphosis: 2,
  communion: 4,
  deep_sea: 2,
  eye: 2,
  formless_oedon: 4,
  guidance: 2,
  heir: 2,
  lake: 2,
  moon: 2,
  oedon_writhe: 2,
};
const OATH_RUNES = new Set(["beast's_embrace", "corruption", "hunter", "impurity", "milkweed", "radiance"]);
const RUNE_ASSET_DIRECTORY = {
  anti_clockwise_metamorphosis: "anti-clockwise_metamorphosis",
};

function normalizeGemShape(shape) {
  const normalized = String(shape ?? "radial").toLowerCase();
  return GEM_SHAPES.has(normalized) ? normalized : "radial";
}

function normalizeGemLevel(level) {
  const parsed = Number(level);
  if (!Number.isFinite(parsed)) return 7;
  return Math.min(7, Math.max(1, Math.round(parsed)));
}

function normalizeRuneName(name) {
  const normalized = String(name ?? "")
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9']+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
  const withoutPrefix = removeRunePrefix(normalized);
  return Object.hasOwn(RUNE_TIER_LIMITS, withoutPrefix) ? withoutPrefix : "moon";
}

function normalizeRuneTier(name, rating) {
  const maxTier = RUNE_TIER_LIMITS[name] ?? RUNE_TIER_LIMITS.moon;
  const parsed = Number(rating);
  const tier = Number.isFinite(parsed) ? Math.round(parsed) : 0;
  return Math.min(maxTier, Math.max(0, tier));
}

function getRunePath(name, shape, rating) {
  const normalized = String(name ?? "")
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9']+/g, "_")
    .replaceAll(/^_+|_+$/g, "");

  if (shape === "Oath") {
    return `/assets/runes/oath/${OATH_RUNES.has(normalized) ? normalized : "hunter"}.png`;
  }

  const runeName = normalizeRuneName(name);
  const assetDirectory = RUNE_ASSET_DIRECTORY[runeName] ?? runeName;
  return `/assets/runes/${assetDirectory}/${normalizeRuneTier(runeName, rating)}.png`;
}

function getRuneFallbackPath(shape) {
  return shape === "Oath" ? "/assets/runes/oath/hunter.png" : "/assets/runes/moon/0.png";
}

function removeRunePrefix(name) {
  return name
    .replaceAll(/great_|arcane_|dissipating_|stunning_|clear_|fading_/g, "")
    .trim();
}

function isCursed(effects = []) {
  return effects.some(
    ([, name]) =>
      String(name ?? "").includes("-") ||
      String(name ?? "").includes("Increases stamina") ||
      String(name ?? "").includes("DOWN"),
  );
}

function getUnique(primaryEffect, shape, source) {
  if (shape === "Droplet") {
    if (primaryEffect === 3143408 && source === 2147633649) {
      return { image: "tear", name: "Tear Blood Gem" };
    }
    if (primaryEffect === 3126204 && source === 2147633648) {
      return { image: "brooch", name: "Red Blood Gem" };
    }
  } else if (shape === "Radial" && primaryEffect === 3133407 && source === 2147633650) {
    return { image: "gold", name: "Gold Blood Gem" };
  }
  return undefined;
}

function getGemPath(effects = [], shape, level, unique, runeOriginPrimaryEffect) {
  if (unique) return `/assets/gems/unique/${unique.image}.png`;

  // A gem slot can end up holding an effect id that only exists in the Caryll Rune
  // catalogue (produced by other save-edit tools, or by legitimate in-game data).
  // There is no honest gem color for that effect, so show the rune it actually
  // corresponds to instead of guessing a color from unmatched text.
  if (runeOriginPrimaryEffect) {
    return getRunePath(
      runeOriginPrimaryEffect.name,
      undefined,
      runeOriginPrimaryEffect.rating,
    );
  }

  const color = getGemColor(effects[0]?.[1]) ?? "red";
  const cursed = isCursed(effects);
  return `/assets/gems/${normalizeGemShape(shape)}/${GEM_COLORS.has(color) ? color : "red"}/${
    cursed ? "cursed_" : ""
  }${normalizeGemLevel(level)}.png`;
}

function getGemFallbackPath() {
  return "/assets/gems/radial/red/7.png";
}

function getGemColor(primaryEffect) {
  const lowerCaseEffect = String(primaryEffect ?? "").toLowerCase();

  switch (true) {
    case /vs beasts|blood/.test(lowerCaseEffect):
      return "blue";
    case /(?:slow|rapid) poison effect/.test(lowerCaseEffect):
      return "purple";
    case /bolt/.test(lowerCaseEffect):
      return "yellow";
    case /fire|vs the kin/.test(lowerCaseEffect):
      return "orange";
    case /charge atks up|stamina cost|phys. up|boosts rally|hp continues|wpn durability/.test(
      lowerCaseEffect,
    ):
      return "green";
    case /arcane/.test(lowerCaseEffect):
      return "white";
    case /physical|skl|str|thrust|blunt|atk/.test(lowerCaseEffect):
      return "red";
    default:
      return "red";
  }
}

export {
  getType,
  getGemColor,
  getRunePath,
  getRuneFallbackPath,
  getGemPath,
  getGemFallbackPath,
  isCursed,
  getUnique,
};
