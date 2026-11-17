// Feature rules of v0.7.x: save consistency, trophies, presets, weapon levels,
// console bridge, lamps, images.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export default async function features({ server, readJson, flat, sourceFiles }) {
  const weapons = readJson("src-tauri/resources/weapons.json");
  const items = readJson("src-tauri/resources/items.json");
  const check = await server.ssrLoadModule("/src/utils/saveCheck.js");
  const trophies = await server.ssrLoadModule("/src/utils/trophies.js");
  const presets = await server.ssrLoadModule("/src/utils/characterPresets.js");

  // Level = attributes - 50 (Milquetoast: 60 points at level 10); HP table ends at 1900.
  const stats = (values) => Object.entries(values).map(([name, value]) => ({ name, value }));
  const milquetoast = stats({
    Level: 10,
    Health: 594,
    Vitality: 11,
    Endurance: 10,
    Strength: 12,
    Skill: 10,
    Bloodtinge: 9,
    Arcane: 8,
  });
  assert.equal(check.expectedLevel(milquetoast), 10);
  assert.equal(check.expectedHealth(11), 594);
  assert.equal(check.expectedHealth(99), 1900);
  assert.equal(check.expectedHealth(6), undefined);
  assert.equal(check.MAX_LEVEL, 544);
  assert.deepEqual(check.checkSave({ stats: milquetoast }), []);
  const edited = check.checkSave({
    stats: stats({
      Level: 594,
      Health: 1,
      Vitality: 99,
      Endurance: 99,
      Strength: 99,
      Skill: 99,
      Bloodtinge: 99,
      Arcane: 99,
    }),
  });
  assert.deepEqual(edited.map((issue) => issue.key).sort(), [
    "saveCheck.healthMismatch",
    "saveCheck.levelMismatch",
    "saveCheck.levelTooHigh",
  ]);
  assert.equal(check.weaponLevel({ id: 7001000 }), 10);
  for (const issue of edited) assert(flat.en[issue.key], `Untranslated issue: ${issue.key}`);

  // Trophies: 26 weapons (15 right, 11 left) and 9 tools, all in the catalogues.
  assert.equal(trophies.HUNTER_WEAPONS.length, 26);
  assert.equal(trophies.HUNTER_WEAPONS.filter(trophies.isLeftHandFamily).length, 11);
  for (const id of trophies.HUNTER_WEAPONS)
    assert(weapons.rightHand[id] || weapons.leftHand[id], `Unknown weapon family ${id}`);
  assert.equal(trophies.HUNTER_TOOLS.length, 9);
  for (const id of trophies.HUNTER_TOOLS) assert(items.consumable[id], `Unknown hunter tool ${id}`);
  assert.equal(trophies.weaponFamily(4010500), 4000000, "Uncanny Blade of Mercy +5 counts");

  // Character preset files round-trip and stay within the limit.
  const statsPreset = {
    Health: 1,
    Stamina: 1,
    Level: 1,
    Vitality: 1,
    Endurance: 1,
    Strength: 1,
    Skill: 1,
    Bloodtinge: 1,
    Arcane: 1,
  };
  const existing = [{ id: "a", name: "A", stats: statsPreset }];
  let counter = 0;
  const merged = presets.mergeImportedPresets(
    existing,
    presets.exportPresets(existing),
    () => `new-${counter++}`,
  );
  assert.deepEqual(
    merged.presets.map((preset) => preset.id),
    ["a", "new-0"],
  );
  assert.throws(() =>
    presets.mergeImportedPresets(
      existing,
      { presets: [{ id: "x", name: "", stats: statsPreset }] },
      () => "y",
    ),
  );

  // Weapon levels mirror the backend rule.
  const levels = await server.ssrLoadModule("/src/utils/weaponLevels.js");
  assert.equal(levels.weaponIsUpgradable(7001000), true, "Saw Cleaver can be reinforced");
  assert.equal(levels.weaponIsUpgradable(12080000), false, "NPC-only variants are not reinforced");
  assert.equal(
    levels.weaponIsUpgradable(19100000),
    false,
    "A reinforced Loch Shield disappears in game",
  );

  // Console bridge and registered commands.
  const ps4Dialog = fs.readFileSync("src/components/Ps4Dialog.jsx", "utf8");
  const commands = sourceFiles("src-tauri/src", /\.rs$/)
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  assert.match(ps4Dialog, /ps4: 2121, ps5: 1337/);
  assert.match(ps4Dialog, /settings\.console === "ps5"/, "PS5 skips the Apollo folder detection");
  const handler = commands.slice(commands.indexOf("generate_handler!["));
  for (const command of [
    "ps4_ftp_find_saves",
    "ps4_ftp_import",
    "ps4_ftp_delete",
    "upgrade_all_weapons",
    "get_lamp_flags",
    "set_lamp_flags",
    "add_equipment_batch",
    "add_items_batch",
    "open_all_weapon_slots",
    "refill_vials_and_bullets",
    "import_container",
    "inspect_save",
    "read_text_document",
    "write_text_document",
  ]) {
    assert.match(handler, new RegExp(`\\b${command}\\b`), `${command} is registered`);
  }

  // Lamps: every lamp is named through a Teleport destination or its own key.
  const lampCatalogue = readJson("src-tauri/resources/lamps.json");
  const teleport = await server.ssrLoadModule("/src/pages/character/Teleport.jsx");
  const destinationNames = new Set(teleport.locations.map((location) => location.label));
  const ownLamps = ["Grand Cathedral", "Moonside Lake", "Amygdala's Chamber"];
  assert.equal(lampCatalogue.length, 44);
  for (const lamp of lampCatalogue)
    assert.ok(
      destinationNames.has(lamp.name) || ownLamps.includes(lamp.name),
      `Lamp ${lamp.name} has a label`,
    );

  // Interface rules from user feedback.
  assert.doesNotMatch(
    fs.readFileSync("src/pages/inventory/AddScreen.jsx", "utf8"),
    /ConfirmDialog/,
    "Equipment is added without an extra confirmation",
  );
  assert.match(
    fs.readFileSync("src/utils/useDraw.js", "utf8"),
    /"circle", "droplet"/,
    "Droplet shape icon is drawn",
  );
  assert.match(
    fs.readFileSync("src/components/SelectSearch.jsx", "utf8"),
    /strategy: "fixed"[\s\S]*FloatingPortal/,
    "Effect lists are not clipped by scrolling panels",
  );
  assert.doesNotMatch(
    fs.readFileSync("src/pages/character/Teleport.jsx", "utf8"),
    /invoke\(/,
    "Teleport waits for Character → Confirm",
  );
  // Additions are confirmed in game: no "experimental" wording left on them.
  for (const [key, value] of Object.entries(flat.en)) {
    if (/^(inventory|tools\.trophies|bulk)\./.test(key))
      assert.doesNotMatch(String(value), /experimental/i, `"experimental" left in ${key}`);
  }

  // v0.7.5: bulk tabs, Gem finder, full comparison, import/export.
  const bulk = fs.readFileSync("src/components/BulkActions.jsx", "utf8");
  assert.match(
    bulk,
    /\["upgrades", "weapons", "slots", "items", "transfer"\]/,
    "Bulk actions tabs",
  );
  const tools = fs.readFileSync("src/pages/tools/Tools.jsx", "utf8");
  assert.match(tools, /\["trophies", "gems", "compare"\]/, "Tools tabs");
  assert.match(tools, /invoke\("inspect_save"/, "The comparison reads both saves");
  assert.match(commands, /SaveData::inspect\(&path/, "inspect_save never writes a backup");
  const transfer = await server.ssrLoadModule("/src/utils/containerTransfer.js");
  const sample = {
    articles: { Consumable: [{ id: 1000, amount: 20 }], RightHand: [{ id: 7001000, slots: [] }] },
    upgrades: {},
  };
  const exported = transfer.buildExport(sample, "inventory");
  assert.deepEqual(
    transfer.parseImport(transfer.toCsv(exported), "a.csv"),
    transfer.parseImport(JSON.stringify(exported), "a.json"),
  );
  assert.doesNotMatch(
    fs.readFileSync("src/components/GemPresetPanel.jsx", "utf8"),
    /plugin-fs/,
    "Preset files go through the backend",
  );

  // Every /assets/... image referenced by the interface exists.
  const missing = new Set();
  for (const file of sourceFiles("src", /\.(jsx?|mjs|css)$/)) {
    if (file.includes(`${path.sep}i18n${path.sep}`)) continue;
    for (const [, ref] of fs
      .readFileSync(file, "utf8")
      .matchAll(/["'(`](\/assets\/[^"'`)$]+\.(?:png|webp))/g)) {
      if (!fs.existsSync(path.join("public", ref))) missing.add(ref);
    }
  }
  assert.deepEqual([...missing], [], "Missing image files");
  return "save check, trophies, presets, weapon levels, console bridge, lamps, bulk, tools, transfer, images";
}
