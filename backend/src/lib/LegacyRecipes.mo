import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Types "../types";

/// Recipes stored by versions before task #15, whose record had no `servings`.
module {
  /// The stored record type of `addedRecipes` before task #15. Do not change
  /// it: the persistent variable keeps this type so upgrades from those
  /// versions stay compatible.
  public type RecipeV1 = { id : Text; title : Text; markdown : Text };

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

  /// Copies V1 recipes to the current type, reading `servings` from the Markdown.
  public func withServings(old : List.List<RecipeV1>) : List.List<Types.Recipe> {
    List.map<RecipeV1, Types.Recipe>(old, func r = { r with servings = parseServings(r.markdown) });
  };
};
