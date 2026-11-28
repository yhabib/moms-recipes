import { describe, expect, it } from "vitest";
import { distinctTags, filterByTag } from "./tagFilter";

const SOUP = { id: "1", title: "Tomato Soup", tags: ["vegetarian", "soup"] };
const STEW = { id: "2", title: "Beef Stew", tags: ["soup", "winter"] };
const BREAD = { id: "3", title: "Bread", tags: [] };
const SALAD = { id: "4", title: "Salad", tags: ["vegetarian"] };

describe("distinctTags", () => {
  it("lists each tag once, sorted alphabetically", () => {
    expect(distinctTags([SOUP, STEW, BREAD, SALAD])).toEqual(["soup", "vegetarian", "winter"]);
  });

  it("is empty when no recipe has tags", () => {
    expect(distinctTags([BREAD])).toEqual([]);
    expect(distinctTags([])).toEqual([]);
  });
});

describe("filterByTag", () => {
  it("keeps only the recipes with the tag, in order", () => {
    expect(filterByTag([SOUP, STEW, BREAD, SALAD], "vegetarian")).toEqual([SOUP, SALAD]);
    expect(filterByTag([SOUP, STEW, BREAD, SALAD], "soup")).toEqual([SOUP, STEW]);
  });

  it("keeps every recipe without a tag", () => {
    expect(filterByTag([SOUP, BREAD], null)).toEqual([SOUP, BREAD]);
  });

  it("is empty when no recipe has the tag", () => {
    expect(filterByTag([SOUP, STEW, BREAD], "dessert")).toEqual([]);
  });

  it("matches whole tags only", () => {
    expect(filterByTag([SOUP], "veg")).toEqual([]);
  });
});
