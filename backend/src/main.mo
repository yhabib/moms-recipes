import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import LegacyRecipes "lib/LegacyRecipes";
import PlaceholderRecipes "lib/PlaceholderRecipes";
import SeedRecipes "lib/SeedRecipes";
import RecipesMixin "mixins/Recipes";
import Types "types";

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

  // Recipes added between task #47 and task #56, stored without `author`. On
  // the upgrade that introduced it, it started as a copy of
  // `addedRecipesWithTags` with no prep time, cook time or difficulty. Kept
  // with its old type so upgrades from those versions stay compatible; nothing
  // writes to it any more.
  let addedRecipesWithDetails = LegacyRecipes.withDetails(addedRecipesWithTags);

  // Recipes added through `addRecipe`, in insertion order. On the upgrade that
  // introduces it, it starts as a copy of `addedRecipesWithDetails` with no
  // author.
  let addedRecipesWithAuthor = LegacyRecipes.withAuthor(addedRecipesWithDetails);

  // Photos of recipes added through `addRecipe`, keyed by recipe id. Kept
  // apart from the recipes so `Types.Recipe` (the element type of
  // `addedRecipesWithAuthor`) does not change when photos are added. Recipes
  // without a photo have no entry.
  let recipePhotos = Map.empty<Text, Types.Photo>();

  // The placeholder and seed recipes are hard-coded in the code, not stored in
  // actor state; they are served first, followed by the added recipes. They
  // have no photos.
  include RecipesMixin(Array.concat(PlaceholderRecipes.all, SeedRecipes.all), addedRecipesWithAuthor, recipePhotos);
};
