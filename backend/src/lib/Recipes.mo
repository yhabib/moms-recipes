import Array "mo:core/Array";
import Char "mo:core/Char";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Result "mo:core/Result";
import Text "mo:core/Text";
import Types "../types";

/// Domain logic for user-added recipes: validation, id slugs and Markdown.
module {
  public let maxNameLength = 100;
  public let maxDescriptionLength = 500;
  public let maxLineLength = 300;
  public let maxLines = 100;

  /// A `NewRecipe` after trimming and validation.
  public type ValidRecipe = {
    name : Text;
    description : Text;
    servings : Nat;
    ingredients : [Text];
    steps : [Text];
  };

  func trim(t : Text) : Text = Text.trim(t, #predicate(Char.isWhitespace));

  /// Trims every line, drops blank ones and checks the count and line length.
  func cleanLines(lines : [Text], what : Text) : Result.Result<[Text], Text> {
    let kept = Array.filter<Text>(Array.map<Text, Text>(lines, trim), func l = l != "");
    if (kept.size() == 0) return #err(what # " must have at least one entry");
    if (kept.size() > maxLines) return #err(what # " can have at most " # Nat.toText(maxLines) # " entries");
    for (l in kept.values()) {
      if (l.size() > maxLineLength) {
        return #err(what # " entries can be at most " # Nat.toText(maxLineLength) # " characters");
      };
    };
    #ok(kept);
  };

  /// Trims the input and checks it. Returns a short readable message on failure.
  public func validate(input : Types.NewRecipe) : Result.Result<ValidRecipe, Text> {
    let name = trim(input.name);
    if (name == "") return #err("Name must not be empty");
    if (name.size() > maxNameLength) return #err("Name can be at most " # Nat.toText(maxNameLength) # " characters");
    let description = trim(input.description);
    if (description.size() > maxDescriptionLength) {
      return #err("Description can be at most " # Nat.toText(maxDescriptionLength) # " characters");
    };
    if (input.servings < 1) return #err("Servings must be at least 1");
    let ingredients = switch (cleanLines(input.ingredients, "Ingredients")) {
      case (#ok(l)) l;
      case (#err(e)) return #err(e);
    };
    let steps = switch (cleanLines(input.steps, "Steps")) {
      case (#ok(l)) l;
      case (#err(e)) return #err(e);
    };
    #ok({ name; description; servings = input.servings; ingredients; steps });
  };

  /// URL-safe slug: lowercase ASCII letters and digits; every other run of
  /// characters becomes a single `-`; no leading/trailing `-`. Empty -> "recipe".
  public func slugify(name : Text) : Text {
    var slug = "";
    var pendingDash = false;
    for (c in name.chars()) {
      let lower : ?Char = if (c >= 'a' and c <= 'z' or c >= '0' and c <= '9') {
        ?c;
      } else if (c >= 'A' and c <= 'Z') {
        ?Nat32.toChar(Char.toNat32(c) + 32);
      } else { null };
      switch (lower) {
        case (?l) {
          if (pendingDash and slug != "") slug #= "-";
          pendingDash := false;
          slug #= Char.toText(l);
        };
        case null { pendingDash := true };
      };
    };
    if (slug == "") "recipe" else slug;
  };

  /// `base`, or `base-2`, `base-3`, ... — the first one for which `isTaken` is false.
  public func uniqueId(base : Text, isTaken : Text -> Bool) : Text {
    if (not isTaken(base)) return base;
    var n = 2;
    while (isTaken(base # "-" # Nat.toText(n))) { n += 1 };
    base # "-" # Nat.toText(n);
  };

  /// Markdown body in the same shape as the placeholder recipes.
  public func toMarkdown(r : ValidRecipe) : Text {
    var md = "# " # r.name # "\n\n";
    if (r.description != "") md #= r.description # "\n\n";
    md #= "**Servings:** " # Nat.toText(r.servings) # "\n\n## Ingredients\n\n";
    for (i in r.ingredients.values()) md #= "- " # i # "\n";
    md #= "\n## Steps\n\n";
    var n = 1;
    for (s in r.steps.values()) {
      md #= Nat.toText(n) # ". " # s # "\n";
      n += 1;
    };
    md;
  };

  /// Validates `input` and builds the stored recipe with a free id.
  public func create(input : Types.NewRecipe, isTaken : Text -> Bool) : Result.Result<Types.Recipe, Text> {
    switch (validate(input)) {
      case (#err(e)) #err(e);
      case (#ok(r)) #ok({
        id = uniqueId(slugify(r.name), isTaken);
        title = r.name;
        markdown = toMarkdown(r);
      });
    };
  };
};
