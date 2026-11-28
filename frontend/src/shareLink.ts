import { hrefFor } from "./router";

/**
 * Builds the absolute link to a recipe page, such as
 * `https://example.org/#/recipes/apple%20cake`. Any query string or other
 * hash on the current page is left out.
 */
export function recipeShareUrl(location: { origin: string; pathname: string }, id: string): string {
  return location.origin + location.pathname + hrefFor({ name: "recipe", id });
}
