import { describe, expect, it } from "vitest";
import {
  buildExport,
  importCounts,
  parseImport,
  selectImport,
  toCsv,
  TRANSFER_FORMAT,
} from "./containerTransfer";

const container = {
  articles: {
    Consumable: [{ id: 1000, amount: 20, info: { item_name: "Blood Vial" } }],
    RightHand: [
      {
        id: 7001000,
        info: { item_name: "Saw Cleaver" },
        slots: [
          {
            shape: "Radial",
            gem: {
              upgrade_type: "Gem",
              shape: "Radial",
              effects: [
                [127320, "ATK UP"],
                [4294967295, "No Effect"],
              ],
              info: { name: 'Gem, "quoted"' },
            },
          },
        ],
      },
    ],
    Armor: [{ id: 290000, info: { item_name: "Hunter Garb" } }],
  },
  upgrades: {
    Rune: [
      { upgrade_type: "Rune", shape: "Oath", effects: [[20000, "Rune"]], info: { name: "Oath" } },
    ],
  },
};

describe("container transfer", () => {
  it("exports base weapon ids with their level and slots", () => {
    const data = buildExport(container, "inventory");
    expect(data.format).toBe(TRANSFER_FORMAT);
    expect(data.equipment[0]).toMatchObject({ id: 7000000, armor: false, level: 10 });
    expect(data.equipment[0].slots).toEqual([
      {
        shape: "Radial",
        gem: { upgrade_type: "Gem", shape: "Radial", effects: [127320], name: 'Gem, "quoted"' },
      },
    ]);
    expect(data.equipment[1]).toMatchObject({ id: 290000, armor: true, level: 0, slots: [] });
    // Loose upgrades only: equipped Gems travel with their weapon.
    expect(data.upgrades.map((u) => u.effects)).toEqual([[20000]]);
  });

  it("selects a category, with or without the Gems of the equipment", () => {
    const data = parseImport(JSON.stringify(buildExport(container, "inventory")), "a.json");
    expect(importCounts(data)).toEqual({
      all: 4,
      items: 1,
      weapons: 1,
      armor: 1,
      gems: 0,
      runes: 1,
    });
    const weapons = selectImport(data, "weapons", true);
    expect(weapons.items).toEqual([]);
    expect(weapons.equipment).toHaveLength(1);
    expect(weapons.equipment[0].slots[0].gem.effects).toEqual([127320]);
    expect(selectImport(data, "weapons", false).equipment[0].slots).toEqual([]);
    expect(selectImport(data, "runes").upgrades).toHaveLength(1);
    expect(selectImport(data, "gems").upgrades).toHaveLength(0);
    // Old v1 files still import.
    const v1 = {
      format: "bloodborne-save-editor.container.v1",
      equipment: [{ id: 1, armor: true, level: 0 }],
    };
    expect(parseImport(JSON.stringify(v1), "a.json").equipment[0].slots).toEqual([]);
  });

  it("round-trips through JSON and CSV", () => {
    const data = buildExport(container, "storage");
    const expected = parseImport(JSON.stringify(data), "x.json");
    expect(parseImport(toCsv(data), "x.csv")).toEqual(expected);
    expect(expected.items).toEqual([{ id: 1000, amount: 20 }]);
  });

  it("rejects foreign or invalid files", () => {
    expect(() => parseImport('{"presets": []}', "a.json")).toThrow("format");
    expect(() => parseImport("a,b\n1,2", "a.csv")).toThrow("columns");
    const bad = {
      format: TRANSFER_FORMAT,
      upgrades: [{ upgrade_type: "Gem", shape: "Square", effects: [1] }],
    };
    expect(() => parseImport(JSON.stringify(bad), "a.json")).toThrow("value");
    const level = { format: TRANSFER_FORMAT, equipment: [{ id: 1, armor: false, level: 11 }] };
    expect(() => parseImport(JSON.stringify(level), "a.json")).toThrow("value");
  });
});
