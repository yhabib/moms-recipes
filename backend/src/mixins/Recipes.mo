import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Text "mo:core/Text";
import Favourites "../lib/Favourites";
import RecipesLib "../lib/Recipes";
import Search "../lib/Search";
import Summary "../lib/Summary";
import Types "../types";

/// Public recipe API. main.mo injects the hard-coded `placeholders` and the
/// persistent `added` list, which keeps user-added recipes in insertion order,
/// the persistent `photos` map from recipe id to that recipe's photo, and the
/// persistent `favourites` store, keyed by the caller's principal.
mixin (
  placeholders : [Types.Recipe],
  added : List.List<Types.Recipe>,
  photos : Map.Map<Text, Types.Photo>,
  favourites : Favourites.Store,
) {
  let signInError = "Sign in to save favourites.";

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
  public func addRecipe(input : Types.NewRecipe) : async Result.Result<Text, Text> {
    switch (RecipesLib.create(input, func id = findRecipe(id) != null)) {
      case (#err(e)) #err(e);
      case (#ok(recipe)) {
        List.add(added, recipe);
        switch (input.photo) {
          case (?photo) Map.add(photos, Text.compare, recipe.id, photo);
          case null {};
        };
        #ok(recipe.id);
      };
    };
  };

  /// Adds a recipe to the caller's favourites. Anonymous callers and unknown
  /// recipe ids get `#err`; adding a recipe that is already a favourite is `#ok`.
  public shared ({ caller }) func addFavourite(recipeId : Text) : async Result.Result<(), Text> {
    if (Principal.isAnonymous(caller)) return #err(signInError);
    if (findRecipe(recipeId) == null) return #err("Recipe not found.");
    Favourites.add(favourites, caller, recipeId);
    #ok;
  };

  /// Removes a recipe from the caller's favourites. Anonymous callers get
  /// `#err`; removing an id that is not a favourite is `#ok`.
  public shared ({ caller }) func removeFavourite(recipeId : Text) : async Result.Result<(), Text> {
    if (Principal.isAnonymous(caller)) return #err(signInError);
    Favourites.remove(favourites, caller, recipeId);
    #ok;
  };

  /// The caller's favourite recipes, in `listRecipes` order. Anonymous callers
  /// and callers without favourites get []; ids of missing recipes are skipped.
  public shared query ({ caller }) func listFavourites() : async [Types.RecipeSummary] {
    if (Principal.isAnonymous(caller) or not Favourites.hasAny(favourites, caller)) return [];
    let isFavourite = func(r : Types.Recipe) : Bool = Favourites.has(favourites, caller, r.id);
    Array.concat(
      Array.map<Types.Recipe, Types.RecipeSummary>(Array.filter<Types.Recipe>(placeholders, isFavourite), summary),
      List.toArray(List.map<Types.Recipe, Types.RecipeSummary>(List.filter<Types.Recipe>(added, isFavourite), summary)),
    );
  };

  /// The photo of the recipe with this id, or null if it has none or does not exist.
  public query func getRecipePhoto(id : Text) : async ?Types.Photo {
    Map.get(photos, Text.compare, id);
  };
};
