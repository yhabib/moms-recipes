import { useState, type FormEvent } from "react";
import { backend } from "../backend";
import { hrefFor, navigate, refreshRecipes } from "../router";

type Field = "name" | "servings" | "ingredients" | "steps";
type FieldErrors = Partial<Record<Field, string>>;

/** Splits a textarea into trimmed, non-empty lines. */
function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** Shows the "Add a recipe" form and saves the recipe in the backend. */
export function AddRecipeForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("4");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clearError = (field: Field) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const ingredientLines = toLines(ingredients);
    const stepLines = toLines(steps);
    const servingsText = servings.trim();

    const found: FieldErrors = {};
    if (name.trim() === "") found.name = "Enter a name.";
    if (!/^\d+$/.test(servingsText) || Number(servingsText) < 1) {
      found.servings = "Servings must be a whole number of at least 1.";
    }
    if (ingredientLines.length === 0) found.ingredients = "Add at least one ingredient.";
    if (stepLines.length === 0) found.steps = "Add at least one step.";

    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const result = await backend.addRecipe({
        name: name.trim(),
        description: description.trim(),
        servings: BigInt(servingsText),
        ingredients: ingredientLines,
        steps: stepLines,
        tags: [],
      });
      if (result.__kind__ === "ok") {
        refreshRecipes();
        navigate(hrefFor({ name: "recipe", id: result.ok }));
        return;
      }
      setSubmitError(result.err);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
    setSaving(false);
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit} noValidate>
      <h2>Add a recipe</h2>

      <div className="field">
        <label htmlFor="recipe-name">Name</label>
        <input
          id="recipe-name"
          type="text"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "recipe-name-error" : undefined}
        />
        {errors.name && (
          <p id="recipe-name-error" className="field-error">
            {errors.name}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="recipe-description">Short description</label>
        <textarea
          id="recipe-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="recipe-servings">Servings</label>
        <input
          id="recipe-servings"
          className="servings-input"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          value={servings}
          onChange={(e) => {
            setServings(e.target.value);
            clearError("servings");
          }}
          aria-invalid={errors.servings ? true : undefined}
          aria-describedby={errors.servings ? "recipe-servings-error" : undefined}
        />
        {errors.servings && (
          <p id="recipe-servings-error" className="field-error">
            {errors.servings}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="recipe-ingredients">Ingredients</label>
        <p className="field-hint" id="recipe-ingredients-hint">
          One per line.
        </p>
        <textarea
          id="recipe-ingredients"
          rows={6}
          value={ingredients}
          onChange={(e) => {
            setIngredients(e.target.value);
            clearError("ingredients");
          }}
          aria-invalid={errors.ingredients ? true : undefined}
          aria-describedby={
            errors.ingredients
              ? "recipe-ingredients-hint recipe-ingredients-error"
              : "recipe-ingredients-hint"
          }
        />
        {errors.ingredients && (
          <p id="recipe-ingredients-error" className="field-error">
            {errors.ingredients}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="recipe-steps">Steps</label>
        <p className="field-hint" id="recipe-steps-hint">
          One per line.
        </p>
        <textarea
          id="recipe-steps"
          rows={6}
          value={steps}
          onChange={(e) => {
            setSteps(e.target.value);
            clearError("steps");
          }}
          aria-invalid={errors.steps ? true : undefined}
          aria-describedby={
            errors.steps ? "recipe-steps-hint recipe-steps-error" : "recipe-steps-hint"
          }
        />
        {errors.steps && (
          <p id="recipe-steps-error" className="field-error">
            {errors.steps}
          </p>
        )}
      </div>

      {submitError && (
        <p className="error" role="alert">
          Could not save the recipe: {submitError}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? "Saving…" : "Save recipe"}
        </button>
        <a href={hrefFor({ name: "home" })}>Cancel</a>
      </div>
    </form>
  );
}
