import { describe, expect, it } from "vitest";
import { recipeShareUrl } from "./shareLink";

describe("recipeShareUrl", () => {
  it("builds the link for a plain id", () => {
    expect(recipeShareUrl({ origin: "https://example.org", pathname: "/" }, "apple-cake")).toBe(
      "https://example.org/#/recipes/apple-cake"
    );
  });

  it("percent-encodes the id", () => {
    expect(recipeShareUrl({ origin: "https://example.org", pathname: "/" }, "apple cake/2?")).toBe(
      "https://example.org/#/recipes/apple%20cake%2F2%3F"
    );
  });

  it("keeps a pathname other than /", () => {
    expect(recipeShareUrl({ origin: "http://localhost:5173", pathname: "/app/index.html" }, "soup")).toBe(
      "http://localhost:5173/app/index.html#/recipes/soup"
    );
  });
});
