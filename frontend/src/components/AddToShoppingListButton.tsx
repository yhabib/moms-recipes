import { useMemo, useState } from "react";
import type { Recipe } from "../backend/api/backend";
import { ingredientLines, scaleRecipeMarkdown } from "../scaleIngredients";
import { addRecipeToShoppingList } from "../shoppingList";

/**
 * Puts the recipe's ingredients, scaled to the servings shown, on the shopping list.
 * Clicking again replaces the recipe's entry with the current servings.
 */
export function AddToShoppingListButton({ recipe, servings }: { recipe: Recipe; servings: number }) {
  const [status, setStatus] = useState("");
  const hasIngredients = useMemo(() => ingredientLines(recipe.markdown).length > 0, [recipe.markdown]);

  function add() {
    const baseServings = Number(recipe.servings);
    const scaled = baseServings > 0;
    const items = scaled
      ? ingredientLines(scaleRecipeMarkdown(recipe.markdown, servings / baseServings))
      : ingredientLines(recipe.markdown);
    const listServings = scaled ? servings : 0;
    addRecipeToShoppingList({ recipeId: recipe.id, title: recipe.title, servings: listServings, items });

    const itemsText = `${items.length} ${items.length === 1 ? "item" : "items"}`;
    const servingsText =
      listServings > 0 ? ` for ${listServings} ${listServings === 1 ? "serving" : "servings"}` : "";
    setStatus(`Added ${itemsText}${servingsText} to your shopping list.`);
  }

  return (
    <div className="add-to-shopping-list">
      <button type="button" className="add-to-shopping-list-button" disabled={!hasIngredients} onClick={add}>
        Add to shopping list
      </button>
      {!hasIngredients && <span className="muted add-to-shopping-list-note">No ingredients to add.</span>}
      <span className="add-to-shopping-list-status" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
