import { describe, expect, it } from "vitest";
import { weaponIsUpgradable } from "./weaponLevels";

describe("weaponIsUpgradable", () => {
  it("accepts weapons with reinforced versions, in every variant", () => {
    expect(weaponIsUpgradable(7000000)).toBe(true);
    expect(weaponIsUpgradable(7010300)).toBe(true);
    expect(weaponIsUpgradable("7020000")).toBe(true);
  });

  it("refuses NPC-only variants, weapons without durability and the Loch Shield", () => {
    expect(weaponIsUpgradable(12080000)).toBe(false);
    expect(weaponIsUpgradable(900000)).toBe(false);
    expect(weaponIsUpgradable(19100000)).toBe(false);
    expect(weaponIsUpgradable(19100500)).toBe(false);
    expect(weaponIsUpgradable("abc")).toBe(false);
  });
});
