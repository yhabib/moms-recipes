import List "mo:core/List";
import LegacyRecipes "lib/LegacyRecipes";
import PlaceholderRecipes "lib/PlaceholderRecipes";
import RecipesMixin "mixins/Recipes";

actor {
  // Persistent variables: the project builds with --default-persistent-actors,
  // so their values survive upgrades and an initializer runs only when an
  // install or upgrade first introduces the variable.

  // Recipes added before task #15, stored without `servings`. Kept with its
  // old type so upgrades from those versions stay compatible; nothing writes
  // to it any more.
  let addedRecipes = List.empty<LegacyRecipes.RecipeV1>();

  // Recipes added between task #15 and task #24, stored without `tags`. On the
  // upgrade that introduced it, it started as a copy of `addedRecipes` with
  // `servings` read from the Markdown. Kept with its old type so upgrades from
  // those versions stay compatible; nothing writes to it any more.
  let addedRecipesWithServings = LegacyRecipes.withServings(addedRecipes);

  // Recipes added between task #24 and task #47, stored without
  // `prepMinutes`, `cookMinutes` and `difficulty`. On the upgrade that
  // introduced it, it started as a copy of `addedRecipesWithServings` with no
  // tags. Kept with its old type so upgrades from those versions stay
  // compatible; nothing writes to it any more.
  let addedRecipesWithTags = LegacyRecipes.withTags(addedRecipesWithServings);

  // Recipes added through `addRecipe`, in insertion order. On the upgrade that
  // introduces it, it starts as a copy of `addedRecipesWithTags` with no prep
  // time, cook time or difficulty.
  let addedRecipesWithDetails = LegacyRecipes.withDetails(addedRecipesWithTags);

  include RecipesMixin(PlaceholderRecipes.all, addedRecipesWithDetails);
};
