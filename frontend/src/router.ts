import { useEffect, useState } from "react";

// A tiny hash router. Hash URLs (`#/recipes/apple-cake`) keep working on a
// page reload because the asset canister always serves index.html for `/`,
// so no server-side rewrite rules are needed.

/** Every page the app can show. Add a new variant here to add a route. */
export type Route =
  | { name: "home" }
  | { name: "newRecipe" }
  | { name: "recipe"; id: string }
  | { name: "notFound"; path: string };

/** Parses a location hash such as `#/recipes/apple-cake` into a route. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  if (path === "/") return { name: "home" };

  // Checked before `/recipes/:id` so that "new" is never read as a recipe id.
  if (/^\/recipes\/new\/?$/.test(path)) return { name: "newRecipe" };

  const recipe = /^\/recipes\/([^/]+)\/?$/.exec(path);
  if (recipe) {
    try {
      return { name: "recipe", id: decodeURIComponent(recipe[1]) };
    } catch {
      // Malformed percent-encoding: fall through to "not found".
    }
  }

  return { name: "notFound", path };
}

/** Builds the `href` for a route, encoding any path parameters. */
export function hrefFor(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "newRecipe":
      return "#/recipes/new";
    case "recipe":
      return `#/recipes/${encodeURIComponent(route.id)}`;
    case "notFound":
      return `#${route.path}`;
  }
}

/** Navigates to a path such as `/recipes/apple-cake` by setting the hash. */
export function navigate(path: string): void {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}

/** Returns the current route and re-renders when the hash changes. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}

// Lets other code ask the mounted App to reload the recipe list, for example
// after a recipe has been added or changed.
const recipeListeners = new Set<() => void>();

/** Reloads the recipe list shown in the sidebar. */
export function refreshRecipes(): void {
  recipeListeners.forEach((listener) => listener());
}

/** Registers a recipe-list reload callback; returns an unsubscribe function. */
export function onRefreshRecipes(listener: () => void): () => void {
  recipeListeners.add(listener);
  return () => {
    recipeListeners.delete(listener);
  };
}
