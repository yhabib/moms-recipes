import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SHOPPING_LIST_STORAGE_KEY,
  addRecipeToShoppingList,
  clearShoppingList,
  loadShoppingList,
  subscribeShoppingList,
  toggleShoppingItem,
} from "./shoppingList";

/** In-memory stand-in for the browser's localStorage. */
function createStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

const cake = { recipeId: "1", title: "Cake", servings: 4, items: ["2 eggs", "1 cup flour"] };
const soup = { recipeId: "2", title: "Soup", servings: 2, items: ["1 onion"] };

let storage: Storage;

beforeEach(() => {
  storage = createStorage();
  vi.stubGlobal("localStorage", storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadShoppingList", () => {
  it("returns [] when nothing is stored", () => {
    expect(loadShoppingList()).toEqual([]);
  });

  it("returns [] for invalid JSON or a value that is not a list", () => {
    for (const value of ["{not json", "null", "42", '{"recipeId":"1"}']) {
      storage.setItem(SHOPPING_LIST_STORAGE_KEY, value);
      expect(loadShoppingList()).toEqual([]);
    }
  });

  it("drops malformed entries and items", () => {
    const good = { recipeId: "1", title: "Cake", servings: 4, items: [{ text: "2 eggs", checked: true }] };
    storage.setItem(
      SHOPPING_LIST_STORAGE_KEY,
      JSON.stringify([
        good,
        null,
        { ...good, recipeId: 1 },
        { ...good, servings: "4" },
        { ...good, items: "eggs" },
        { ...good, recipeId: "2", items: [{ text: "salt", checked: "no" }, { text: "1 onion", checked: false }] },
      ]),
    );
    expect(loadShoppingList()).toEqual([
      good,
      { ...good, recipeId: "2", items: [{ text: "1 onion", checked: false }] },
    ]);
  });

  it("returns [] when localStorage is missing or throws", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadShoppingList()).toEqual([]);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
    });
    expect(loadShoppingList()).toEqual([]);
  });
});

describe("addRecipeToShoppingList", () => {
  it("appends recipes with unchecked items", () => {
    addRecipeToShoppingList(cake);
    addRecipeToShoppingList(soup);
    expect(loadShoppingList()).toEqual([
      {
        recipeId: "1",
        title: "Cake",
        servings: 4,
        items: [
          { text: "2 eggs", checked: false },
          { text: "1 cup flour", checked: false },
        ],
      },
      { recipeId: "2", title: "Soup", servings: 2, items: [{ text: "1 onion", checked: false }] },
    ]);
  });

  it("replaces a recipe already on the list in place and unchecks its items", () => {
    addRecipeToShoppingList(cake);
    addRecipeToShoppingList(soup);
    toggleShoppingItem("1", 0);
    addRecipeToShoppingList({ recipeId: "1", title: "Big cake", servings: 8, items: ["4 eggs"] });
    expect(loadShoppingList()).toEqual([
      { recipeId: "1", title: "Big cake", servings: 8, items: [{ text: "4 eggs", checked: false }] },
      { recipeId: "2", title: "Soup", servings: 2, items: [{ text: "1 onion", checked: false }] },
    ]);
  });

  it("does nothing when there are no items", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeShoppingList(listener);
    addRecipeToShoppingList({ ...cake, items: [] });
    unsubscribe();
    expect(loadShoppingList()).toEqual([]);
    expect(storage.getItem(SHOPPING_LIST_STORAGE_KEY)).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not throw when storage is full", () => {
    storage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    expect(() => addRecipeToShoppingList(cake)).not.toThrow();
    expect(loadShoppingList()).toEqual([]);
  });
});

describe("toggleShoppingItem", () => {
  it("flips one item and leaves the others", () => {
    addRecipeToShoppingList(cake);
    toggleShoppingItem("1", 1);
    expect(loadShoppingList()[0].items).toEqual([
      { text: "2 eggs", checked: false },
      { text: "1 cup flour", checked: true },
    ]);
    toggleShoppingItem("1", 1);
    expect(loadShoppingList()[0].items[1].checked).toBe(false);
  });

  it("ignores unknown recipes and bad indexes", () => {
    addRecipeToShoppingList(cake);
    const before = loadShoppingList();
    for (const [recipeId, index] of [["9", 0], ["1", -1], ["1", 2], ["1", 0.5]] as const) {
      toggleShoppingItem(recipeId, index);
    }
    expect(loadShoppingList()).toEqual(before);
  });
});

describe("clearShoppingList", () => {
  it("empties the list", () => {
    addRecipeToShoppingList(cake);
    clearShoppingList();
    expect(loadShoppingList()).toEqual([]);
    expect(storage.getItem(SHOPPING_LIST_STORAGE_KEY)).toBeNull();
  });
});

describe("subscribeShoppingList", () => {
  it("calls listeners on every change until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeShoppingList(listener);
    addRecipeToShoppingList(cake);
    toggleShoppingItem("1", 0);
    clearShoppingList();
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    addRecipeToShoppingList(cake);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("calls listeners when another tab changes the list", () => {
    const target = new EventTarget();
    vi.stubGlobal("window", target);
    const listener = vi.fn();
    const unsubscribe = subscribeShoppingList(listener);

    const storageEvent = (key: string | null) =>
      Object.assign(new Event("storage"), { key });
    target.dispatchEvent(storageEvent("other-key"));
    expect(listener).not.toHaveBeenCalled();
    target.dispatchEvent(storageEvent(SHOPPING_LIST_STORAGE_KEY));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    target.dispatchEvent(storageEvent(SHOPPING_LIST_STORAGE_KEY));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

it("keeps the list in storage across fresh loads", () => {
  addRecipeToShoppingList(cake);
  toggleShoppingItem("1", 0);
  const stored = storage.getItem(SHOPPING_LIST_STORAGE_KEY);

  const fresh = createStorage();
  fresh.setItem(SHOPPING_LIST_STORAGE_KEY, stored!);
  vi.stubGlobal("localStorage", fresh);
  expect(loadShoppingList()).toEqual([
    {
      recipeId: "1",
      title: "Cake",
      servings: 4,
      items: [
        { text: "2 eggs", checked: true },
        { text: "1 cup flour", checked: false },
      ],
    },
  ]);
});
