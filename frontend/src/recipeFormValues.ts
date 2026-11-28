import type { Difficulty, Recipe } from "./backend/api/backend";

/** The values shown in the recipe form, e.g. when editing an existing recipe. */
export interface RecipeFormValues {
  name: string;
  description: string;
  servings: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
  /** Optional; blank in the form when undefined. */
  prepMinutes?: number;
  cookMinutes?: number;
  difficulty?: Difficulty;
}

const SERVINGS_LINE = /^\*\*Servings:\*\* \d+$/;
const INGREDIENT_LINE = /^- (.*)$/;
const STEP_LINE = /^\d+\. (.*)$/;

/**
 * Reads the form values back from a user-added recipe. Its Markdown has the
 * shape built by `toMarkdown` in backend/src/lib/Recipes.mo:
 *
 *     # <name>
 *
 *     <description>      (optional, followed by a blank line)
 *
 *     **Servings:** <n>
 *
 *     ## Ingredients
 *
 *     - <ingredient>
 *
 *     ## Steps
 *
 *     1. <step>
 *
 * Returns null when the Markdown does not have that shape.
 */
export function recipeToFormValues(recipe: Recipe): RecipeFormValues | null {
  const lines = recipe.markdown.split(/\r?\n/);

  if (!lines[0]?.startsWith("# ")) return null;
  const servingsIndex = lines.findIndex((line) => SERVINGS_LINE.test(line));
  const ingredientsIndex = lines.indexOf("## Ingredients");
  const stepsIndex = lines.indexOf("## Steps");
  if (
    servingsIndex < 1 ||
    ingredientsIndex < servingsIndex ||
    stepsIndex < ingredientsIndex
  ) {
    return null;
  }

  const description = lines.slice(1, servingsIndex).join("\n").trim();

  const ingredients: string[] = [];
  for (const line of lines.slice(ingredientsIndex + 1, stepsIndex)) {
    if (line.trim() === "") continue;
    const match = INGREDIENT_LINE.exec(line);
    if (!match) return null;
    ingredients.push(match[1].trim());
  }

  const steps: string[] = [];
  for (const line of lines.slice(stepsIndex + 1)) {
    if (line.trim() === "") continue;
    const match = STEP_LINE.exec(line);
    if (!match) return null;
    steps.push(match[1].trim());
  }

  if (ingredients.length === 0 || steps.length === 0) return null;

  return {
    name: recipe.title,
    description,
    servings: Number(recipe.servings),
    tags: [...recipe.tags],
    ingredients,
    steps,
    prepMinutes: recipe.prepMinutes === undefined ? undefined : Number(recipe.prepMinutes),
    cookMinutes: recipe.cookMinutes === undefined ? undefined : Number(recipe.cookMinutes),
    difficulty: recipe.difficulty,
  };
}
