import type { RecipeSummary } from "../backend/api/backend";
import { hrefFor } from "../router";
import { RecipePhoto } from "./RecipePhoto";
import { RecipeTags } from "./RecipeTags";
import "./RecipeCards.css";

/**
 * A grid of recipe cards, in the given order. Each card shows the photo (or a
 * coloured placeholder) and the title as one link, then the short details.
 * The whole card is clickable, but there is still one link per card for
 * keyboard and screen reader users.
 */
export function RecipeCards({ recipes }: { recipes: RecipeSummary[] }) {
  if (recipes.length === 0) {
    return (
      <p className="muted">
        No recipes yet. <a href={hrefFor({ name: "newRecipe" })}>Add the first one</a>
      </p>
    );
  }
  return (
    <ul className="recipe-cards">
      {recipes.map((r) => (
        <li key={r.id} className="recipe-cards__card">
          <RecipeCardItem recipe={r} />
        </li>
      ))}
    </ul>
  );
}

function RecipeCardItem({ recipe }: { recipe: RecipeSummary }) {
  const servings = Number(recipe.servings);
  return (
    <>
      <a className="recipe-cards__link" href={hrefFor({ name: "recipe", id: recipe.id })}>
        <RecipePhoto variant="card" id={recipe.id} title={recipe.title} hasPhoto={recipe.hasPhoto} />
        <span className="recipe-cards__title">{recipe.title}</span>
      </a>
      <div className="recipe-cards__details">
        {recipe.description !== "" && <p className="recipe-cards__description">{recipe.description}</p>}
        {servings > 0 && <p className="recipe-cards__servings muted">Serves {servings}</p>}
        <RecipeTags tags={recipe.tags} />
      </div>
    </>
  );
}
