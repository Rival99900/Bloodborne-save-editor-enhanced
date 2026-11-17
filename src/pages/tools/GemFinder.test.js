import { describe, expect, it } from "vitest";
import { collectUpgrades, upgradeSignature } from "./GemFinder";

const gem = (effects, shape = "Radial") => ({
  upgrade_type: "Gem",
  shape,
  effects: effects.map((id) => [id, `e${id}`]),
});

describe("gem finder", () => {
  it("ignores effect order and empty effects in the signature", () => {
    expect(upgradeSignature(gem([2, 1, 4294967295]))).toBe(upgradeSignature(gem([1, 2])));
    expect(upgradeSignature(gem([1, 2], "Circle"))).not.toBe(upgradeSignature(gem([1, 2])));
  });

  it("counts copies across Inventory, Storage and equipped slots", () => {
    const save = {
      inventory: {
        upgrades: { Gem: [gem([1, 2])] },
        articles: {
          RightHand: [
            { id: 1, info: { item_name: "Saw" }, slots: [{ gem: gem([2, 1]) }, { gem: null }] },
          ],
        },
      },
      storage: { upgrades: { Gem: [gem([3])] }, articles: {} },
    };
    const rows = collectUpgrades(save);
    expect(rows).toHaveLength(3);
    expect(rows.filter((row) => row.copies === 2)).toHaveLength(2);
    expect(rows.find((row) => row.holder)?.holder).toEqual({ name: "Saw", slot: 1 });
  });
});
