import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import { parseRecipeSections } from "../recipeSections";
import { useWakeLock } from "../useWakeLock";
import { nextStepIndex, shouldIgnoreKey } from "./cookModeNavigation";
import { IngredientChecklist } from "./IngredientChecklist";
import "./CookMode.css";

/**
 * A full-screen view for cooking: one recipe step at a time in large text,
 * Back/Next buttons and arrow keys to move between steps, the ingredient
 * check list in a side panel, and the screen kept awake.
 */
export function CookMode({
  title,
  markdown,
  onExit,
}: {
  title: string;
  markdown: string;
  onExit: () => void;
}) {
  const { ingredients, steps } = useMemo(() => parseRecipeSections(markdown), [markdown]);
  const count = steps.length;
  const [stepIndex, setStepIndex] = useState(0);
  // Keep the index in range if the recipe changes under us.
  const current = count === 0 ? 0 : Math.min(stepIndex, count - 1);
  const isFirst = current === 0;
  const isLast = current === count - 1;

  const { supported } = useWakeLock(true);

  const nextRef = useRef<HTMLButtonElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);

  // Read the latest values from the key handler without re-adding it.
  const latest = useRef({ current, count, onExit });
  useEffect(() => {
    latest.current = { current, count, onExit };
  });

  // Move focus into the dialog, and give it back when cook mode closes.
  useEffect(() => {
    const previous = document.activeElement;
    (nextRef.current ?? exitRef.current)?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  // The overlay covers the page, so stop the page behind it from scrolling.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || shouldIgnoreKey(event)) return;
      const { current, count, onExit } = latest.current;
      const move = nextStepIndex(event.key, current, count);
      if (move === null) return;
      event.preventDefault();
      if (move === "exit") onExit();
      else setStepIndex(move);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function goBack() {
    const previous = Math.max(current - 1, 0);
    setStepIndex(previous);
    // Back is about to be disabled, which would drop focus to the page.
    if (previous === 0) nextRef.current?.focus();
  }

  function goNext() {
    if (isLast) onExit();
    else setStepIndex(current + 1);
  }

  return (
    <div className="cook-mode" role="dialog" aria-modal="true" aria-label={`Cook mode: ${title}`}>
      <header className="cook-mode-header">
        <div className="cook-mode-heading">
          <h1 className="cook-mode-title">{title}</h1>
          {count > 0 && (
            <p className="cook-mode-progress">
              Step {current + 1} of {count}
            </p>
          )}
        </div>
        <button ref={exitRef} type="button" className="cook-mode-exit" onClick={onExit}>
          Exit cook mode
        </button>
      </header>

      <div className="cook-mode-body">
        <main className="cook-mode-main">
          <div className="cook-mode-step" aria-live="polite">
            {count === 0 ? (
              <p className="cook-mode-empty">This recipe has no steps.</p>
            ) : (
              <Markdown key={current}>{steps[current]}</Markdown>
            )}
          </div>

          {count > 0 && (
            <nav className="cook-mode-nav" aria-label="Steps">
              <button
                type="button"
                className="cook-mode-button"
                onClick={goBack}
                disabled={isFirst}
              >
                Back
              </button>
              <button
                ref={nextRef}
                type="button"
                className="cook-mode-button cook-mode-button-primary"
                onClick={goNext}
              >
                {isLast ? "Done" : "Next"}
              </button>
            </nav>
          )}

          {!supported && (
            <p className="cook-mode-note">Your browser cannot keep the screen awake.</p>
          )}
        </main>

        <aside className="cook-mode-panel">
          <IngredientChecklist ingredients={ingredients} />
        </aside>
      </div>
    </div>
  );
}
