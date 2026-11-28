import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./auth";
import { backend } from "./backend";
import type { RecipeSummary, Result } from "./backend/api/backend";

// The signed-in user's favourite recipes, shared by the whole app, in the
// same listener style as `router.ts`. The calls go through the shared
// `backend` actor, whose agent `auth.ts` signs as the signed-in user, so the
// backend stores the favourites under that user's principal.

/** The backend calls the store needs; tests pass a fake. */
export interface FavouritesActor {
  listFavourites(): Promise<RecipeSummary[]>;
  addFavourite(recipeId: string): Promise<Result>;
  removeFavourite(recipeId: string): Promise<Result>;
}

export interface FavouritesState {
  /** The principal (as text) the favourites belong to, or null when signed out. */
  user: string | null;
  /** The user's favourites, or null while they load and when signed out. */
  favourites: RecipeSummary[] | null;
  /** Recipe ids with an add or remove in flight. */
  pending: readonly string[];
  /** The message of the last failed call, or null. */
  error: string | null;
}

export interface FavouritesStore {
  getState(): FavouritesState;
  /** Registers a change listener; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /**
   * Tells the store who is signed in (null when nobody is). A new user's
   * favourites are loaded; signing out clears them. The same user again is a no-op.
   */
  setUser(user: string | null): void;
  /** Whether the recipe is one of the current favourites. */
  isFavourite(recipeId: string): boolean;
  /**
   * Adds the recipe to the favourites or removes it, then reloads the list.
   * On `#err` or a rejected call, the list stays as it was and `error` is set.
   */
  toggleFavourite(recipeId: string): Promise<void>;
}

const initialState: FavouritesState = { user: null, favourites: null, pending: [], error: null };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Creates a favourites store that talks to `actor`. */
export function createFavouritesStore(actor: FavouritesActor): FavouritesStore {
  let state = initialState;
  const listeners = new Set<() => void>();
  // Counts user changes, so that a reply for an earlier user is dropped.
  let generation = 0;

  function setState(next: Partial<FavouritesState>) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  }

  async function load(run: number) {
    try {
      const favourites = await actor.listFavourites();
      if (run === generation) setState({ favourites });
    } catch (error) {
      if (run === generation) setState({ error: errorMessage(error) });
    }
  }

  function isFavourite(recipeId: string): boolean {
    return state.favourites?.some((recipe) => recipe.id === recipeId) ?? false;
  }

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setUser(user) {
      if (user === state.user) return;
      const run = ++generation;
      setState({ user, favourites: null, pending: [], error: null });
      if (user !== null) void load(run);
    },

    isFavourite,

    async toggleFavourite(recipeId) {
      if (state.user === null || state.pending.includes(recipeId)) return;
      const run = generation;
      const add = !isFavourite(recipeId);
      setState({ pending: [...state.pending, recipeId], error: null });
      let error: string | null = null;
      let favourites = state.favourites;
      try {
        const result = add ? await actor.addFavourite(recipeId) : await actor.removeFavourite(recipeId);
        if (result.__kind__ === "err") {
          error = result.err;
        } else {
          favourites = await actor.listFavourites();
        }
      } catch (e) {
        error = errorMessage(e);
      }
      // Signed out or switched user meanwhile: this reply is for someone else.
      if (run !== generation) return;
      setState({
        favourites: error === null ? favourites : state.favourites,
        pending: state.pending.filter((id) => id !== recipeId),
        error,
      });
    },
  };
}

/** The app's one favourites store, backed by the signed-in `backend` actor. */
export const favouritesStore = createFavouritesStore(backend);

export interface Favourites {
  /** The signed-in user's favourites; null while loading or when signed out. */
  favourites: RecipeSummary[] | null;
  /** Whether a user is signed in, so favourites can be saved. */
  signedIn: boolean;
  isFavourite(recipeId: string): boolean;
  /** Whether an add or remove for this recipe is in flight. */
  isPending(recipeId: string): boolean;
  toggleFavourite(recipeId: string): Promise<void>;
  /** The message of the last failed call, or null. */
  error: string | null;
}

/**
 * The signed-in user's favourites, the same in every component that calls it.
 * Loads them when the user signs in and clears them on sign-out.
 */
export function useFavourites(store: FavouritesStore = favouritesStore): Favourites {
  const { status, principal } = useAuth();
  // While the session is restored ("loading"), keep the current state.
  const user = status === "signedIn" && principal !== null ? principal.toText() : null;

  useEffect(() => {
    if (status !== "loading") store.setUser(user);
  }, [status, user, store]);

  const state = useSyncExternalStore(store.subscribe, store.getState);
  const isPending = useCallback((recipeId: string) => state.pending.includes(recipeId), [state.pending]);

  return {
    favourites: state.favourites,
    signedIn: state.user !== null,
    isFavourite: store.isFavourite,
    isPending,
    toggleFavourite: store.toggleFavourite,
    error: state.error,
  };
}
