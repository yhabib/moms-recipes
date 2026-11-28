import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Text "mo:core/Text";
import RecipesLib "../lib/Recipes";
import Search "../lib/Search";
import Summary "../lib/Summary";
import Types "../types";

/// Public recipe API. main.mo injects the hard-coded `placeholders` and the
/// persistent `added` list, which keeps user-added recipes in insertion order,
/// the persistent `photos` map from recipe id to that recipe's photo, and the
/// persistent `authors` map from a user-added recipe's id to the principal
/// that added it.
mixin (
  placeholders : [Types.Recipe],
  added : List.List<Types.Recipe>,
  photos : Map.Map<Text, Types.Photo>,
  authors : Map.Map<Text, Principal>,
) {
  func findRecipe(id : Text) : ?Types.Recipe {
    switch (Array.find<Types.Recipe>(placeholders, func r = r.id == id)) {
      case (?r) ?r;
      case null List.find<Types.Recipe>(added, func r = r.id == id);
    };
  };

  func summary(r : Types.Recipe) : Types.RecipeSummary = {
    id = r.id;
    title = r.title;
    description = Summary.description(r.markdown);
    servings = r.servings;
    tags = r.tags;
    hasPhoto = Map.containsKey(photos, Text.compare, r.id);
  };

  public query func listRecipes() : async [Types.RecipeSummary] {
    Array.concat(
      Array.map<Types.Recipe, Types.RecipeSummary>(placeholders, summary),
      List.toArray(List.map<Types.Recipe, Types.RecipeSummary>(added, summary)),
    );
  };

  /// Recipes whose title or ingredient lines contain `searchText` (trimmed,
  /// case-insensitive), in `listRecipes` order. Empty or over-long queries return [].
  public query func searchRecipes(searchText : Text) : async [Types.RecipeSummary] {
    let q = Search.trim(searchText);
    if (q == "" or q.size() > Search.maxQueryLength) return [];
    let isMatch = func(r : Types.Recipe) : Bool = Search.matches(r, q);
    Array.concat(
      Array.map<Types.Recipe, Types.RecipeSummary>(Array.filter<Types.Recipe>(placeholders, isMatch), summary),
      List.toArray(List.map<Types.Recipe, Types.RecipeSummary>(List.filter<Types.Recipe>(added, isMatch), summary)),
    );
  };

  public query func getRecipe(id : Text) : async ?Types.Recipe {
    findRecipe(id);
  };

  /// Adds a recipe and returns its id, or a readable error if the input is invalid.
  /// A non-anonymous caller is remembered as the recipe's author.
  public shared ({ caller }) func addRecipe(input : Types.NewRecipe) : async Result.Result<Text, Text> {
    switch (RecipesLib.create(input, func id = findRecipe(id) != null)) {
      case (#err(e)) #err(e);
      case (#ok(recipe)) {
        List.add(added, recipe);
        switch (input.photo) {
          case (?photo) Map.add(photos, Text.compare, recipe.id, photo);
          case null {};
        };
        if (not Principal.isAnonymous(caller)) {
          Map.add(authors, Text.compare, recipe.id, caller);
        };
        #ok(recipe.id);
      };
    };
  };

  /// The photo of the recipe with this id, or null if it has none or does not exist.
  public query func getRecipePhoto(id : Text) : async ?Types.Photo {
    Map.get(photos, Text.compare, id);
  };

  /// True if the caller may edit the recipe: the caller is not anonymous and
  /// added this recipe through `addRecipe`. Placeholder and seed recipes,
  /// recipes added before authors were recorded or added anonymously, and
  /// unknown ids return false.
  public shared query ({ caller }) func canEditRecipe(id : Text) : async Bool {
    if (Principal.isAnonymous(caller)) return false;
    if (Array.find<Types.Recipe>(placeholders, func r = r.id == id) != null) return false;
    switch (Map.get(authors, Text.compare, id)) {
      case (?author) author == caller;
      case null false;
    };
  };
};
