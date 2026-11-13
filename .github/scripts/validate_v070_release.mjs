// v0.7.0 checks: localized strings, consistency rules, trophy lists, preset
// files, recent files and image references.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const strings = JSON.parse(fs.readFileSync('src/i18n/v070Translations.json', 'utf8'));
const notes = JSON.parse(fs.readFileSync('src/i18n/releaseSummaries.json', 'utf8'));
const weapons = JSON.parse(fs.readFileSync('src-tauri/resources/weapons.json', 'utf8'));
const items = JSON.parse(fs.readFileSync('src-tauri/resources/items.json', 'utf8'));
const placeholders = (value) => [...String(value).matchAll(/\{\{\w+\}\}/g)].map((match) => match[0]).sort();

function sourceFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(jsx?|mjs|css)$/.test(entry.name) ? [file] : [];
  });
}

const server = await createServer({logLevel: 'error', server: {watch: null}});
try {
  await server.listen();
  const {LocalizationProvider, useLocalization, SUPPORTED_LANGUAGES} = await server.ssrLoadModule('/src/i18n/localization.jsx');
  const check = await server.ssrLoadModule('/src/utils/saveCheck.js');
  const trophies = await server.ssrLoadModule('/src/utils/trophies.js');
  const presets = await server.ssrLoadModule('/src/utils/characterPresets.js');

  // Every supported language has every new string, with the same placeholders.
  let language;
  function Probe() {
    const {t} = useLocalization();
    for (const [key, value] of Object.entries(strings[language])) {
      assert.equal(t(key), value.replace(/\{\{\w+\}\}/g, ''), `${language}: ${key}`);
    }
    return null;
  }
  for (const {code} of SUPPORTED_LANGUAGES) {
    assert(strings[code], `Missing v0.7.0 strings: ${code}`);
    assert.deepEqual(Object.keys(strings[code]).sort(), Object.keys(strings.en).sort(), `Incomplete v0.7.0 strings: ${code}`);
    for (const [key, value] of Object.entries(strings[code])) {
      assert.deepEqual(placeholders(value), placeholders(strings.en[key]), `${code}: placeholders of ${key}`);
    }
    language = code;
    globalThis.localStorage = {getItem: () => code, setItem: () => {}};
    renderToStaticMarkup(React.createElement(LocalizationProvider, null, React.createElement(Probe)));
    assert(notes.versions['0.7.0'][code]?.trim(), `Missing update summary: ${code}`);
  }

  // F1/F2: Level = attributes - 50 (Milquetoast: 60 points at level 10); HP table ends at 1900.
  const stats = (values) => Object.entries(values).map(([name, value]) => ({name, value}));
  const milquetoast = stats({Level: 10, Health: 594, Vitality: 11, Endurance: 10, Strength: 12, Skill: 10, Bloodtinge: 9, Arcane: 8});
  assert.equal(check.expectedLevel(milquetoast), 10);
  assert.equal(check.expectedHealth(11), 594);
  assert.equal(check.expectedHealth(99), 1900);
  assert.equal(check.expectedHealth(6), undefined);
  assert.equal(check.MAX_LEVEL, 544);
  assert.deepEqual(check.checkSave({stats: milquetoast}), []);
  const edited = check.checkSave({stats: stats({Level: 594, Health: 1, Vitality: 99, Endurance: 99, Strength: 99, Skill: 99, Bloodtinge: 99, Arcane: 99})});
  assert.deepEqual(edited.map((issue) => issue.key).sort(), ['saveCheck.healthMismatch', 'saveCheck.levelMismatch', 'saveCheck.levelTooHigh']);
  assert.equal(check.weaponLevel({id: 7001000}), 10);
  for (const issue of edited) assert(strings.en[issue.key], `Untranslated issue: ${issue.key}`);

  // F3: 26 weapons (15 right, 11 left) and 9 tools, all present in the catalogues.
  assert.equal(trophies.HUNTER_WEAPONS.length, 26);
  assert.equal(trophies.HUNTER_WEAPONS.filter(trophies.isLeftHandFamily).length, 11);
  for (const id of trophies.HUNTER_WEAPONS) {
    assert(weapons.rightHand[id] || weapons.leftHand[id], `Unknown weapon family ${id}`);
  }
  assert.equal(trophies.HUNTER_TOOLS.length, 9);
  for (const id of trophies.HUNTER_TOOLS) assert(items.consumable[id], `Unknown hunter tool ${id}`);
  assert.equal(trophies.weaponFamily(4010500), 4000000, 'Uncanny Blade of Mercy +5 counts');

  // F7: preset files round-trip and stay within the limit.
  const statsPreset = {Health: 1, Stamina: 1, Level: 1, Vitality: 1, Endurance: 1, Strength: 1, Skill: 1, Bloodtinge: 1, Arcane: 1};
  const existing = [{id: 'a', name: 'A', stats: statsPreset}];
  let counter = 0;
  const merged = presets.mergeImportedPresets(existing, presets.exportPresets(existing), () => `new-${counter++}`);
  assert.deepEqual(merged.presets.map((preset) => preset.id), ['a', 'new-0']);
  assert.throws(() => presets.mergeImportedPresets(existing, {presets: [{id: 'x', name: '', stats: statsPreset}]}, () => 'y'));

  // Change log never shows an unnamed or empty item row.
  const diffModule = await server.ssrLoadModule('/src/utils/saveDiff.js');
  const record = (id, name) => ({id, first_part: id, info: {item_name: name}});
  const emptyFamilies = {articles: {}, upgrades: {}};
  const diff = diffModule.buildSaveDiff(
    {inventory: {articles: {A: [record(1, 'Saw Cleaver'), record(2, '')]}, upgrades: {}}, storage: emptyFamilies},
    {inventory: {articles: {A: [record(1, 'Saw Cleaver')]}, upgrades: {}}, storage: {articles: {B: [record(2, '')]}, upgrades: {}}},
  );
  assert.ok(diff.rows.length === 2 && diff.rows.every((row) => row.name === '#2'), 'Unnamed records use their id in the change log');

  // Weapon level editing mirrors the backend rule (variants with reinforced versions only).
  const levels = await server.ssrLoadModule('/src/utils/weaponLevels.js');
  assert.equal(levels.weaponIsUpgradable(7001000), true, 'Saw Cleaver can be reinforced');
  assert.equal(levels.weaponIsUpgradable(12080000), false, 'NPC-only variants are not reinforced');

  // Console bridge: PS4 and PS5 presets, saves-only actions, every command registered.
  const ps4Dialog = fs.readFileSync('src/components/Ps4Dialog.jsx', 'utf8');
  const lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');
  assert.match(ps4Dialog, /ps4: 2121, ps5: 1337/);
  for (const command of ['ps4_ftp_find_saves', 'ps4_ftp_import', 'ps4_ftp_delete', 'upgrade_all_weapons']) {
    assert.match(lib, new RegExp(`\\n\\s+${command},`), `${command} is registered`);
  }
  assert.ok(fs.existsSync('public/assets/droplet.webp'), 'Droplet shape icon exists');
  assert.match(fs.readFileSync('src/utils/useDraw.js', 'utf8'), /"circle", "droplet"/, 'Droplet shape icon is drawn');
  assert.match(fs.readFileSync('src/components/SelectSearch.jsx', 'utf8'), /strategy: "fixed"[\s\S]*FloatingPortal/, 'Effect lists are not clipped by scrolling panels');
  assert.match(ps4Dialog, /settings\.console === "ps5"/, 'PS5 skips the Apollo folder detection');
  for (const key of ['ps4.consoles.ps5', 'ps4.readOnly', 'ps4.delete', 'ps4.import', 'ps4.errors.FTP_NOT_A_SAVE', 'bulk.weaponsSkipped', 'ps4.ps5Browse', 'ps4.sendHere', 'ps4.errors.FTP_VERIFY_FAILED']) {
    for (const language of SUPPORTED_LANGUAGES) assert.ok(strings[language.code ?? language]?.[key], `${key} in ${language.code ?? language}`);
  }

  // Every /assets/... image referenced by the interface exists.
  const missing = new Set();
  for (const file of sourceFiles('src')) {
    if (file.includes(`${path.sep}i18n${path.sep}`)) continue;
    for (const [, ref] of fs.readFileSync(file, 'utf8').matchAll(/["'(`](\/assets\/[^"'`)$]+\.(?:png|webp))/g)) {
      if (!fs.existsSync(path.join('public', ref))) missing.add(ref);
    }
  }
  assert.deepEqual([...missing], [], 'Missing image files');
  console.log(`v0.7.0 checks passed (${SUPPORTED_LANGUAGES.length} languages, ${Object.keys(strings.en).length} strings).`);
} finally {
  await server.close();
}
