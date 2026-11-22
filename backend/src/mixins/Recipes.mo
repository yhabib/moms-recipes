import Array "mo:core/Array";
import Types "../types";

/// Public recipe API. `recipes` is injected by main.mo.
mixin (recipes : [Types.Recipe]) {
  public query func listRecipes() : async [Types.RecipeSummary] {
    recipes.map<Types.Recipe, Types.RecipeSummary>(func r = { id = r.id; title = r.title });
  };

  public query func getRecipe(id : Text) : async ?Types.Recipe {
    recipes.find(func r = r.id == id);
  };
};
