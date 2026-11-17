// Boss/multiplayer flags and catalogue corrections (from the v0.6.5 checks).
import assert from "node:assert/strict";

export default async function bossesCatalog({ server, readJson }) {
  const bosses = readJson("src-tauri/resources/bosses.json");
  const armors = readJson("src-tauri/resources/armors.json");
  const weapons = readJson("src-tauri/resources/weapons.json");
  const progression = await server.ssrLoadModule("/src/pages/bosses/bossProgression.js");
  const byName = new Map(bosses.map((boss) => [boss.name, boss]));
  for (const boss of bosses) {
    const mp = boss.flags.filter(progression.isMultiplayerFlag);
    assert(mp.length <= 1, boss.name);
    assert(
      !progression.isMultiplayerFlag(boss.flags[0]),
      `${boss.name}: defeat flag must stay first`,
    );
    for (const flag of mp)
      assert.equal(flag.dead_value & flag.alive_value, 0, `${boss.name}: mask bits overlap`);
  }
  assert.equal(bosses.filter((boss) => boss.flags.some(progression.isMultiplayerFlag)).length, 20);
  const defeated = {
    ...byName.get("Cleric Beast"),
    flags: byName.get("Cleric Beast").flags.map((flag) => ({
      ...flag,
      current_value: progression.isMultiplayerFlag(flag) ? 0xff : 0,
    })),
  };
  assert.equal(progression.isBossDefeated(defeated), false, "mp bit must not count as a defeat");
  const masks = progression.getMultiplayerMasks(bosses);
  assert.equal(masks.length, new Set(masks.map(({ offset, mask }) => `${offset}:${mask}`)).size);
  assert(
    masks.some(({ offset, mask }) => offset === 1678 && mask === 223),
    "Central Yharnam mask",
  );
  for (const id of ["901000", "902000", "903000"])
    assert(!armors[id], `Default body item still listed: ${id}`);
  assert.equal(armors["301000"].item_name, "Student Uniform");
  assert.equal(armors["191000"].item_name, "Student Uniform (Cape)");
  for (const hand of Object.values(weapons))
    for (const [id, weapon] of Object.entries(hand)) {
      // Bare fists (900000) have no durability.
      assert(
        Object.hasOwn(weapon, "durability") &&
          (weapon.durability === null || Number.isInteger(weapon.durability)),
        `Missing durability: ${id}`,
      );
    }
  return `${masks.length} multiplayer masks`;
}
