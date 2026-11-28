import { describe, expect, it } from "vitest";
import { splitTitle } from "./recipeMarkdown";

describe("splitTitle", () => {
  it("takes a level-1 heading off the first line", () => {
    expect(splitTitle("# Pancakes\n\nFluffy.\n\n## Ingredients\n- 2 eggs\n")).toEqual({
      title: "Pancakes",
      body: "\nFluffy.\n\n## Ingredients\n- 2 eggs\n",
    });
  });

  it("skips leading blank lines before the heading", () => {
    expect(splitTitle("\n  \n# Soup\nHot.")).toEqual({ title: "Soup", body: "Hot." });
  });

  it("returns the Markdown unchanged without a heading", () => {
    const markdown = "Just a note.\n\n# Not first\n";
    expect(splitTitle(markdown)).toEqual({ title: null, body: markdown });
  });

  it("does not take a level-2 heading", () => {
    const markdown = "## Ingredients\n- flour\n";
    expect(splitTitle(markdown)).toEqual({ title: null, body: markdown });
  });

  it("handles CRLF line endings", () => {
    expect(splitTitle("\r\n# Bread\r\nCrusty.\r\n")).toEqual({ title: "Bread", body: "Crusty.\r\n" });
  });

  it("drops a closing run of hashes and surrounding spaces", () => {
    expect(splitTitle("  #   Tea  ##  \nHot.")).toEqual({ title: "Tea", body: "Hot." });
  });

  it("does not treat #hashtag as a heading", () => {
    const markdown = "#hashtag\nText";
    expect(splitTitle(markdown)).toEqual({ title: null, body: markdown });
  });

  it("handles a heading with nothing after it", () => {
    expect(splitTitle("# Only")).toEqual({ title: "Only", body: "" });
    expect(splitTitle("")).toEqual({ title: null, body: "" });
  });
});
