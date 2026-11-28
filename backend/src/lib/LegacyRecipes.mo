import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Types "../types";

/// Recipes stored by older versions: before task #15 the record had no
/// `servings`, before task #24 it had no `tags`, before task #47 it had no
/// `prepMinutes`, `cookMinutes` or `difficulty`, before task #56 it had no
/// `author`.
module {
  /// The stored record type of `addedRecipes` before task #15. Do not change
  /// it: the persistent variable keeps this type so upgrades from those
  /// versions stay compatible.
  public type RecipeV1 = { id : Text; title : Text; markdown : Text };

  /// The stored record type of `addedRecipesWithServings` before task #24
  /// (no `tags`). Do not change it: the persistent variable keeps this type so
  /// upgrades from those versions stay compatible.
  public type RecipeV2 = { id : Text; title : Text; markdown : Text; servings : Nat };

  /// The stored record type of `addedRecipesWithTags` before task #47 (no
  /// `prepMinutes`, `cookMinutes` or `difficulty`). Do not change it: the
  /// persistent variable keeps this type so upgrades from those versions stay
  /// compatible.
  public type RecipeV3 = { id : Text; title : Text; markdown : Text; servings : Nat; tags : [Text] };

  /// The stored record type of `addedRecipesWithDetails` before task #56 (no
  /// `author`). Do not change it: the persistent variable keeps this type so
  /// upgrades from those versions stay compatible. `difficulty` is spelled out
  /// instead of using `Types.Difficulty` so later changes to that type can't
  /// change this one.
  public type RecipeV4 = {
    id : Text;
    title : Text;
    markdown : Text;
    servings : Nat;
    tags : [Text];
    prepMinutes : ?Nat;
    cookMinutes : ?Nat;
    difficulty : ?{ #easy; #medium; #hard };
  };

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

  /// Copies V2 recipes to V3 with no tags: recipes added before task #24 had
  /// none, and recipes can't be edited.
  public func withTags(old : List.List<RecipeV2>) : List.List<RecipeV3> {
    List.map<RecipeV2, RecipeV3>(old, func r = { r with tags = [] });
  };

  /// Copies V3 recipes to V4 with no prep time, cook time or difficulty:
  /// recipes added before task #47 had none, and recipes can't be edited.
  public func withDetails(old : List.List<RecipeV3>) : List.List<RecipeV4> {
    List.map<RecipeV3, RecipeV4>(
      old,
      func r = { r with prepMinutes = null; cookMinutes = null; difficulty = null },
    );
  };

  /// Copies V4 recipes to the current type with no author: recipes added
  /// before task #56 did not store who added them.
  public func withAuthor(old : List.List<RecipeV4>) : List.List<Types.Recipe> {
    List.map<RecipeV4, Types.Recipe>(old, func r = { r with author = null });
  };
};
