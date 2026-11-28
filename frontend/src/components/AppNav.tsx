import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { hrefFor, type Route } from "../router";

type AppNavProps = {
  /** The current route; the menu closes whenever it changes. */
  route: Route;
  /** What the menu holds: the add link, the search box and the recipe list. */
  children: ReactNode;
};

/**
 * The app's navigation. On wide screens it is a sidebar that always shows its
 * content. On phones (see App.css) it is a top bar with the title and a menu
 * button that opens and closes a panel holding the same content.
 */
export function AppNav({ route, children }: AppNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu when the page changes, for example after tapping a recipe.
  const [prevRoute, setPrevRoute] = useState(route);
  if (route !== prevRoute) {
    setPrevRoute(route);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // The search box uses a first Escape to clear its text and marks it as handled.
      if (e.key !== "Escape" || e.defaultPrevented) return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Tapping the link of the page already shown does not change the route,
  // so also close the menu on any link tap inside the panel.
  const onPanelClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof Element && e.target.closest("a")) setOpen(false);
  };

  return (
    <aside className={open ? "sidebar menu-open" : "sidebar"}>
      <div className="sidebar-bar">
        <h1 className="app-title">
          <a href={hrefFor({ name: "home" })}>Mom's Recipes</a>
        </h1>
        <button
          ref={buttonRef}
          type="button"
          className="menu-button"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div id={panelId} className="sidebar-panel" onClick={onPanelClick}>
        {children}
      </div>
    </aside>
  );
}
