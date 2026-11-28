import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useAuth } from "../auth";
import { backend } from "../backend";
import { hrefFor, navigate, refreshRecipes } from "../router";

/** The `canEditRecipe` reply for one recipe id and one signed-in user. */
type CanEditState = { key: string; canEdit: boolean };

/**
 * "Edit" and "Delete" for the recipe's author. Renders nothing while the
 * check runs, when it fails, or for anyone else, so the page stays read-only.
 * Calls go through the shared `backend` actor, whose agent `auth.ts` signs as
 * the current user; the check runs again when that user changes.
 */
export function RecipeOwnerActions({ id, title }: { id: string; title: string }) {
  const { status, principal } = useAuth();
  const user = status === "signedIn" && principal !== null ? principal.toText() : "";
  const key = `${status}|${user}|${id}`;
  const [state, setState] = useState<CanEditState | null>(null);

  useEffect(() => {
    // Wait until the session is restored, so the check runs as the right user.
    if (status === "loading") return;
    let cancelled = false;
    backend
      .canEditRecipe(id)
      .then((canEdit) => {
        if (!cancelled) setState({ key, canEdit });
      })
      .catch((e: unknown) => {
        console.error("Could not check whether the recipe can be edited:", e);
        if (!cancelled) setState({ key, canEdit: false });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key, status]);

  if (state === null || state.key !== key || !state.canEdit) return null;
  // Keyed by id and user, so switching either closes an open confirmation.
  return <OwnerActions key={key} id={id} title={title} />;
}

type Mode = "idle" | "confirming" | "deleting";

function OwnerActions({ id, title }: { id: string; title: string }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const previousMode = useRef<Mode>("idle");
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  // Focus follows the confirmation: into it when it opens or a failed delete
  // re-enables it (the disabled button dropped focus), back to the Delete
  // button when it closes.
  useEffect(() => {
    if (previousMode.current !== "confirming" && mode === "confirming") confirmRef.current?.focus();
    if (previousMode.current !== "idle" && mode === "idle") deleteButtonRef.current?.focus();
    previousMode.current = mode;
  }, [mode]);

  const cancel = () => {
    setMode("idle");
    setError(null);
  };

  const confirmDelete = async () => {
    setMode("deleting");
    setError(null);
    let message: string | null;
    try {
      const result = await backend.deleteRecipe(id);
      message = result.__kind__ === "ok" ? null : result.err;
    } catch (e: unknown) {
      message = String(e);
    }
    if (message === null) {
      refreshRecipes();
      if (active.current) navigate(hrefFor({ name: "home" }));
      return;
    }
    if (!active.current) return;
    setError(message);
    setMode("confirming");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && mode === "confirming") {
      event.preventDefault();
      cancel();
    }
  };

  const deleting = mode === "deleting";
  const headingId = `delete-recipe-heading-${id}`;

  return (
    <div className="owner-actions no-print">
      <div className="owner-actions-buttons">
        <a className="owner-action-button" href={hrefFor({ name: "editRecipe", id })}>
          Edit
        </a>
        <button
          ref={deleteButtonRef}
          type="button"
          className="owner-action-button"
          onClick={() => setMode("confirming")}
          disabled={mode !== "idle"}
          aria-expanded={mode !== "idle"}
        >
          Delete
        </button>
      </div>
      {mode !== "idle" && (
        <div
          ref={confirmRef}
          className="delete-confirm"
          role="group"
          aria-labelledby={headingId}
          tabIndex={-1}
          onKeyDown={onKeyDown}
        >
          <p id={headingId} className="delete-confirm-message">
            Delete "{title}"? This can't be undone.
          </p>
          {error !== null && (
            <p role="alert" className="error delete-confirm-error">
              Could not delete the recipe: {error}
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="button-danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete recipe"}
            </button>
            <button type="button" className="button-secondary" onClick={cancel} disabled={deleting}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
