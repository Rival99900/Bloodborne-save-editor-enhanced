import { describe, expect, it } from "vitest";
import { HUNTER_TOOLS, HUNTER_WEAPONS, isLeftHandFamily, weaponFamily } from "./trophies";

describe("trophy lists", () => {
  it("has the 26 weapons (11 left-hand) and 9 tools of the trophies", () => {
    expect(HUNTER_WEAPONS).toHaveLength(26);
    expect(HUNTER_WEAPONS.filter(isLeftHandFamily)).toHaveLength(11);
    expect(HUNTER_TOOLS).toHaveLength(9);
  });

  it("counts every variant and level of a weapon", () => {
    expect(weaponFamily(4010500)).toBe(4000000);
  });
});
