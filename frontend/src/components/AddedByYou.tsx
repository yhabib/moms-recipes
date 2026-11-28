import type { Principal } from "@icp-sdk/core/principal";
import { useAuth } from "../auth";

/** Whether a recipe's author is the given signed-in principal. False if either is missing. */
// Kept next to the component so it can be tested without React; editing this
// file in dev triggers a full reload instead of a fast refresh.
// eslint-disable-next-line react-refresh/only-export-components
export function isOwnRecipe(
  author: Principal | null | undefined,
  principal: Principal | null | undefined
): boolean {
  if (!author || !principal) return false;
  return author.toText() === principal.toText();
}

/** "Added by you" on a recipe the signed-in user added. Renders nothing otherwise. */
export function AddedByYou({ author }: { author: Principal | null | undefined }) {
  const { status, principal } = useAuth();
  if (status !== "signedIn" || !isOwnRecipe(author, principal)) return null;
  return <p className="added-by-you">Added by you</p>;
}
