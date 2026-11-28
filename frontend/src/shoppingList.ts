/**
 * Shopping list kept in the browser's localStorage, shared by all tabs.
 * Every function is safe to call when localStorage is missing or fails.
 */
import { useSyncExternalStore } from "react";

export type ShoppingItem = { text: string; checked: boolean };

export type ShoppingListRecipe = {
  recipeId: string;
  title: string;
  servings: number;
  items: ShoppingItem[];
};

export type ShoppingList = ShoppingListRecipe[];

export const SHOPPING_LIST_STORAGE_KEY = "moms-recipes:shopping-list";

/** Returns localStorage, or null when it is missing or access throws. */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseItem(value: unknown): ShoppingItem | null {
  if (!isRecord(value)) return null;
  const { text, checked } = value;
  if (typeof text !== "string" || typeof checked !== "boolean") return null;
  return { text, checked };
}

function parseRecipe(value: unknown): ShoppingListRecipe | null {
  if (!isRecord(value)) return null;
  const { recipeId, title, servings, items } = value;
  if (
    typeof recipeId !== "string" ||
    typeof title !== "string" ||
    typeof servings !== "number" ||
    !Number.isFinite(servings) ||
    !Array.isArray(items)
  ) {
    return null;
  }
  const parsedItems: ShoppingItem[] = [];
  for (const item of items) {
    const parsed = parseItem(item);
    if (parsed) parsedItems.push(parsed);
  }
  return { recipeId, title, servings, items: parsedItems };
}

/**
 * Reads the list from localStorage. Returns [] when nothing is stored, the
 * value is not valid, or localStorage is unavailable. Malformed entries are
 * dropped.
 */
export function loadShoppingList(): ShoppingList {
  try {
    const raw = storage()?.getItem(SHOPPING_LIST_STORAGE_KEY);
    if (raw == null) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const list: ShoppingList = [];
    for (const entry of data) {
      const parsed = parseRecipe(entry);
      if (parsed) list.push(parsed);
    }
    return list;
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();

/** Cached result of loadShoppingList, so useSyncExternalStore sees a stable reference. */
let snapshot: ShoppingList | null = null;

function changed(): void {
  snapshot = null;
  for (const listener of [...listeners]) listener();
}

/** Stores `list` (removing the key when it is empty) and notifies listeners. */
function save(list: ShoppingList): void {
  try {
    const store = storage();
    if (store) {
      if (list.length === 0) store.removeItem(SHOPPING_LIST_STORAGE_KEY);
      else store.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // Quota or privacy errors: keep what was stored before.
  }
  changed();
}

/**
 * Puts a recipe's items on the list, all unchecked. A recipe already on the
 * list is replaced in place; a new one is appended. Empty `items` does nothing.
 */
export function addRecipeToShoppingList(entry: {
  recipeId: string;
  title: string;
  servings: number;
  items: string[];
}): void {
  if (entry.items.length === 0) return;
  const recipe: ShoppingListRecipe = {
    recipeId: entry.recipeId,
    title: entry.title,
    servings: entry.servings,
    items: entry.items.map((text) => ({ text, checked: false })),
  };
  const list = loadShoppingList();
  const index = list.findIndex((r) => r.recipeId === entry.recipeId);
  if (index >= 0) list[index] = recipe;
  else list.push(recipe);
  save(list);
}

/** Flips the checked state of one item; does nothing if it does not exist. */
export function toggleShoppingItem(recipeId: string, index: number): void {
  const list = loadShoppingList();
  const recipe = list.find((r) => r.recipeId === recipeId);
  const item = recipe?.items[index];
  if (!recipe || !item || !Number.isInteger(index)) return;
  recipe.items[index] = { ...item, checked: !item.checked };
  save(list);
}

/** Empties the list. */
export function clearShoppingList(): void {
  save([]);
}

/**
 * Calls `listener` after every change made through this module and when
 * another tab changes the list. Returns a function that unsubscribes.
 */
export function subscribeShoppingList(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    // A null key means another tab called localStorage.clear().
    if (event.key !== null && event.key !== SHOPPING_LIST_STORAGE_KEY) return;
    snapshot = null;
    listener();
  };
  const hasWindow = typeof window !== "undefined";
  if (hasWindow) window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    if (hasWindow) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): ShoppingList {
  if (snapshot === null) snapshot = loadShoppingList();
  return snapshot;
}

const EMPTY: ShoppingList = [];

function getServerSnapshot(): ShoppingList {
  return EMPTY;
}

/** The current shopping list; re-renders when it changes in any tab. */
export function useShoppingList(): ShoppingList {
  return useSyncExternalStore(subscribeShoppingList, getSnapshot, getServerSnapshot);
}
