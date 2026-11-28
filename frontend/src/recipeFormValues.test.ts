import { describe, expect, it } from "vitest";
import type { Recipe } from "./backend/api/backend";
import { recipeToFormValues } from "./recipeFormValues";

function recipe(markdown: string, overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "tomato-soup",
    title: "Tomato soup",
    markdown,
    servings: 4n,
    tags: ["soup", "vegetarian"],
    ...overrides,
  };
}

const WITH_DESCRIPTION =
  "# Tomato soup\n\nA warm soup for cold days.\n\n**Servings:** 4\n\n" +
  "## Ingredients\n\n- 500 g tomatoes\n- 1 onion\n- 2 cloves garlic\n\n" +
  "## Steps\n\n1. Chop the onion and garlic.\n2. Add the tomatoes.\n3. Simmer for 20 minutes.\n";

describe("recipeToFormValues", () => {
  it("reads a recipe with a description", () => {
    expect(recipeToFormValues(recipe(WITH_DESCRIPTION))).toEqual({
      name: "Tomato soup",
      description: "A warm soup for cold days.",
      servings: 4,
      tags: ["soup", "vegetarian"],
      ingredients: ["500 g tomatoes", "1 onion", "2 cloves garlic"],
      steps: ["Chop the onion and garlic.", "Add the tomatoes.", "Simmer for 20 minutes."],
    });
  });

  it("reads a recipe without a description", () => {
    const markdown =
      "# Toast\n\n**Servings:** 1\n\n## Ingredients\n\n- 1 slice bread\n\n" +
      "## Steps\n\n1. Toast the bread.\n";
    const toast = recipe(markdown, { title: "Toast", servings: 1n, tags: [] });
    expect(recipeToFormValues(toast)).toEqual({
      name: "Toast",
      description: "",
      servings: 1,
      tags: [],
      ingredients: ["1 slice bread"],
      steps: ["Toast the bread."],
    });
  });

  it("reads multi-digit step numbers", () => {
    const steps = Array.from({ length: 12 }, (_, i) => `Step number ${i + 1}`);
    const markdown =
      "# Long one\n\n**Servings:** 2\n\n## Ingredients\n\n- water\n\n## Steps\n\n" +
      steps.map((step, i) => `${i + 1}. ${step}\n`).join("");
    expect(recipeToFormValues(recipe(markdown))?.steps).toEqual(steps);
  });

  it("reads Markdown with Windows line endings", () => {
    const values = recipeToFormValues(recipe(WITH_DESCRIPTION.replace(/\n/g, "\r\n")));
    expect(values).toEqual(recipeToFormValues(recipe(WITH_DESCRIPTION)));
    expect(values?.ingredients).toEqual(["500 g tomatoes", "1 onion", "2 cloves garlic"]);
  });

  it.each([
    ["free-form Markdown", "# Grandma's cake\n\nMix everything and bake it.\n"],
    [
      "no ingredients",
      "# Tea\n\n**Servings:** 1\n\n## Ingredients\n\n## Steps\n\n1. Boil water.\n",
    ],
    [
      "no steps",
      "# Tea\n\n**Servings:** 1\n\n## Ingredients\n\n- tea bag\n\n## Steps\n\n",
    ],
    [
      "items that are not bullets",
      "# Tea\n\n**Servings:** 1\n\n## Ingredients\n\n* tea bag\n\n## Steps\n\n1. Boil water.\n",
    ],
    ["no servings line", "# Tea\n\n## Ingredients\n\n- tea bag\n\n## Steps\n\n1. Boil water.\n"],
    ["an empty string", ""],
  ])("returns null for %s", (_, markdown) => {
    expect(recipeToFormValues(recipe(markdown))).toBeNull();
  });
});
