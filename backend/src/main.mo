import PlaceholderRecipes "lib/PlaceholderRecipes";
import RecipesMixin "mixins/Recipes";

actor {
  include RecipesMixin(PlaceholderRecipes.all);
};
