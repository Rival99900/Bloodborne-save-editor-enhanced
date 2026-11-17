import { describe, expect, it } from "vitest";
import { checkSave, expectedHealth, expectedLevel, MAX_LEVEL } from "./saveCheck";

const stats = (values) => Object.entries(values).map(([name, value]) => ({ name, value }));

describe("save consistency check", () => {
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

  it("derives the level from the six attributes", () => {
    expect(expectedLevel(milquetoast)).toBe(10);
    expect(MAX_LEVEL).toBe(544);
  });

  it("knows the health table", () => {
    expect(expectedHealth(11)).toBe(594);
    expect(expectedHealth(99)).toBe(1900);
    expect(expectedHealth(6)).toBeUndefined();
  });

  it("reports nothing for a fresh character and every mismatch for an edited one", () => {
    expect(checkSave({ stats: milquetoast })).toEqual([]);
    const edited = checkSave({
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
    expect(edited.map((issue) => issue.key).sort()).toEqual([
      "saveCheck.healthMismatch",
      "saveCheck.levelMismatch",
      "saveCheck.levelTooHigh",
    ]);
  });
});
