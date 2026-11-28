import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { backend } from "../backend";
import { Difficulty, type NewRecipe, type Photo } from "../backend/api/backend";
import type { RecipeFormValues } from "../recipeFormValues";
import { resizePhoto } from "../resizePhoto";
import { hrefFor, navigate, refreshRecipes } from "../router";

type Field =
  | "name"
  | "servings"
  | "prepMinutes"
  | "cookMinutes"
  | "difficulty"
  | "tags"
  | "photo"
  | "ingredients"
  | "steps";
type FieldErrors = Partial<Record<Field, string>>;

/** Splits a textarea into trimmed, non-empty lines. */
function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** Same limits as the backend (backend/src/lib/Recipes.mo). */
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;
const MAX_MINUTES = 1440;

/**
 * Parses an optional minutes field: blank means "not given" (`undefined`),
 * a whole number from 0 to MAX_MINUTES is returned as a bigint, and anything
 * else is invalid (`null`).
 */
function parseMinutes(text: string): bigint | undefined | null {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  if (!/^\d+$/.test(trimmed) || Number(trimmed) > MAX_MINUTES) return null;
  return BigInt(trimmed);
}

const DIFFICULTIES: Record<string, Difficulty> = {
  easy: Difficulty.easy,
  medium: Difficulty.medium,
  hard: Difficulty.hard,
};

/**
 * Splits comma-separated tags, trims and lowercases each one, and drops
 * blank ones and duplicates (keeping the first occurrence and its order).
 */
