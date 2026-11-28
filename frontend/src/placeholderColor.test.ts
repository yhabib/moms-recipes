import { describe, expect, it } from "vitest";
import { PLACEHOLDER_PALETTE, placeholderColor, placeholderInitial } from "./placeholderColor";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("placeholderColor", () => {
  it("gives the same colour for the same id", () => {
    expect(placeholderColor("abc-123")).toEqual(placeholderColor("abc-123"));
    expect(placeholderColor("")).toEqual(placeholderColor(""));
  });

  it("picks colours from the palette", () => {
    for (const id of ["", "1", "recipe-42", "🍰", "a much longer recipe id"]) {
      expect(PLACEHOLDER_PALETTE).toContainEqual(placeholderColor(id));
    }
  });

  it("spreads different ids over more than one colour", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `recipe-${i}`);
    const backgrounds = new Set(ids.map((id) => placeholderColor(id).background));
    expect(backgrounds.size).toBeGreaterThan(1);
  });

  it("has a palette of 8 to 10 colours with readable text", () => {
    expect(PLACEHOLDER_PALETTE.length).toBeGreaterThanOrEqual(8);
    expect(PLACEHOLDER_PALETTE.length).toBeLessThanOrEqual(10);
    for (const { background, foreground } of PLACEHOLDER_PALETTE) {
      expect(contrast(background, foreground)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("placeholderInitial", () => {
  it.each([
    ["apple pie", "A"],
    ["Banana bread", "B"],
    ["  crêpes", "C"],
    ["éclair", "É"],
    ["🍰 Cheesecake", "🍰"],
    ["", "?"],
    ["   ", "?"],
  ])("gives the initial of %j as %j", (title, expected) => {
    expect(placeholderInitial(title)).toBe(expected);
  });
});
