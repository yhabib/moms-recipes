import { useCallback, useEffect, useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import { backend } from "./backend";
import type { Recipe, RecipeSummary } from "./backend/api/backend";
import { AddedByYou } from "./components/AddedByYou";
import { AddRecipeForm } from "./components/AddRecipeForm";
import { AuthButton } from "./components/AuthButton";
import { RecipeCard } from "./components/RecipeCard";
import { RecipeFacts } from "./components/RecipeFacts";
import { RecipePhoto } from "./components/RecipePhoto";
import { RecipeSearch } from "./components/RecipeSearch";
import { RecipeTags } from "./components/RecipeTags";
import { TagFilter } from "./components/TagFilter";
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

  const activeId = route.name === "recipe" ? route.id : null;
  const tags = recipes === null ? [] : distinctTags(recipes);

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
      <aside className="sidebar">
        <h1 className="app-title">
          <a href={hrefFor({ name: "home" })}>Mom's Recipes</a>
        </h1>
        <AuthButton />
        <a
          className={route.name === "newRecipe" ? "add-recipe-link active" : "add-recipe-link"}
          href={hrefFor({ name: "newRecipe" })}
          aria-current={route.name === "newRecipe" ? "page" : undefined}
        >
          + Add a recipe
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
      </aside>
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
    case "notFound":
      return <NotFound message="Page not found." />;
  }
}

/**
 * Every recipe as a card, in `listRecipes` order. Always the full list:
 * the sidebar search does not filter it.
 */
function HomePage({ recipes, failed }: { recipes: RecipeSummary[] | null; failed: boolean }) {
  let body: ReactNode;
  if (recipes === null) {
    // When loading failed, the error above the page already says so.
    body = failed ? null : <p className="muted">Loading…</p>;
  } else if (recipes.length === 0) {
    body = (
      <p className="muted">
        No recipes yet. <a href={hrefFor({ name: "newRecipe" })}>Add the first one</a>
      </p>
    );
  } else {
    body = (
      <ul className="recipe-grid">
        {recipes.map((r) => (
          <li key={r.id}>
            <RecipeCard recipe={r} />
          </li>
        ))}
      </ul>
    );
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
  return (
    <article className="recipe">
      <RecipePhoto id={recipe.id} title={recipe.title} variant="hero" />
      <AddedByYou author={recipe.author ?? null} />
      <RecipeTags tags={recipe.tags} />
      <RecipeFacts
        prepMinutes={recipe.prepMinutes}
        cookMinutes={recipe.cookMinutes}
        difficulty={recipe.difficulty}
      />
      {baseServings > 0 && <ServingScaler servings={servings} onChange={setServings} baseServings={baseServings} />}
      <Markdown>
        {baseServings > 0
          ? withServings(scaleRecipeMarkdown(recipe.markdown, servings / baseServings), servings)
          : recipe.markdown}
      </Markdown>
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
