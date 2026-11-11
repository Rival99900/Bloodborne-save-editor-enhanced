export const BOSS_PROGRESSION = [
  {
    phase: "centralYharnam",
    bosses: [
      { name: "Cleric Beast", optional: true },
      { name: "Father Gascoigne" },
    ],
  },
  {
    phase: "cathedralWard",
    bosses: [
      { name: "Blood Starved Beast", optional: true },
      { name: "Vicar Amelia" },
      { name: "Witch Of Hemwick", optional: true },
      { name: "Dark Beast Paarl", optional: true },
    ],
  },
  {
    phase: "forbiddenWoods",
    bosses: [
      { name: "Shadow Of Yharnam" },
      { name: "Rom" },
    ],
  },
  {
    phase: "optionalBranches",
    bosses: [
      { name: "Martyr Logarius", optional: true },
      { name: "Amygdala", optional: true },
      { name: "Celestial Emissary", optional: true },
      { name: "Ebrietas", optional: true },
    ],
  },
  {
    phase: "bloodMoon",
    bosses: [
      { name: "One Reborn" },
      { name: "Micolash" },
      { name: "Mergo's Wet Nurse" },
    ],
  },
  {
    phase: "finale",
    bosses: [
      { name: "Gehrman" },
      { name: "Moon Presence", optional: true },
    ],
  },
  {
    phase: "huntersNightmare",
    dlc: true,
    bosses: [
      { name: "Ludwig" },
      { name: "Living Failures" },
      { name: "Lady Maria" },
      { name: "Kos" },
      { name: "Laurence", optional: true },
    ],
  },
];

export const BOSS_NAME_KEYS = {
  "Cleric Beast": "clericBeast",
  "Father Gascoigne": "fatherGascoigne",
  "Vicar Amelia": "vicarAmelia",
  "Celestial Emissary": "celestialEmissary",
  Ebrietas: "ebrietas",
  "Blood Starved Beast": "bloodStarvedBeast",
  "Shadow Of Yharnam": "shadowOfYharnam",
  Rom: "rom",
  "Witch Of Hemwick": "witchOfHemwick",
  "One Reborn": "oneReborn",
  "Martyr Logarius": "martyrLogarius",
  "Dark Beast Paarl": "darkbeastPaarl",
  Amygdala: "amygdala",
  "Mergo's Wet Nurse": "mergosWetNurse",
  Micolash: "micolash",
  Gehrman: "gehrman",
  "Moon Presence": "moonPresence",
  Ludwig: "ludwig",
  "Living Failures": "livingFailures",
  "Lady Maria": "ladyMaria",
  Kos: "orphanOfKos",
  Laurence: "laurence",
};

// "mp" flags are area multiplayer masks shared by several bosses, not defeat markers.
export function isMultiplayerFlag(flag) {
  return flag?._comment === "mp";
}

export function getDefeatFlags(boss) {
  return (boss?.flags ?? []).filter((flag) => !isMultiplayerFlag(flag));
}

export function isBossDefeated(boss) {
  const [defeatedFlag] = getDefeatFlags(boss);
  return Boolean(defeatedFlag && (defeatedFlag.dead_value & defeatedFlag.current_value & 0xff) !== 0);
}

// Unique multiplayer masks: the bit is cleared to allow multiplayer again.
export function getMultiplayerMasks(bosses) {
  const masks = new Map();
  for (const boss of bosses ?? []) {
    for (const flag of boss.flags ?? []) {
      if (isMultiplayerFlag(flag)) masks.set(`${flag.rel_offset}:${flag.alive_value}`, { offset: flag.rel_offset, mask: flag.alive_value });
    }
  }
  return [...masks.values()];
}
