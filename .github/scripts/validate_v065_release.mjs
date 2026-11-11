// v0.6.5 checks: English keys used by the interface, multiplayer flag data,
// boss helpers, localized strings and catalogue corrections.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const strings = JSON.parse(fs.readFileSync('src/i18n/v065Translations.json', 'utf8'));
const notes = JSON.parse(fs.readFileSync('src/i18n/releaseSummaries.json', 'utf8'));
const bosses = JSON.parse(fs.readFileSync('src-tauri/resources/bosses.json', 'utf8'));
const armors = JSON.parse(fs.readFileSync('src-tauri/resources/armors.json', 'utf8'));
const weapons = JSON.parse(fs.readFileSync('src-tauri/resources/weapons.json', 'utf8'));

function sourceFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(jsx?|mjs)$/.test(entry.name) ? [file] : [];
  });
}
// Static `t("…")` keys only; template keys are covered by their own audits.
const usedKeys = [...new Set(sourceFiles('src').flatMap((file) =>
  [...fs.readFileSync(file, 'utf8').matchAll(/\bt\(\s*["'`]([A-Za-z0-9_.]+)["'`]/g)].map((match) => match[1])))].sort();

const server = await createServer({logLevel: 'error', server: {watch: null}});
try {
  await server.listen();
  const {LocalizationProvider, useLocalization, SUPPORTED_LANGUAGES} = await server.ssrLoadModule('/src/i18n/localization.jsx');
  const {getReleaseSummary} = await server.ssrLoadModule('/src/utils/releaseSummary.js');
  const progression = await server.ssrLoadModule('/src/pages/bosses/bossProgression.js');

  let language;
  function Probe() {
    const {t} = useLocalization();
    if (language === 'en') {
      // A missing English key is displayed raw, e.g. "vignette.cursedPrefix Radial Blood Gem".
      for (const key of usedKeys) assert.notEqual(t(key, {count: 1}), key, `Missing English string: ${key}`);
      assert.equal(t('vignette.cursedPrefix'), 'Cursed');
    }
    for (const [key, value] of Object.entries(strings[language])) assert.equal(t(key), value, `${language}: ${key}`);
    return null;
  }
  for (const {code} of SUPPORTED_LANGUAGES) {
    assert(strings[code], `Missing v0.6.5 strings: ${code}`);
    assert.deepEqual(Object.keys(strings[code]).sort(), Object.keys(strings.en).sort(), `Incomplete v0.6.5 strings: ${code}`);
    language = code;
    globalThis.localStorage = {getItem: () => code, setItem: () => {}};
    renderToStaticMarkup(React.createElement(LocalizationProvider, null, React.createElement(Probe)));
    assert(notes.versions['0.6.5'][code]?.trim(), `Missing update summary: ${code}`);
    assert.equal(getReleaseSummary(notes.versions['0.6.5'].en, code, '0.6.5', notes.versions['0.6.5']), notes.versions['0.6.5'][code]);
  }

  // Multiplayer masks: one per area boss, appended after the defeat flags.
  const byName = new Map(bosses.map((boss) => [boss.name, boss]));
  for (const boss of bosses) {
    const mp = boss.flags.filter(progression.isMultiplayerFlag);
    assert(mp.length <= 1, boss.name);
    assert(!progression.isMultiplayerFlag(boss.flags[0]), `${boss.name}: defeat flag must stay first`);
    for (const flag of mp) assert.equal(flag.dead_value & flag.alive_value, 0, `${boss.name}: mask bits overlap`);
  }
  assert.equal(bosses.filter((boss) => boss.flags.some(progression.isMultiplayerFlag)).length, 20);
  const defeated = {...byName.get('Cleric Beast'), flags: byName.get('Cleric Beast').flags.map((flag) => ({...flag, current_value: progression.isMultiplayerFlag(flag) ? 0xFF : 0}))};
  assert.equal(progression.isBossDefeated(defeated), false, 'mp bit must not count as a defeat');
  const masks = progression.getMultiplayerMasks(bosses);
  assert.equal(masks.length, new Set(masks.map(({offset, mask}) => `${offset}:${mask}`)).size);
  assert(masks.some(({offset, mask}) => offset === 1678 && mask === 223), 'Central Yharnam mask');

  // Catalogue corrections shared with upstream 0.11.x.
  for (const id of ['901000', '902000', '903000']) assert(!armors[id], `Default body item still listed: ${id}`);
  assert.equal(armors['301000'].item_name, 'Student Uniform');
  assert.equal(armors['191000'].item_name, 'Student Uniform (Cape)');
  for (const hand of Object.values(weapons)) for (const [id, weapon] of Object.entries(hand)) {
    // Upstream keeps `null` for bare fists (900000), which have no durability.
    assert(Object.hasOwn(weapon, 'durability') && (weapon.durability === null || Number.isInteger(weapon.durability)), `Missing durability: ${id}`);
  }
  console.log(`v0.6.5 checks passed (${usedKeys.length} English keys, ${masks.length} multiplayer masks).`);
} finally {
  await server.close();
}
