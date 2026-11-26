import List "mo:core/List";
import PlaceholderRecipes "lib/PlaceholderRecipes";
import RecipesMixin "mixins/Recipes";
import Types "types";

actor {
  // Recipes added through `addRecipe`, in insertion order. Persistent: the
  // project builds with --default-persistent-actors, so this survives upgrades.
  let addedRecipes = List.empty<Types.Recipe>();

  include RecipesMixin(PlaceholderRecipes.all, addedRecipes);
};
