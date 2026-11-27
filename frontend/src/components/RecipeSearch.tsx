/** The longest query the backend's `searchRecipes` accepts. */
const MAX_SEARCH_LENGTH = 100;

type RecipeSearchProps = {
  /** The current query text. */
  value: string;
  /** Called with the new query text whenever it changes. */
  onChange: (query: string) => void;
};

/** A search box that filters the recipe list by name or ingredient. */
export function RecipeSearch({ value, onChange }: RecipeSearchProps) {
  return (
    <div className="recipe-search" role="search">
      <input
        className="recipe-search-input"
        type="search"
        placeholder="Search by name or ingredient"
        aria-label="Search recipes by name or ingredient"
        maxLength={MAX_SEARCH_LENGTH}
        autoComplete="off"
        spellCheck={false}
        value={value}
        // Also fires with "" when the browser's clear button is used.
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value !== "") {
            e.preventDefault();
            onChange("");
          }
        }}
      />
    </div>
  );
}
