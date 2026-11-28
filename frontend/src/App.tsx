import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import { backend } from "./backend";
import type { Recipe, RecipeSummary } from "./backend/api/backend";
import { AddedByYou } from "./components/AddedByYou";
import { AddRecipeForm } from "./components/AddRecipeForm";
import { AddToShoppingListButton } from "./components/AddToShoppingListButton";
import { AppNav } from "./components/AppNav";
import { AuthButton } from "./components/AuthButton";
import { CookMode } from "./components/CookMode";
import { EditRecipePage } from "./components/EditRecipePage";
import { RecipeActions } from "./components/RecipeActions";
import { RecipeCards } from "./components/RecipeCards";
import { RecipeFacts } from "./components/RecipeFacts";
import { RecipePhoto } from "./components/RecipePhoto";
import { RecipeSearch } from "./components/RecipeSearch";
import { RecipeTags } from "./components/RecipeTags";
import { ShoppingListPage } from "./components/ShoppingList";
import { TagFilter } from "./components/TagFilter";
import { pickRandomRecipeId } from "./randomRecipe";
import { splitTitle } from "./recipeMarkdown";
import { hrefFor, onRefreshRecipes, useRoute, type Route } from "./router";
import ServingScaler from "./ServingScaler";
import { scaleRecipeMarkdown, withServings } from "./scaleIngredients";
import { distinctTags, filterByTag } from "./tagFilter";
import "./App.css";

/** How long to wait after the last keystroke before searching. */
const SEARCH_DEBOUNCE_MS = 250;

/** The latest search reply, with the query it answers. */
type SearchState =
  | { query: string; status: "done"; results: RecipeSummary[] }
  | { query: string; status: "error"; error: string };

