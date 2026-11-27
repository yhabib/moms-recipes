import { describe, expect, it } from "vitest";
import { formatAmount, scaleRecipeMarkdown } from "./scaleIngredients";

describe("formatAmount", () => {
  it.each([
    [266.666, "267"],
    [10, "10"],
    [12.4, "12"],
    [1.5, "1.5"],
    [0.75, "0.75"],
    [0.333, "0.33"],
    [2 / 3, "0.67"],
    [4 / 3, "1.33"],
    [2, "2"],
    [1.4999, "1.5"],
    [1.3333333, "1.33"],
    [2.1, "2"],
    [2.9, "3"],
    [9.9, "10"],
    [0.25, "0.25"],
    [0.125, "0.13"],
    [0.2, "0.2"],
    [0.001, "0.01"],
    [0, "0"],
  ])("formats %d as %s", (value, expected) => {
    expect(formatAmount(value)).toBe(expected);
  });

  it("never prints long decimals", () => {
    for (let v = 0.01; v < 10; v += 0.037) {
      expect(formatAmount(v)).toMatch(/^\d+(\.\d{1,2})?$/);
    }
  });

  it("never rounds a positive value to 0", () => {
    for (const v of [0.0001, 0.004, 0.05, 0.1, 0.24]) {
      expect(Number(formatAmount(v))).toBeGreaterThan(0);
    }
  });
});

const recipe = `# Lentil soup

A cozy soup for 4 people.

## Ingredients

- 1 cup brown lentils, rinsed
- 2 cloves garlic, minced
- 200 g flour
- Juice of 1/2 lemon
- Salt and pepper

## Steps

1. Bake for 40 minutes at 180 °C.
- Stir 2 times.

Tip: use 3 bay leaves.
`;

describe("scaleRecipeMarkdown", () => {
  it("doubles ingredient amounts and leaves everything else unchanged", () => {
    expect(scaleRecipeMarkdown(recipe, 2)).toBe(`# Lentil soup

A cozy soup for 4 people.

## Ingredients

- 2 cup brown lentils, rinsed
- 4 cloves garlic, minced
- 400 g flour
- Juice of 1 lemon
- Salt and pepper

## Steps

1. Bake for 40 minutes at 180 °C.
- Stir 2 times.

Tip: use 3 bay leaves.
`);
  });

  it("returns the input unchanged for factor 1", () => {
    expect(scaleRecipeMarkdown(recipe, 1)).toBe(recipe);
    const odd = "## Ingredients\n- 1,50 kg x\n- 1.0 cup y";
    expect(scaleRecipeMarkdown(odd, 1)).toBe(odd);
  });

  const scaleLine = (line: string, factor: number) =>
    scaleRecipeMarkdown(`## Ingredients\n\n${line}`, factor).split("\n")[2];

  it.each([
    ["- 3 eggs", 2, "- 6 eggs"],
    ["- 1.5 cups milk", 2, "- 3 cups milk"],
    ["- 1,5 dl cream", 3, "- 4,5 dl cream"],
    ["- 1/2 tsp salt", 3, "- 1.5 tsp salt"],
    ["- 1 1/2 cups sugar", 2, "- 3 cups sugar"],
    ["- 2 1/4 cups flour", 2, "- 4.5 cups flour"],
    ["- ½ cup oil", 3, "- 1.5 cup oil"],
    ["- ¼ tsp nutmeg", 3, "- 0.75 tsp nutmeg"],
    ["- ¾ cup water", 2, "- 1.5 cup water"],
    ["- ⅓ cup honey", 2, "- 0.67 cup honey"],
    ["- ⅔ cup yogurt", 3, "- 2 cup yogurt"],
    ["- 1½ cups rice", 2, "- 3 cups rice"],
    ["- 1 ½ cups rice", 2, "- 3 cups rice"],
    ["- 1 cup broth", 1 / 3, "- 0.33 cup broth"],
    ["- 1/8 tsp cayenne", 1, "- 1/8 tsp cayenne"],
    ["- 1/8 tsp cayenne", 1.5, "- 0.19 tsp cayenne"],
    ["- 200 g flour", 4 / 3, "- 267 g flour"],
    ["- 2-3 carrots", 2, "- 4-3 carrots"],
    ["* 2 onions", 2, "* 4 onions"],
    ["  - 1 pinch sugar", 2, "  - 2 pinch sugar"],
    ["- Juice of 1/2 lemon", 2, "- Juice of 1 lemon"],
    ["- Salt and pepper", 2, "- Salt and pepper"],
    ["Serves 4", 2, "Serves 4"],
  ])("scales %j by %d to %j", (line, factor, expected) => {
    expect(scaleLine(line, factor)).toBe(expected);
  });

  it("matches the Ingredients heading at any level and case", () => {
    for (const heading of ["# INGREDIENTS", "### ingredients", "## Ingredients:"]) {
      expect(scaleRecipeMarkdown(`${heading}\n- 1 egg`, 2)).toBe(
        `${heading}\n- 2 egg`,
      );
    }
  });

  it("only touches list items under the Ingredients heading", () => {
    const md = [
      "- 1 thing before",
      "## Ingredients for the sauce",
      "- 1 cup stock",
      "## Ingredients",
      "- 1 cup stock",
      "Mix 2 spoons in.",
      "### Notes",
      "- 1 cup more if thick",
    ].join("\n");
    expect(scaleRecipeMarkdown(md, 2)).toBe(
      md.replace("## Ingredients\n- 1 cup", "## Ingredients\n- 2 cup"),
    );
  });

  it("ignores lines inside fenced code blocks", () => {
    const md = "## Ingredients\n```\n# not a heading\n- 1 x\n```\n- 1 egg";
    expect(scaleRecipeMarkdown(md, 2)).toBe(
      "## Ingredients\n```\n# not a heading\n- 1 x\n```\n- 2 egg",
    );
  });

  it("keeps Windows line endings", () => {
    expect(scaleRecipeMarkdown("## Ingredients\r\n- 1 egg\r\n", 3)).toBe(
      "## Ingredients\r\n- 3 egg\r\n",
    );
  });
});
