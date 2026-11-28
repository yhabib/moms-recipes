/** The parts of a recipe summary that tag filtering needs. */
type Tagged = { tags: string[] };

/** Every distinct tag of the given recipes, sorted alphabetically. */
export function distinctTags(recipes: readonly Tagged[]): string[] {
  const tags = new Set<string>();
  for (const recipe of recipes) {
    for (const tag of recipe.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

/**
 * The recipes that have `tag`, in their original order.
 * With no tag (`null`), every recipe.
 */
export function filterByTag<T extends Tagged>(recipes: readonly T[], tag: string | null): T[] {
  if (tag === null) return [...recipes];
  return recipes.filter((recipe) => recipe.tags.includes(tag));
}
