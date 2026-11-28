/**
 * Picks a recipe id uniformly at random, never `currentId`.
 *
 * Returns null when there is no other recipe to pick: the list is empty, or
 * it holds only the recipe that is open now. `random` returns a number in
 * [0, 1), like `Math.random`; pass a fixed one in tests.
 */
export function pickRandomRecipeId(
  ids: readonly string[],
  currentId: string | null,
  random: () => number = Math.random
): string | null {
  const candidates = ids.filter((id) => id !== currentId);
  if (candidates.length === 0) return null;
  // Clamp so that a `random` returning exactly 1 still picks a valid index.
  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[index];
}
