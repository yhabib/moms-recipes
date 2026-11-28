import Array "mo:core/Array";
import Char "mo:core/Char";
import List "mo:core/List";
import Text "mo:core/Text";

/// Pure helpers for building recipe summaries from a recipe's Markdown body.
module {
  /// Longest description, in characters, before it is cut and "…" is appended.
  public let maxDescriptionLength = 200;

  func trim(t : Text) : Text = Text.trim(t, #predicate(Char.isWhitespace));

  /// The recipe's intro text: the non-blank lines after the first `# ` heading
  /// and before the first `## ` heading, skipping a `**Servings:**` line,
  /// joined with single spaces. "" if there is none. Longer than
  /// `maxDescriptionLength` characters, it is cut at the last space at or
  /// before that limit (or at the limit if there is no space) and gets "…".
  public func description(markdown : Text) : Text {
    let parts = List.empty<Text>();
    var inIntro = false;
    label lines for (raw in Text.split(markdown, #char '\n')) {
      let line = trim(raw);
      if (Text.startsWith(line, #text "## ")) {
        break lines;
      } else if (Text.startsWith(line, #text "# ")) {
        if (inIntro) List.add(parts, line) else inIntro := true;
      } else if (inIntro and line != "" and not Text.startsWith(line, #text "**Servings:**")) {
        List.add(parts, line);
      };
    };
    truncate(trim(Text.join(List.values(parts), " ")));
  };

  func truncate(t : Text) : Text {
    if (t.size() <= maxDescriptionLength) return t;
    let chars = Text.toArray(t);
    var cut = maxDescriptionLength;
    var i = maxDescriptionLength;
    label search while (i > 0) {
      if (chars[i] == ' ') { cut := i; break search };
      i -= 1;
    };
    trim(Text.fromArray(Array.sliceToArray<Char>(chars, 0, cut))) # "…";
  };
};
