import { useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { backend } from "./backend";
import type { Recipe, RecipeSummary } from "./backend/api/backend";
import { hrefFor, onRefreshRecipes, useRoute, type Route } from "./router";
import "./App.css";

function App() {
  const route = useRoute();
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshRecipes = useCallback(
    () =>
      backend
        .listRecipes()
        .then((list) => {
          setRecipes(list);
          setError(null);
        })
        .catch((e: unknown) => setError(String(e))),
    []
  );

  useEffect(() => {
    refreshRecipes();
    return onRefreshRecipes(refreshRecipes);
  }, [refreshRecipes]);

  const activeId = route.name === "recipe" ? route.id : null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="app-title">
          <a href={hrefFor({ name: "home" })}>Mom's Recipes</a>
        </h1>
        {recipes === null && !error && <p className="muted">Loading…</p>}
        {recipes?.length === 0 && <p className="muted">No recipes yet.</p>}
        <nav>
          <ul className="recipe-list">
            {recipes?.map((r) => (
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
      <main className="content">
        {error && <p className="error">Could not reach the backend: {error}</p>}
        <Page route={route} />
      </main>
    </div>
  );
}

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case "home":
      return <p className="muted">Select a recipe.</p>;
    case "recipe":
      return <RecipePage id={route.id} />;
    case "notFound":
      return <NotFound message="Page not found." />;
  }
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
  return (
    <article className="recipe">
      <Markdown>{state.recipe.markdown}</Markdown>
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
