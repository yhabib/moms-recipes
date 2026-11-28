import { useFavourites } from "../favourites";

/**
 * A heart that marks the recipe as one of the signed-in user's favourites:
 * filled when it is one, outline when not. Signed out, it is a disabled
 * outline heart that asks the user to sign in.
 */
export function FavouriteButton({ recipeId }: { recipeId: string }) {
  const { signedIn, isFavourite, isPending, toggleFavourite, error } = useFavourites();

  if (!signedIn) {
    return (
      <div className="favourite no-print">
        <button
          type="button"
          className="favourite-button"
          disabled
          aria-label="Sign in to save favourites"
          title="Sign in to save favourites"
        >
          <span aria-hidden="true">♡</span>
        </button>
      </div>
    );
  }

  const favourite = isFavourite(recipeId);
  const label = favourite ? "Remove from favourites" : "Add to favourites";
  return (
    <div className="favourite no-print">
      <button
        type="button"
        className={favourite ? "favourite-button favourited" : "favourite-button"}
        aria-pressed={favourite}
        aria-label={label}
        title={label}
        disabled={isPending(recipeId)}
        onClick={() => void toggleFavourite(recipeId)}
      >
        <span aria-hidden="true">{favourite ? "♥" : "♡"}</span>
      </button>
      {error !== null && (
        <span role="alert" className="error favourite-error">
          {error}
        </span>
      )}
    </div>
  );
}
