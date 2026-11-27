import Array "mo:core/Array";
import Char "mo:core/Char";
import List "mo:core/List";
import Text "mo:core/Text";
import Types "../types";

/// Pure search helpers: match a query against a recipe's title and ingredients.
module {
  public let maxQueryLength = 100;

  public func trim(t : Text) : Text = Text.trim(t, #predicate(Char.isWhitespace));

  /// The `- ` bullet lines under `## Ingredients`, up to the next `## ` heading,
  /// without the `- ` prefix and trimmed. `[]` if there is no such section.
  public func ingredients(markdown : Text) : [Text] {
    let result = List.empty<Text>();
    var inSection = false;
    label lines for (raw in Text.split(markdown, #char '\n')) {
      let line = trim(raw);
      if (Text.startsWith(line, #text "## ")) {
        if (inSection) break lines;
        inSection := trim(Text.trimStart(line, #text "## ")) == "Ingredients";
      } else if (inSection) {
        switch (Text.stripStart(line, #text "- ")) {
          case (?item) List.add(result, trim(item));
          case null {};
        };
      };
    };
    List.toArray(result);
  };

  /// True if the trimmed query is a case-insensitive substring of the recipe's
  /// title or of one of its ingredient lines. Steps and description are ignored.
  public func matches(recipe : Types.Recipe, searchText : Text) : Bool {
    let needle = Text.toLower(trim(searchText));
    let hit = func(t : Text) : Bool = Text.contains(Text.toLower(t), #text needle);
    hit(recipe.title) or Array.any<Text>(ingredients(recipe.markdown), hit);
  };
};
