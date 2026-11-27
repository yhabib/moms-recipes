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

  // Recipes added through `addRecipe`, in insertion order. On the upgrade that
  // introduces it, it starts as a copy of `addedRecipes` with `servings` read
  // from the Markdown.
  let addedRecipesWithServings = LegacyRecipes.withServings(addedRecipes);

  include RecipesMixin(PlaceholderRecipes.all, addedRecipesWithServings);
};
