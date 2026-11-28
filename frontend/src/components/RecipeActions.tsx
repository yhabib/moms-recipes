import { useEffect, useRef, useState } from "react";
import { recipeShareUrl } from "../shareLink";

/** How long the "Link copied" message stays visible. */
const MESSAGE_MS = 2000;

/** Buttons to copy a link to the recipe and to print it. Hidden when printing. */
export function RecipeActions({ id }: { id: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    []
  );

  const showMessage = (text: string) => {
    setMessage(text);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMessage(null);
      timer.current = null;
    }, MESSAGE_MS);
  };

  const copyLink = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard not available");
      await navigator.clipboard.writeText(recipeShareUrl(window.location, id));
      showMessage("Link copied");
    } catch {
      showMessage("Could not copy the link");
    }
  };

  return (
    <div className="recipe-actions no-print">
      <button type="button" className="recipe-action-button" onClick={copyLink}>
        Copy link
      </button>
      <button type="button" className="recipe-action-button" onClick={() => window.print()}>
        Print
      </button>
      <span role="status" className="recipe-actions-status">
        {message}
      </span>
    </div>
  );
}
