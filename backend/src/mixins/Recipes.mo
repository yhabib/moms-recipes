import Array "mo:core/Array";
import List "mo:core/List";
import Result "mo:core/Result";
import RecipesLib "../lib/Recipes";
import Types "../types";

/// Public recipe API. main.mo injects the hard-coded `placeholders` and the
/// persistent `added` list, which keeps user-added recipes in insertion order.
mixin (placeholders : [Types.Recipe], added : List.List<Types.Recipe>) {
  func findRecipe(id : Text) : ?Types.Recipe {
    switch (Array.find<Types.Recipe>(placeholders, func r = r.id == id)) {
      case (?r) ?r;
      case null List.find<Types.Recipe>(added, func r = r.id == id);
    };
  };

  public query func listRecipes() : async [Types.RecipeSummary] {
    let summary = func(r : Types.Recipe) : Types.RecipeSummary = { id = r.id; title = r.title };
    Array.concat(
      Array.map<Types.Recipe, Types.RecipeSummary>(placeholders, summary),
      List.toArray(List.map<Types.Recipe, Types.RecipeSummary>(added, summary)),
    );
  };

  public query func getRecipe(id : Text) : async ?Types.Recipe {
    findRecipe(id);
  };

  /// Adds a recipe and returns its id, or a readable error if the input is invalid.
  public func addRecipe(input : Types.NewRecipe) : async Result.Result<Text, Text> {
    switch (RecipesLib.create(input, func id = findRecipe(id) != null)) {
      case (#err(e)) #err(e);
      case (#ok(recipe)) {
        List.add(added, recipe);
        #ok(recipe.id);
      };
    };
  };
};
