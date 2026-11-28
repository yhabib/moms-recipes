import { useState } from "react";
import "./IngredientChecklist.css";

/**
 * A recipe's ingredients as check boxes, so a cook can tick off what they have added.
 * The ticks live only in this component and are not saved.
 */
export function IngredientChecklist({ ingredients }: { ingredients: string[] }) {
  const [checked, setChecked] = useState<ReadonlySet<number>>(() => new Set());
  // Start over when a different list comes in, so old ticks do not land on new items.
  const [shownIngredients, setShownIngredients] = useState(ingredients);
  if (shownIngredients !== ingredients) {
    setShownIngredients(ingredients);
    setChecked(new Set());
  }

  function toggle(index: number) {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <section className="ingredient-checklist">
      <div className="ingredient-checklist-header">
        <h2>Ingredients</h2>
        {checked.size > 0 && (
          <button
            type="button"
            className="ingredient-checklist-clear"
            onClick={() => setChecked(new Set())}
          >
            Uncheck all
          </button>
        )}
      </div>
      {ingredients.length === 0 ? (
        <p>No ingredients listed.</p>
      ) : (
        <ul className="ingredient-checklist-list">
          {ingredients.map((ingredient, index) => {
            const isChecked = checked.has(index);
            return (
              <li key={index}>
                <label
                  className={
                    isChecked
                      ? "ingredient-checklist-item ingredient-checklist-item-checked"
                      : "ingredient-checklist-item"
                  }
                >
                  <input
                    type="checkbox"
                    className="ingredient-checklist-box"
                    checked={isChecked}
                    onChange={() => toggle(index)}
                  />
                  <span className="ingredient-checklist-text">{ingredient}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
