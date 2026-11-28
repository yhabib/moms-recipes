// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hrefFor, parseRoute } from "./router";

describe("parseRoute", () => {
  it("reads an empty hash, '#' and '#/' as home", () => {
    expect(parseRoute("")).toEqual({ name: "home" });
    expect(parseRoute("#")).toEqual({ name: "home" });
    expect(parseRoute("#/")).toEqual({ name: "home" });
  });

  it("reads the add-recipe page, with or without a trailing slash", () => {
    expect(parseRoute("#/recipes/new")).toEqual({ name: "newRecipe" });
    expect(parseRoute("#/recipes/new/")).toEqual({ name: "newRecipe" });
  });

  it("reads a recipe id, with or without a trailing slash", () => {
    expect(parseRoute("#/recipes/apple-cake")).toEqual({ name: "recipe", id: "apple-cake" });
    expect(parseRoute("#/recipes/apple-cake/")).toEqual({ name: "recipe", id: "apple-cake" });
  });

  it("decodes an encoded recipe id", () => {
    expect(parseRoute("#/recipes/mom%27s%20pie%2Fbest")).toEqual({
      name: "recipe",
      id: "mom's pie/best",
    });
  });

  it("reads the shopping list, with or without a trailing slash", () => {
    expect(parseRoute("#/shopping-list")).toEqual({ name: "shoppingList" });
    expect(parseRoute("#/shopping-list/")).toEqual({ name: "shoppingList" });
  });

  it("reads anything else as not found", () => {
    expect(parseRoute("#/nowhere")).toEqual({ name: "notFound", path: "/nowhere" });
    expect(parseRoute("#/shopping-list/extra")).toEqual({
      name: "notFound",
      path: "/shopping-list/extra",
    });
    expect(parseRoute("#/recipes/%E0%A4%A")).toEqual({
      name: "notFound",
      path: "/recipes/%E0%A4%A",
    });
  });
});

describe("hrefFor", () => {
  it("builds the fixed routes", () => {
    expect(hrefFor({ name: "home" })).toBe("#/");
    expect(hrefFor({ name: "newRecipe" })).toBe("#/recipes/new");
    expect(hrefFor({ name: "shoppingList" })).toBe("#/shopping-list");
  });

  it("encodes a recipe id", () => {
    expect(hrefFor({ name: "recipe", id: "apple-cake" })).toBe("#/recipes/apple-cake");
    expect(hrefFor({ name: "recipe", id: "mom's pie/best" })).toBe("#/recipes/mom's%20pie%2Fbest");
  });

  it("keeps the path of a not-found route", () => {
    expect(hrefFor({ name: "notFound", path: "/nowhere" })).toBe("#/nowhere");
  });

  it("round-trips through parseRoute", () => {
    const routes = [
      { name: "home" },
      { name: "newRecipe" },
      { name: "recipe", id: "mom's pie/best" },
      { name: "shoppingList" },
      { name: "notFound", path: "/nowhere" },
    ] as const;
    for (const route of routes) expect(parseRoute(hrefFor(route))).toEqual(route);
  });
});
