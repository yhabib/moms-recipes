import type { RecipeSummary } from "../backend/api/backend";
import { hrefFor } from "../router";
import { RecipeTags } from "./RecipeTags";

/**
 * One recipe at a glance: title, short description, servings and tags.
 * The whole card is clickable, but the title is its only link, so screen
 * readers and keyboard users meet one link per card.
 */
export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const servings = Number(recipe.servings);
  return (
    <article className="recipe-card">
      <h2 className="recipe-card-title">
        <a href={hrefFor({ name: "recipe", id: recipe.id })}>{recipe.title}</a>
      </h2>
      {recipe.description !== "" && (
        <p className="recipe-card-description">{recipe.description}</p>
      )}
      {servings > 0 && (
        <p className="recipe-card-servings muted">Serves {servings}</p>
      )}
      <RecipeTags tags={recipe.tags} />
    </article>
  );
}
