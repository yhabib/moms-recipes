import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Types "../types";

/// Recipes stored by older versions: before task #15 the record had no
/// `servings`, before task #24 it had no `tags`.
module {
  /// The stored record type of `addedRecipes` before task #15. Do not change
  /// it: the persistent variable keeps this type so upgrades from those
  /// versions stay compatible.
  public type RecipeV1 = { id : Text; title : Text; markdown : Text };

  /// The stored record type of `addedRecipesWithServings` before task #24
  /// (no `tags`). Do not change it: the persistent variable keeps this type so
  /// upgrades from those versions stay compatible.
  public type RecipeV2 = { id : Text; title : Text; markdown : Text; servings : Nat };

  /// Used only if a recipe has no `**Servings:** N` line. Every V1 recipe was
  /// built by `Recipes.toMarkdown`, which always writes that line.
  let defaultServings = 1;

  /// Servings from the first `**Servings:** N` line (N >= 1) in `markdown`.
  public func parseServings(markdown : Text) : Nat {
    for (line in Text.split(markdown, #char '\n')) {
      switch (Text.stripStart(line, #text "**Servings:** ")) {
        case (?rest) {
          switch (Nat.fromText(rest)) {
            case (?n) if (n >= 1) return n;
            case null {};
          };
        };
        case null {};
      };
    };
    defaultServings;
  };

  /// Copies V1 recipes to V2, reading `servings` from the Markdown.
  public func withServings(old : List.List<RecipeV1>) : List.List<RecipeV2> {
    List.map<RecipeV1, RecipeV2>(old, func r = { r with servings = parseServings(r.markdown) });
  };

  /// Copies V2 recipes to the current type with no tags: recipes added before
  /// task #24 had none, and recipes can't be edited.
  public func withTags(old : List.List<RecipeV2>) : List.List<Types.Recipe> {
    List.map<RecipeV2, Types.Recipe>(old, func r = { r with tags = [] });
  };
};
