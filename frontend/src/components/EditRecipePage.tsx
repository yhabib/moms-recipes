import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth";
import { backend } from "../backend";
import type { NewRecipe, Recipe } from "../backend/api/backend";
import { recipeToFormValues, type RecipeFormValues } from "../recipeFormValues";
import { hrefFor, navigate, refreshRecipes } from "../router";
import { RecipeForm } from "./AddRecipeForm";

/**
 * The reply for one recipe id and one signed-in user. `key` tells which, so a
 * reply for an older id or user is never shown.
 */
type EditState =
  | { key: string; status: "loaded"; recipe: Recipe | null; canEdit: boolean }
  | { key: string; status: "error"; error: string };

/**
 * The "Edit recipe" page. Loads the recipe and whether the caller may edit it,
 * and shows the prefilled form only to the recipe's author. Calls go through
 * the shared `backend` actor, whose agent `auth.ts` signs as the current user.
 */
export function EditRecipePage({ id }: { id: string }) {
  const { status, principal } = useAuth();
  const user = status === "signedIn" && principal !== null ? principal.toText() : "";
  // Re-check `canEditRecipe` whenever the id or the signed-in user changes.
  const key = `${status}|${user}|${id}`;
  const [state, setState] = useState<EditState | null>(null);

  useEffect(() => {
    // Wait until the session is restored, so the check runs as the right user.
    if (status === "loading") return;
    let cancelled = false;
    Promise.all([backend.getRecipe(id), backend.canEditRecipe(id)])
      .then(([recipe, canEdit]) => {
        if (!cancelled) setState({ key, status: "loaded", recipe: recipe ?? null, canEdit });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key, status: "error", error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key, status]);

  const recipeHref = hrefFor({ name: "recipe", id });

  // State left over from a previous id or user counts as still loading.
  if (state === null || state.key !== key) return <p className="muted">Loading…</p>;
  if (state.status === "error") {
    return <p className="error">Could not load the recipe: {state.error}</p>;
  }
  if (state.recipe === null) {
    return (
      <div>
        <p>Recipe not found.</p>
        <p>
          <a href={hrefFor({ name: "home" })}>Back to all recipes</a>
        </p>
      </div>
    );
  }
  if (!state.canEdit) {
    return (
      <EditMessage recipeHref={recipeHref}>
        {status === "signedIn"
          ? "Only the person who added this recipe can edit it."
          : "Sign in as the person who added this recipe to edit it."}
      </EditMessage>
    );
  }

  const initial = recipeToFormValues(state.recipe);
  if (initial === null) {
    return <EditMessage recipeHref={recipeHref}>This recipe can't be edited here.</EditMessage>;
  }

  // Keyed by id and user, so switching either starts from fresh values.
  return <EditRecipeForm key={key} id={id} initial={initial} recipeHref={recipeHref} />;
}

function EditMessage({ recipeHref, children }: { recipeHref: string; children: string }) {
  return (
    <div className="recipe-form">
      <h2>Edit recipe</h2>
      <p>{children}</p>
      <p>
        <a href={recipeHref}>Back to the recipe</a>
      </p>
    </div>
  );
}

/**
 * The prefilled form. It is unmounted when the id or the user changes; a save
 * still running then does not navigate.
 */
function EditRecipeForm({
  id,
  initial,
  recipeHref,
}: {
  id: string;
  initial: RecipeFormValues;
  recipeHref: string;
}) {
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function save(input: NewRecipe): Promise<string | null> {
    if (!active.current) return "The page changed before the recipe was saved";
    const result = await backend.updateRecipe(id, input);
    if (result.__kind__ !== "ok") return result.err;
    refreshRecipes();
    if (active.current) navigate(recipeHref);
    return null;
  }

  return (
    <RecipeForm
      initial={initial}
      heading="Edit recipe"
      submitLabel="Save changes"
      cancelHref={recipeHref}
      onSave={save}
    />
  );
}
