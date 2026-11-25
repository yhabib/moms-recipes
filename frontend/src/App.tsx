import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { backend } from "./backend";
import type { Recipe, RecipeSummary } from "./backend/api/backend";
import ServingScaler from "./ServingScaler";
import { scaleRecipeMarkdown } from "./scaleIngredients";
import "./App.css";

function App() {
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    backend
      .listRecipes()
      .then((list) => {
        setRecipes(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    backend
      .getRecipe(selectedId)
      .then((r) => {
        if (cancelled) return;
        setRecipe(r ?? null);
        setServings(r ? Number(r.servings) : 0);
      })
      .catch((e: unknown) => setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const baseServings = recipe ? Number(recipe.servings) : 0;

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="app-title">Mom's Recipes</h1>
        {recipes === null && !error && <p className="muted">Loading…</p>}
        {recipes?.length === 0 && <p className="muted">No recipes yet.</p>}
        <nav>
          <ul className="recipe-list">
            {recipes?.map((r) => (
              <li key={r.id}>
                <button
                  className={r.id === selectedId ? "recipe-link active" : "recipe-link"}
                  onClick={() => setSelectedId(r.id)}
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="content">
        {error && <p className="error">Could not reach the backend: {error}</p>}
        {recipe ? (
          <article className="recipe">
            {baseServings > 0 && <ServingScaler servings={servings} onChange={setServings} />}
            <Markdown>
              {baseServings > 0
                ? scaleRecipeMarkdown(recipe.markdown, servings / baseServings)
                : recipe.markdown}
            </Markdown>
          </article>
        ) : (
          !error && <p className="muted">Select a recipe.</p>
        )}
      </main>
    </div>
  );
}

export default App;
