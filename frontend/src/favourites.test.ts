import { describe, expect, it, vi } from "vitest";
import type { RecipeSummary, Result } from "./backend/api/backend";
import { createFavouritesStore, type FavouritesActor } from "./favourites";

// The real module reads the browser's `ic_env` cookie on import.
vi.mock("./backend", () => ({ agent: {}, backend: {}, rootKey: undefined }));

function summary(id: string): RecipeSummary {
  return { id, title: id, description: "", hasPhoto: false, servings: 1n, tags: [] };
}

const ok: Result = { __kind__: "ok", ok: null };

/** A fake backend that keeps one user's favourites in memory. */
function fakeActor(initial: string[] = []) {
  const ids = new Set(initial);
  const actor = {
    listFavourites: vi.fn(async () => [...ids].map(summary)),
    addFavourite: vi.fn(async (id: string): Promise<Result> => {
      ids.add(id);
      return ok;
    }),
    removeFavourite: vi.fn(async (id: string): Promise<Result> => {
      ids.delete(id);
      return ok;
    }),
  } satisfies FavouritesActor;
  return actor;
}

/** Lets pending promise callbacks run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function signedInStore(actor: FavouritesActor) {
  const store = createFavouritesStore(actor);
  store.setUser("alice");
  await flush();
  return store;
}

describe("favourites store", () => {
  it("starts signed out with no favourites", () => {
    const store = createFavouritesStore(fakeActor());
    expect(store.getState()).toEqual({ user: null, favourites: null, pending: [], error: null });
    expect(store.isFavourite("soup")).toBe(false);
  });

  it("loads the favourites when a user signs in", async () => {
    const actor = fakeActor(["soup"]);
    const store = await signedInStore(actor);
    expect(store.getState().favourites?.map((r) => r.id)).toEqual(["soup"]);
    expect(store.isFavourite("soup")).toBe(true);
    expect(store.isFavourite("cake")).toBe(false);
  });

  it("clears the favourites when the user signs out", async () => {
    const store = await signedInStore(fakeActor(["soup"]));
    store.setUser(null);
    expect(store.getState().favourites).toBe(null);
    expect(store.isFavourite("soup")).toBe(false);
  });

  it("does not reload for the same user", async () => {
    const actor = fakeActor();
    const store = await signedInStore(actor);
    store.setUser("alice");
    expect(actor.listFavourites).toHaveBeenCalledTimes(1);
  });

  it("adds a recipe that is not a favourite, then reloads", async () => {
    const actor = fakeActor();
    const store = await signedInStore(actor);
    await store.toggleFavourite("soup");
    expect(actor.addFavourite).toHaveBeenCalledWith("soup");
    expect(actor.removeFavourite).not.toHaveBeenCalled();
    expect(actor.listFavourites).toHaveBeenCalledTimes(2);
    expect(store.isFavourite("soup")).toBe(true);
    expect(store.getState().pending).toEqual([]);
  });

  it("removes a recipe that is a favourite", async () => {
    const actor = fakeActor(["soup", "cake"]);
    const store = await signedInStore(actor);
    await store.toggleFavourite("soup");
    expect(actor.removeFavourite).toHaveBeenCalledWith("soup");
    expect(store.isFavourite("soup")).toBe(false);
    expect(store.isFavourite("cake")).toBe(true);
  });

  it("marks the recipe as pending while the call is in flight", async () => {
    const store = await signedInStore(fakeActor());
    const toggle = store.toggleFavourite("soup");
    expect(store.getState().pending).toEqual(["soup"]);
    await toggle;
    expect(store.getState().pending).toEqual([]);
  });

  it("keeps the old state and sets the error on #err", async () => {
    const actor = fakeActor(["soup"]);
    actor.removeFavourite.mockResolvedValueOnce({ __kind__: "err", err: "Not allowed" });
    const store = await signedInStore(actor);
    await store.toggleFavourite("soup");
    expect(store.isFavourite("soup")).toBe(true);
    expect(store.getState().error).toBe("Not allowed");
    expect(store.getState().pending).toEqual([]);
    expect(actor.listFavourites).toHaveBeenCalledTimes(1);
  });

  it("keeps the old state and sets the error when the call rejects", async () => {
    const actor = fakeActor();
    actor.addFavourite.mockRejectedValueOnce(new Error("Network down"));
    const store = await signedInStore(actor);
    await store.toggleFavourite("soup");
    expect(store.isFavourite("soup")).toBe(false);
    expect(store.getState().error).toBe("Network down");
  });

  it("clears the error after a successful toggle", async () => {
    const actor = fakeActor();
    actor.addFavourite.mockRejectedValueOnce(new Error("Network down"));
    const store = await signedInStore(actor);
    await store.toggleFavourite("soup");
    await store.toggleFavourite("soup");
    expect(store.getState().error).toBe(null);
    expect(store.isFavourite("soup")).toBe(true);
  });

  it("does nothing when signed out", async () => {
    const actor = fakeActor();
    const store = createFavouritesStore(actor);
    await store.toggleFavourite("soup");
    expect(actor.addFavourite).not.toHaveBeenCalled();
  });

  it("drops a reply that arrives after the user signed out", async () => {
    const actor = fakeActor();
    const store = await signedInStore(actor);
    const toggle = store.toggleFavourite("soup");
    store.setUser(null);
    await toggle;
    expect(store.getState()).toEqual({ user: null, favourites: null, pending: [], error: null });
  });

  it("notifies listeners on changes", async () => {
    const store = createFavouritesStore(fakeActor());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setUser("alice");
    await flush();
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    store.setUser(null);
    expect(listener).not.toHaveBeenCalled();
  });
});
