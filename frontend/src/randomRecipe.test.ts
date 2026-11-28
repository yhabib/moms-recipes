import { describe, expect, it } from "vitest";
import { pickRandomRecipeId } from "./randomRecipe";

const ids = ["a", "b", "c", "d"];
const randomValues = [0, 0.1, 0.25, 0.33, 0.5, 0.66, 0.75, 0.9, 0.999];

describe("pickRandomRecipeId", () => {
  it("never returns the current id", () => {
    for (const current of ids) {
      for (const value of randomValues) {
        const picked = pickRandomRecipeId(ids, current, () => value);
        expect(picked).not.toBe(current);
        expect(ids).toContain(picked);
      }
    }
  });

  it("can return each of the other ids", () => {
    const picked = new Set(randomValues.map((v) => pickRandomRecipeId(ids, "b", () => v)));
    expect([...picked].sort()).toEqual(["a", "c", "d"]);
  });

  it("splits the random range evenly between the other ids", () => {
    expect(pickRandomRecipeId(ids, "b", () => 0)).toBe("a");
    expect(pickRandomRecipeId(ids, "b", () => 0.34)).toBe("c");
    expect(pickRandomRecipeId(ids, "b", () => 0.999)).toBe("d");
  });

  it("returns null for an empty list", () => {
    expect(pickRandomRecipeId([], null, () => 0.5)).toBeNull();
    expect(pickRandomRecipeId([], "a", () => 0.5)).toBeNull();
  });

  it("returns null when the only recipe is the current one", () => {
    for (const value of randomValues) {
      expect(pickRandomRecipeId(["a"], "a", () => value)).toBeNull();
    }
  });

  it("returns the only other recipe when there are two", () => {
    for (const value of randomValues) {
      expect(pickRandomRecipeId(["a", "b"], "a", () => value)).toBe("b");
    }
  });

  it("may pick any id when no recipe is open", () => {
    const picked = new Set(randomValues.map((v) => pickRandomRecipeId(ids, null, () => v)));
    expect([...picked].sort()).toEqual(ids);
    expect(pickRandomRecipeId(["a"], null, () => 0.5)).toBe("a");
  });

  it("may pick any id when the current id is not in the list", () => {
    const picked = new Set(randomValues.map((v) => pickRandomRecipeId(ids, "zzz", () => v)));
    expect([...picked].sort()).toEqual(ids);
  });

  it("stays in range when random returns 1", () => {
    expect(pickRandomRecipeId(ids, "d", () => 1)).toBe("c");
  });

  it("uses Math.random by default", () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickRandomRecipeId(ids, "a");
      expect(["b", "c", "d"]).toContain(picked);
    }
  });
});