function App() {
  const route = useRoute();
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const refreshRecipes = useCallback(
    () =>
      backend
        .listRecipes()
        .then((list) => {
          setRecipes(list);
          setError(null);
          // Drop a selected tag that no recipe has any more.
          setSelectedTag((tag) =>
            tag !== null && !list.some((r) => r.tags.includes(tag)) ? null : tag
          );
        })
        .catch((e: unknown) => setError(String(e))),
    []
  );

  useEffect(() => {
    refreshRecipes();
    return onRefreshRecipes(refreshRecipes);
  }, [refreshRecipes]);

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState | null>(null);
  const searchText = query.trim();

  const changeQuery = (text: string) => {
    setQuery(text);
    // Start the next search from scratch instead of showing old results.
    if (text.trim() === "") setSearch(null);
  };

  useEffect(() => {
    if (searchText === "") return;
    let cancelled = false;
    const timer = setTimeout(() => {
      backend
        .searchRecipes(searchText)
        .then((results) => {
          if (!cancelled) setSearch({ query: searchText, status: "done", results });
        })
        .catch((e: unknown) => {
          if (!cancelled) setSearch({ query: searchText, status: "error", error: String(e) });
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `recipes` is a dependency so that the results follow a reloaded list.
  }, [searchText, recipes]);

  // The recipe being edited stays highlighted in the sidebar too.
  const activeId = route.name === "recipe" || route.name === "editRecipe" ? route.id : null;
  const tags = recipes === null ? [] : distinctTags(recipes);

  // Picks from the full list, not the search results, and never the open recipe.
  const recipeIds = recipes?.map((r) => r.id) ?? [];
  const canSurprise = recipeIds.some((id) => id !== activeId);
  const openRandomRecipe = () => {
    const id = pickRandomRecipeId(recipeIds, activeId);
    if (id !== null) window.location.hash = hrefFor({ name: "recipe", id });
  };

  let shown: RecipeSummary[] | null;
  let status: ReactNode = null;
  if (searchText === "") {
    shown = recipes;
    if (recipes === null && !error) status = <p className="muted">Loading…</p>;
    if (recipes?.length === 0) status = <p className="muted">No recipes yet.</p>;
  } else if (search?.status === "done" && search.query === searchText) {
    // Only a reply for the current query counts; an older reply falls
    // through to "Searching…" below until the new one arrives.
    shown = search.results;
    if (search.results.length === 0) status = <p className="muted">No recipes match.</p>;
  } else if (search?.status === "error" && search.query === searchText) {
    shown = null;
    status = <p className="error">Could not search the recipes: {search.error}</p>;
  } else {
    shown = null;
    status = <p className="muted">Searching…</p>;
  }
  // The tag narrows both the full list and the search results.
  if (shown !== null && shown.length > 0 && selectedTag !== null) {
    shown = filterByTag(shown, selectedTag);
    if (shown.length === 0) status = <p className="muted">No recipes match.</p>;
  }

  return (
    <div className="layout">
      <AppNav route={route}>
        <AuthButton />
        <a
          className={route.name === "newRecipe" ? "add-recipe-link active" : "add-recipe-link"}
          href={hrefFor({ name: "newRecipe" })}
          aria-current={route.name === "newRecipe" ? "page" : undefined}
        >
          + Add a recipe
        </a>
        <button
          type="button"
          className="surprise-button"
          onClick={openRandomRecipe}
          disabled={!canSurprise}
          aria-label="Open a random recipe"
          title="Open a random recipe"
        >
          Surprise me
        </button>
        <a
          className={route.name === "shoppingList" ? "shopping-list-link active" : "shopping-list-link"}
          href={hrefFor({ name: "shoppingList" })}
          aria-current={route.name === "shoppingList" ? "page" : undefined}
        >
          Shopping list
        </a>
        <RecipeSearch value={query} onChange={changeQuery} />
        <TagFilter tags={tags} selected={selectedTag} onChange={setSelectedTag} />
        <div role="status">{status}</div>
        <nav aria-label={searchText === "" ? "Recipes" : "Search results"}>
          <ul className="recipe-list">
            {shown?.map((r) => (
              <li key={r.id}>
                <a
                  className={r.id === activeId ? "recipe-link active" : "recipe-link"}
                  href={hrefFor({ name: "recipe", id: r.id })}
                  aria-current={r.id === activeId ? "page" : undefined}
                >
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </AppNav>
      <main className={route.name === "home" ? "content content-wide" : "content"}>
        {error && <p className="error">Could not reach the backend: {error}</p>}
        <Page route={route} recipes={recipes} failed={error !== null} />
      </main>
    </div>
  );
}

function Page({
  route,
  recipes,
  failed,
}: {
  route: Route;
  recipes: RecipeSummary[] | null;
  failed: boolean;
}) {
  switch (route.name) {
    case "home":
      return <HomePage recipes={recipes} failed={failed} />;
    case "newRecipe":
      return <AddRecipeForm />;
    case "recipe":
      return <RecipePage id={route.id} />;
    case "editRecipe":
      return <EditRecipePage id={route.id} />;
    case "shoppingList":
      return <ShoppingListPage />;
    case "notFound":
      return <NotFound message="Page not found." />;
  }
}

/**
 * Every recipe as a card with its photo, in `listRecipes` order. Always the full list:
 * the sidebar search does not filter it.
 */
function HomePage({ recipes, failed }: { recipes: RecipeSummary[] | null; failed: boolean }) {
  let body: ReactNode;
  if (recipes === null) {
    // When loading failed, the error above the page already says so.
    body = failed ? null : <p className="muted">Loading…</p>;
  } else {
    body = <RecipeCards recipes={recipes} />;
  }
  return (
    <section className="home" aria-labelledby="home-heading">
      <h2 id="home-heading" className="home-heading">
        All recipes
      </h2>
      {body}
    </section>
  );
}

type RecipeState =
  | { id: string; status: "loaded"; recipe: Recipe | null }
  | { id: string; status: "error"; error: string };

function RecipePage({ id }: { id: string }) {
  const [state, setState] = useState<RecipeState | null>(null);

  useEffect(() => {
    let cancelled = false;
    backend
      .getRecipe(id)
      .then((r) => {
        if (!cancelled) setState({ id, status: "loaded", recipe: r ?? null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ id, status: "error", error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // State left over from a previous id counts as still loading.
  if (state === null || state.id !== id) return <p className="muted">Loading…</p>;
  if (state.status === "error") {
    return <p className="error">Could not load the recipe: {state.error}</p>;
  }
  if (state.recipe === null) return <NotFound message="Recipe not found." />;
  return <RecipeView key={id} recipe={state.recipe} />;
}

function RecipeView({ recipe }: { recipe: Recipe }) {
  const baseServings = Number(recipe.servings);
  const [servings, setServings] = useState(baseServings);
  const [cooking, setCooking] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const wasCookingRef = useRef(false);
  const markdown =
    baseServings > 0
      ? withServings(scaleRecipeMarkdown(recipe.markdown, servings / baseServings), servings)
      : recipe.markdown;
  // The header shows the title, so the Markdown body leaves out its `# Title` line.
  const { body } = splitTitle(markdown);

  // When cook mode closes, give focus back to the button that opened it.
  // This runs after CookMode has unmounted, so it has the last word on focus.
  useEffect(() => {
    if (wasCookingRef.current && !cooking) startButtonRef.current?.focus();
    wasCookingRef.current = cooking;
  }, [cooking]);

  return (
    <article className="recipe">
      <RecipeActions id={recipe.id} />
      <header className="recipe-header">
        <h1 className="recipe-title">{recipe.title}</h1>
        <AddedByYou author={recipe.author ?? null} />
        {(recipe.tags.length > 0 || baseServings > 0) && (
          <div className="recipe-meta">
            <RecipeTags tags={recipe.tags} />
            {baseServings > 0 && (
              <ServingScaler servings={servings} onChange={setServings} baseServings={baseServings} />
            )}
          </div>
        )}
        <RecipeFacts
          prepMinutes={recipe.prepMinutes}
          cookMinutes={recipe.cookMinutes}
          difficulty={recipe.difficulty}
        />
      </header>
      <RecipePhoto id={recipe.id} title={recipe.title} variant="hero" />
      <div className="recipe-actions">
        <AddToShoppingListButton recipe={recipe} servings={servings} />
        <button ref={startButtonRef} type="button" className="button-primary" onClick={() => setCooking(true)}>
          Start cooking
        </button>
      </div>
      <div className="recipe-body">
        <Markdown>{body}</Markdown>
      </div>
      {cooking && <CookMode title={recipe.title} markdown={markdown} onExit={() => setCooking(false)} />}
    </article>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <div>
      <p>{message}</p>
      <p>
        <a href={hrefFor({ name: "home" })}>Back to all recipes</a>
      </p>
    </div>
  );
}

export default App;
