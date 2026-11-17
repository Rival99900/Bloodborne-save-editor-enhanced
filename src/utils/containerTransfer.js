// Export / import of an Inventory or Storage (JSON or CSV).
// The import is a merge: items take the exported amount, missing equipment
// and Gems/Runes are added, nothing is removed (see transfer.rs).
//
// v2 keeps the slots of each weapon/armor piece (shape + equipped Gem), so
// equipment can come back with its Gems. v1 files (loose Gems only) still import.

export const TRANSFER_FORMAT = "bloodborne-save-editor.container.v2";
const ACCEPTED_FORMATS = ["bloodborne-save-editor.container.v1", TRANSFER_FORMAT];
const ITEM_TYPES = ["Consumable", "Material", "Key", "Chalice"];
const WEAPON_TYPES = ["RightHand", "LeftHand"];
const NO_EFFECT = 4294967295;
const GEM_SHAPES = ["Radial", "Triangle", "Waning", "Circle", "Droplet"];
const SLOT_SHAPES = ["Closed", ...GEM_SHAPES];
const RUNE_SHAPES = ["-", "Oath"];
const CSV_COLUMNS = ["kind", "id", "name", "amount", "level", "type", "shape", "effects", "slots"];
const REQUIRED_CSV_COLUMNS = CSV_COLUMNS.slice(0, 8);
const MAX_SLOTS = 5;
export const MAX_IMPORT_ENTRIES = 5000;
export const IMPORT_CATEGORIES = ["all", "items", "weapons", "armor", "gems", "runes"];

const effectIds = (upgrade) =>
  (upgrade.effects ?? []).map(([id]) => Number(id)).filter((id) => id !== NO_EFFECT);

function upgradeEntry(upgrade) {
  return {
    upgrade_type: upgrade.upgrade_type,
    shape: upgrade.shape,
    effects: effectIds(upgrade),
    name: upgrade.info?.name ?? "",
  };
}

export function buildExport(container, location) {
  const items = [];
  const equipment = [];
  const upgrades = [];
  for (const type of ITEM_TYPES) {
    for (const article of container?.articles?.[type] ?? []) {
      items.push({ id: article.id, amount: article.amount, name: article.info?.item_name ?? "" });
    }
  }
  for (const type of [...WEAPON_TYPES, "Armor"]) {
    for (const article of container?.articles?.[type] ?? []) {
      const armor = type === "Armor";
      equipment.push({
        id: armor ? article.id : article.id - (article.id % 10000),
        armor,
        level: armor ? 0 : Math.floor((article.id % 10000) / 100),
        name: article.info?.item_name ?? "",
        slots: (article.slots ?? [])
          .slice(0, MAX_SLOTS)
          .map((slot) => ({ shape: slot.shape, gem: slot.gem ? upgradeEntry(slot.gem) : null })),
      });
    }
  }
  for (const type of ["Gem", "Rune"]) {
    for (const upgrade of container?.upgrades?.[type] ?? []) upgrades.push(upgradeEntry(upgrade));
  }
  return { format: TRANSFER_FORMAT, location, items, equipment, upgrades };
}

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n;|]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Slots in one CSV cell: "Radial=Circle:127320;127320|Closed|Triangle".
const slotsToCell = (slots = []) =>
  slots
    .map((slot) =>
      slot.gem ? `${slot.shape}=${slot.gem.shape}:${slot.gem.effects.join(";")}` : slot.shape,
    )
    .join("|");
function slotsFromCell(cell) {
  if (!cell) return [];
  return cell.split("|").map((part) => {
    const [shape, gem] = part.split("=");
    if (!gem) return { shape: shape.trim(), gem: null };
    const [gemShape, effects = ""] = gem.split(":");
    return {
      shape: shape.trim(),
      gem: {
        upgrade_type: "Gem",
        shape: gemShape.trim(),
        effects: effects ? effects.split(";") : [],
      },
    };
  });
}

export function toCsv(data) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const item of data.items)
    lines.push(
      ["item", item.id, item.name, item.amount, "", "", "", "", ""].map(csvCell).join(","),
    );
  for (const piece of data.equipment)
    lines.push(
      [
        piece.armor ? "armor" : "weapon",
        piece.id,
        piece.name,
        1,
        piece.level,
        "",
        "",
        "",
        slotsToCell(piece.slots),
      ]
        .map(csvCell)
        .join(","),
    );
  for (const upgrade of data.upgrades)
    lines.push(
      [
        upgrade.upgrade_type.toLowerCase(),
        "",
        upgrade.name,
        1,
        "",
        upgrade.upgrade_type,
        upgrade.shape,
        upgrade.effects.join(";"),
        "",
      ]
        .map(csvCell)
        .join(","),
    );
  return `${lines.join("\n")}\n`;
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "",
    quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

function fromCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  const header = parseCsvLine(lines.shift() ?? "").map((cell) => cell.trim().toLowerCase());
  if (REQUIRED_CSV_COLUMNS.some((column) => !header.includes(column))) throw new Error("columns");
  const data = { items: [], equipment: [], upgrades: [] };
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(
      header.map((column, index) => [column, (cells[index] ?? "").trim()]),
    );
    const kind = row.kind.toLowerCase();
    if (kind === "item") data.items.push({ id: row.id, amount: row.amount });
    else if (kind === "weapon" || kind === "armor")
      data.equipment.push({
        id: row.id,
        armor: kind === "armor",
        level: row.level || 0,
        slots: slotsFromCell(row.slots),
      });
    else if (kind === "gem" || kind === "rune")
      data.upgrades.push({
        upgrade_type: kind === "gem" ? "Gem" : "Rune",
        shape: row.shape,
        effects: row.effects ? row.effects.split(";") : [],
      });
    else throw new Error("kind");
  }
  return data;
}

const toInteger = (value, max) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > max) throw new Error("value");
  return number;
};

function cleanUpgrade(upgrade) {
  const type = upgrade?.upgrade_type;
  const shapes = type === "Gem" ? GEM_SHAPES : type === "Rune" ? RUNE_SHAPES : null;
  if (!shapes || !shapes.includes(upgrade.shape)) throw new Error("value");
  const effects = (upgrade.effects ?? [])
    .map((id) => toInteger(id, 0xffffffff))
    .filter((id) => id !== NO_EFFECT);
  if (!effects.length || effects.length > 6) throw new Error("value");
  return { upgrade_type: type, shape: upgrade.shape, effects };
}

function cleanSlots(slots) {
  if (!Array.isArray(slots)) return [];
  if (slots.length > MAX_SLOTS) throw new Error("value");
  return slots.map((slot) => {
    if (!SLOT_SHAPES.includes(slot?.shape)) throw new Error("value");
    const gem = slot.gem ? cleanUpgrade({ ...slot.gem, upgrade_type: "Gem" }) : null;
    return { shape: slot.shape, gem };
  });
}

// Returns the full content of the file, or throws Error("format" | "columns" | "kind" | "value" | "tooMany").
export function parseImport(text, fileName = "") {
  let raw;
  if (/\.csv$/i.test(fileName) || !text.trimStart().startsWith("{")) raw = fromCsv(text);
  else {
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error("format");
    }
    if (!ACCEPTED_FORMATS.includes(raw?.format)) throw new Error("format");
  }
  const items = (raw.items ?? []).map((item) => ({
    id: toInteger(item.id, 0xffffffff),
    amount: toInteger(item.amount, 9999),
  }));
  const equipment = (raw.equipment ?? []).map((piece) => ({
    id: toInteger(piece.id, 0xffffffff),
    armor: Boolean(piece.armor),
    level: toInteger(piece.level ?? 0, 10),
    slots: cleanSlots(piece.slots),
  }));
  const upgrades = (raw.upgrades ?? []).map(cleanUpgrade);
  if (items.length + equipment.length + upgrades.length > MAX_IMPORT_ENTRIES)
    throw new Error("tooMany");
  return { items, equipment, upgrades };
}

// What the import sends, for the category chosen next to "Import a file…".
// keepGems: weapons/armor come back with their slot shapes and equipped Gems.
export function selectImport(data, category = "all", keepGems = true) {
  const want = (name) => category === "all" || category === name;
  const equipment = data.equipment
    .filter((piece) => (piece.armor ? want("armor") : want("weapons")))
    .map((piece) => ({ ...piece, slots: keepGems ? piece.slots : [] }));
  return {
    items: want("items") ? data.items : [],
    equipment,
    upgrades: data.upgrades.filter((upgrade) =>
      upgrade.upgrade_type === "Gem" ? want("gems") : want("runes"),
    ),
  };
}

// Entries per category, shown in the import selector.
export function importCounts(data) {
  const gems = data.upgrades.filter((upgrade) => upgrade.upgrade_type === "Gem").length;
  return {
    all: data.items.length + data.equipment.length + data.upgrades.length,
    items: data.items.length,
    weapons: data.equipment.filter((piece) => !piece.armor).length,
    armor: data.equipment.filter((piece) => piece.armor).length,
    gems,
    runes: data.upgrades.length - gems,
  };
}
