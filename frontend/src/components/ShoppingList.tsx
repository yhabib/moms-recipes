import { useId } from "react";
import { hrefFor } from "../router";
import {
  clearShoppingList,
  toggleShoppingItem,
  useShoppingList,
  type ShoppingListRecipe,
} from "../shoppingList";
import "./ShoppingList.css";

/** "for 1 serving", "for 4 servings", or "" when servings is 0. */
function servingsLabel(servings: number): string {
  if (servings === 0) return "";
  return `for ${servings} ${servings === 1 ? "serving" : "servings"}`;
}

function ShoppingListSection({ recipe }: { recipe: ShoppingListRecipe }) {
  const tickedCount = recipe.items.filter((item) => item.checked).length;
  const servings = servingsLabel(recipe.servings);
  const headingId = useId();

  return (
    <section className="shopping-list-recipe" aria-labelledby={headingId}>
      <div className="shopping-list-recipe-header">
        <h3 id={headingId} className="shopping-list-recipe-title">
          <a href={hrefFor({ name: "recipe", id: recipe.recipeId })}>{recipe.title}</a>
          {servings && <span className="shopping-list-servings"> {servings}</span>}
        </h3>
        <span className="shopping-list-count">
          {tickedCount} of {recipe.items.length} ticked off
        </span>
      </div>
      <ul className="shopping-list-items">
        {recipe.items.map((item, index) => (
          <li key={index}>
            <label
              className={
                item.checked
                  ? "shopping-list-item shopping-list-item-checked"
                  : "shopping-list-item"
              }
            >
              <input
                type="checkbox"
                className="shopping-list-box"
                checked={item.checked}
                onChange={() => toggleShoppingItem(recipe.recipeId, index)}
              />
              <span className="shopping-list-text">{item.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The shopping list page: each recipe's items as check boxes, kept in localStorage. */
export function ShoppingListPage() {
  const list = useShoppingList();

  function clear() {
    if (window.confirm("Clear the shopping list?")) clearShoppingList();
  }

  return (
    <div className="shopping-list">
      <div className="shopping-list-header">
        <h2>Shopping list</h2>
        <button
          type="button"
          className="shopping-list-clear"
          disabled={list.length === 0}
          onClick={clear}
        >
          Clear list
        </button>
      </div>
      {list.length === 0 ? (
        <p className="muted shopping-list-empty">
          Your shopping list is empty. Add ingredients from a recipe page.
        </p>
      ) : (
        list.map((recipe) => <ShoppingListSection key={recipe.recipeId} recipe={recipe} />)
      )}
    </div>
  );
}