function toTags(text: string): string[] {
  const tags: string[] = [];
  for (const part of text.split(",")) {
    const tag = part.trim().toLowerCase();
    if (tag !== "" && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

export type { RecipeFormValues };

const EMPTY_VALUES: RecipeFormValues = {
  name: "",
  description: "",
  servings: 4,
  tags: [],
  ingredients: [],
  steps: [],
};

/** A resized photo ready to send, with an object URL for its preview. */
interface ChosenPhoto {
  photo: Photo;
  previewUrl: string;
}

export interface RecipeFormProps {
  /** Values to prefill; textareas show one item per line, tags are joined with ", ". */
  initial?: RecipeFormValues;
  heading: string;
  submitLabel: string;
  /** Shows the optional "Photo" field and sends the chosen photo. */
  withPhoto?: boolean;
  /** Where "Cancel" goes. Defaults to the home page. */
  cancelHref?: string;
  /**
   * Saves the validated recipe. Resolves to an error message to show, or null
   * on success (the caller then navigates away).
   */
  onSave: (input: NewRecipe) => Promise<string | null>;
}

/** A recipe form that validates its fields and hands the recipe to `onSave`. */
export function RecipeForm({
  initial = EMPTY_VALUES,
  heading,
  submitLabel,
  withPhoto = false,
  cancelHref = hrefFor({ name: "home" }),
  onSave,
}: RecipeFormProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [servings, setServings] = useState(String(initial.servings));
  const [prepMinutes, setPrepMinutes] = useState(
    initial.prepMinutes === undefined ? "" : String(initial.prepMinutes),
  );
  const [cookMinutes, setCookMinutes] = useState(
    initial.cookMinutes === undefined ? "" : String(initial.cookMinutes),
  );
  const [difficulty, setDifficulty] = useState<string>(initial.difficulty ?? "");
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [ingredients, setIngredients] = useState(initial.ingredients.join("\n"));
  const [steps, setSteps] = useState(initial.steps.join("\n"));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [chosenPhoto, setChosenPhoto] = useState<ChosenPhoto | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  // Counts photo choices and removals, so a resize that finishes after the
  // user picked another file or removed the photo is ignored.
  const photoRequest = useRef(0);

  // Revoke a preview URL once its photo is replaced, removed or unmounted.
  useEffect(() => {
    if (!chosenPhoto) return;
    return () => URL.revokeObjectURL(chosenPhoto.previewUrl);
  }, [chosenPhoto]);

  // Ignore a resize still running when the form goes away.
  useEffect(() => {
    const requests = photoRequest;
    return () => {
      requests.current += 1;
    };
  }, []);

  const clearError = (field: Field) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const request = ++photoRequest.current;
    setChosenPhoto(null);
    clearError("photo");
    if (!file) {
      setPreparingPhoto(false);
      return;
    }
    setPreparingPhoto(true);
    try {
      const photo = await resizePhoto(file);
      if (request !== photoRequest.current) return;
      const previewUrl = URL.createObjectURL(
        new Blob([photo.data as Uint8Array<ArrayBuffer>], { type: photo.contentType }),
      );
      setChosenPhoto({ photo, previewUrl });
    } catch (e: unknown) {
      if (request !== photoRequest.current) return;
      const message = e instanceof Error ? e.message : String(e);
      setErrors((current) => ({ ...current, photo: message }));
      if (photoInput.current) photoInput.current.value = "";
    } finally {
      if (request === photoRequest.current) setPreparingPhoto(false);
    }
  }

  function removePhoto() {
    photoRequest.current += 1;
    setChosenPhoto(null);
    setPreparingPhoto(false);
    clearError("photo");
    if (photoInput.current) photoInput.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || preparingPhoto) return;

    const ingredientLines = toLines(ingredients);
    const stepLines = toLines(steps);
    const servingsText = servings.trim();
    const tagList = toTags(tags);
    const prep = parseMinutes(prepMinutes);
    const cook = parseMinutes(cookMinutes);

    const found: FieldErrors = {};
    if (name.trim() === "") found.name = "Enter a name.";
    if (!/^\d+$/.test(servingsText) || Number(servingsText) < 1) {
      found.servings = "Servings must be a whole number of at least 1.";
    }
    if (prep === null) {
      found.prepMinutes = `Prep time must be a whole number of minutes from 0 to ${MAX_MINUTES}.`;
    }
    if (cook === null) {
      found.cookMinutes = `Cook time must be a whole number of minutes from 0 to ${MAX_MINUTES}.`;
    }
    if (tagList.length > MAX_TAGS) {
      found.tags = `Use at most ${MAX_TAGS} tags.`;
    } else if (tagList.some((tag) => [...tag].length > MAX_TAG_LENGTH)) {
      found.tags = `Each tag can be at most ${MAX_TAG_LENGTH} characters.`;
    }
    if (ingredientLines.length === 0) found.ingredients = "Add at least one ingredient.";
    if (stepLines.length === 0) found.steps = "Add at least one step.";

    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0 || prep === null || cook === null) return;

    setSaving(true);
    let error: string | null;
    try {
      error = await onSave({
        name: name.trim(),
        description: description.trim(),
        servings: BigInt(servingsText),
        ingredients: ingredientLines,
        steps: stepLines,
        tags: tagList,
        // Optional fields: leaving them `undefined` sends the empty `opt`.
        prepMinutes: prep,
        cookMinutes: cook,
        difficulty: DIFFICULTIES[difficulty],
        photo: chosenPhoto?.photo,
      });
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : String(e);
    }
    if (error === null) return;
    setSubmitError(error);
    setSaving(false);
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit} noValidate>
      <h2>{heading}</h2>

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
        <label htmlFor="recipe-prep-minutes">Prep time (minutes)</label>
        <p className="field-hint" id="recipe-prep-minutes-hint">
          Optional.
        </p>
        <input
          id="recipe-prep-minutes"
          className="servings-input"
          type="number"
          min={0}
          max={MAX_MINUTES}
          step={1}
          inputMode="numeric"
          value={prepMinutes}
          onChange={(e) => {
            setPrepMinutes(e.target.value);
            clearError("prepMinutes");
          }}
          aria-invalid={errors.prepMinutes ? true : undefined}
          aria-describedby={
            errors.prepMinutes ? "recipe-prep-minutes-hint recipe-prep-minutes-error" : "recipe-prep-minutes-hint"
          }
        />
        {errors.prepMinutes && (
          <p id="recipe-prep-minutes-error" className="field-error">
            {errors.prepMinutes}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="recipe-cook-minutes">Cook time (minutes)</label>
        <p className="field-hint" id="recipe-cook-minutes-hint">
          Optional.
        </p>
        <input
          id="recipe-cook-minutes"
          className="servings-input"
          type="number"
          min={0}
          max={MAX_MINUTES}
          step={1}
          inputMode="numeric"
          value={cookMinutes}
          onChange={(e) => {
            setCookMinutes(e.target.value);
            clearError("cookMinutes");
          }}
          aria-invalid={errors.cookMinutes ? true : undefined}
          aria-describedby={
            errors.cookMinutes ? "recipe-cook-minutes-hint recipe-cook-minutes-error" : "recipe-cook-minutes-hint"
          }
        />
        {errors.cookMinutes && (
          <p id="recipe-cook-minutes-error" className="field-error">
            {errors.cookMinutes}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="recipe-difficulty">Difficulty</label>
        <p className="field-hint" id="recipe-difficulty-hint">
          Optional.
        </p>
        <select
          id="recipe-difficulty"
          className="servings-input"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            clearError("difficulty");
          }}
          aria-invalid={errors.difficulty ? true : undefined}
          aria-describedby={
            errors.difficulty
              ? "recipe-difficulty-hint recipe-difficulty-error"
              : "recipe-difficulty-hint"
          }
        >
          <option value="">Not set</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        {errors.difficulty && (
          <p id="recipe-difficulty-error" className="field-error">
            {errors.difficulty}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="recipe-tags">Tags</label>
        <p className="field-hint" id="recipe-tags-hint">
          Optional. Separate tags with commas, e.g. soup, vegetarian.
        </p>
        <input
          id="recipe-tags"
          type="text"
          autoComplete="off"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            clearError("tags");
          }}
          aria-invalid={errors.tags ? true : undefined}
          aria-describedby={
            errors.tags ? "recipe-tags-hint recipe-tags-error" : "recipe-tags-hint"
          }
        />
        {errors.tags && (
          <p id="recipe-tags-error" className="field-error">
            {errors.tags}
          </p>
        )}
      </div>

      {withPhoto && (
        <div className="field">
          <label htmlFor="recipe-photo">Photo</label>
          <p className="field-hint" id="recipe-photo-hint">
            Optional. One photo; it is resized to at most 1200 px.
          </p>
          <input
            id="recipe-photo"
            ref={photoInput}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            aria-invalid={errors.photo ? true : undefined}
            aria-describedby={
              errors.photo ? "recipe-photo-hint recipe-photo-error" : "recipe-photo-hint"
            }
          />
          {preparingPhoto && (
            <p className="field-hint" role="status">
              Preparing photo…
            </p>
          )}
          {chosenPhoto && (
            <img
              className="photo-preview"
              src={chosenPhoto.previewUrl}
              alt="Preview of the chosen photo"
            />
          )}
          {(chosenPhoto || preparingPhoto) && (
            <button type="button" className="button-remove-photo" onClick={removePhoto}>
              Remove photo
            </button>
          )}
          {errors.photo && (
            <p id="recipe-photo-error" className="field-error">
              {errors.photo}
            </p>
          )}
        </div>
      )}

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
        <button type="submit" className="button-primary" disabled={saving || preparingPhoto}>
          {saving ? "Saving…" : submitLabel}
        </button>
        <a href={cancelHref}>Cancel</a>
      </div>
    </form>
  );
}

/** Shows the "Add a recipe" form and saves the recipe in the backend. */
export function AddRecipeForm() {
  async function addRecipe(input: NewRecipe): Promise<string | null> {
    const result = await backend.addRecipe(input);
    if (result.__kind__ !== "ok") return result.err;
    refreshRecipes();
    navigate(hrefFor({ name: "recipe", id: result.ok }));
    return null;
  }

  return <RecipeForm heading="Add a recipe" submitLabel="Save recipe" withPhoto onSave={addRecipe} />;
}
