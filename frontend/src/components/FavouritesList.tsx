import type { ReactNode } from "react";
import { useFavourites } from "../favourites";
import { hrefFor } from "../router";

/**
 * The sidebar's list of the signed-in user's favourite recipes, kept up to date
 * by the shared favourites store. Renders nothing when nobody is signed in.
 */
export function FavouritesList({ activeId }: { activeId: string | null }) {
  const { signedIn, favourites, error } = useFavourites();
  if (!signedIn) return null;

  let status: ReactNode = null;
  if (favourites === null) {
    // A failed add or remove keeps the list and is shown by the heart button;
    // only a failed load leaves the list empty.
    status =
      error !== null ? (
        <p className="error">Could not load your favourites: {error}</p>
      ) : (
        <p className="muted">Loading…</p>
      );
  } else if (favourites.length === 0) {
    status = <p className="muted">No favourites yet. Tap ♡ on a recipe to add it.</p>;
  }

  return (
    <div className="favourites">
      <h2 className="sidebar-heading">Favourites</h2>
      {status}
      {favourites !== null && favourites.length > 0 && (
        <nav aria-label="Favourites">
          <ul className="recipe-list">
            {favourites.map((r) => (
              <li key={r.id}>
                <a
                  className={r.id === activeId ? "recipe-link active" : "recipe-link"}
                  href={hrefFor({ name: "recipe", id: r.id })}
                  aria-current={r.id === activeId ? "page" : undefined}
                >
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
