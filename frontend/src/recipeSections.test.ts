import { describe, expect, it } from "vitest";
import { parseRecipeSections } from "./recipeSections";

const PANCAKES = `# Fluffy Pancakes

Short intro.

**Servings:** 4

## Ingredients

- 200 g plain flour
- 2 tsp baking powder

## Steps

1. Whisk the flour and baking powder.
2. Heat a pan.

> Tip: serve with syrup.
`;

describe("parseRecipeSections", () => {
  it("reads ingredients and steps from a full recipe", () => {
    expect(parseRecipeSections(PANCAKES)).toEqual({
      ingredients: ["200 g plain flour", "2 tsp baking powder"],
      steps: ["Whisk the flour and baking powder.", "Heat a pan."],
    });
  });

  it("gives no steps when the Steps section is missing", () => {
    const md = "# Toast\n\n## Ingredients\n\n- 1 slice bread\n- butter\n";
    expect(parseRecipeSections(md)).toEqual({
      ingredients: ["1 slice bread", "butter"],
      steps: [],
    });
  });

  it("gives no ingredients when the Ingredients section is missing", () => {
    const md = "# Water\n\n## Steps\n\n1. Pour a glass.\n2. Drink.\n";
    expect(parseRecipeSections(md)).toEqual({
      ingredients: [],
      steps: ["Pour a glass.", "Drink."],
    });
  });

  it("gives empty lists for empty input", () => {
    expect(parseRecipeSections("")).toEqual({ ingredients: [], steps: [] });
  });

  it("accepts '* ' bullets and keeps inline Markdown", () => {
    const md = "## Ingredients\n\n* 2 **large** eggs\n*   a pinch of salt  \n";
    expect(parseRecipeSections(md).ingredients).toEqual([
      "2 **large** eggs",
      "a pinch of salt",
    ]);
  });

  it("accepts '1)' numbering", () => {
    const md = "## Steps\n\n1) Boil water.\n2) Add pasta.\n10) Serve.\n";
    expect(parseRecipeSections(md).steps).toEqual([
      "Boil water.",
      "Add pasta.",
      "Serve.",
    ]);
  });

  it("joins an indented continuation line onto its step", () => {
    const md =
      "## Steps\n\n1. Fold the egg whites into the batter\n   until no streaks remain.\n2. Bake.\n";
    expect(parseRecipeSections(md).steps).toEqual([
      "Fold the egg whites into the batter until no streaks remain.",
      "Bake.",
    ]);
  });

  it("does not turn a trailing blockquote tip or paragraph into a step", () => {
    const md =
      "## Steps\n\n1. Mix.\n2. Bake.\n\n> Tip: let it cool first.\n\nEnjoy!\n";
    expect(parseRecipeSections(md).steps).toEqual(["Mix.", "Bake."]);
  });

  it("does not continue a step across a blank line", () => {
    const md = "## Steps\n\n1. Mix.\n\n   Indented paragraph.\n2. Bake.\n";
    expect(parseRecipeSections(md).steps).toEqual(["Mix.", "Bake."]);
  });

  it("handles CRLF line endings", () => {
    const md = PANCAKES.replace(/\n/g, "\r\n");
    expect(parseRecipeSections(md)).toEqual({
      ingredients: ["200 g plain flour", "2 tsp baking powder"],
      steps: ["Whisk the flour and baking powder.", "Heat a pan."],
    });
  });

  it("matches headings case-insensitively at level 2 or 3 with trailing spaces", () => {
    const md = "### INGREDIENTS   \n- salt\n\n### steps \n1. Season.\n";
    expect(parseRecipeSections(md)).toEqual({
      ingredients: ["salt"],
      steps: ["Season."],
    });
  });

  it("ignores Ingredients and Steps headings at other levels", () => {
    const md = "# Ingredients\n- salt\n\n#### Steps\n1. Season.\n";
    expect(parseRecipeSections(md)).toEqual({ ingredients: [], steps: [] });
  });

  it("ends a section at the next heading of the same or higher level", () => {
    const md = [
      "## Ingredients",
      "- flour",
      "#### For the glaze",
      "- sugar",
      "## Notes",
      "- not an ingredient",
      "## Steps",
      "1. Mix.",
      "## Serving",
      "1. Not a step.",
    ].join("\n");
    expect(parseRecipeSections(md)).toEqual({
      ingredients: ["flour", "sugar"],
      steps: ["Mix."],
    });
  });
});
