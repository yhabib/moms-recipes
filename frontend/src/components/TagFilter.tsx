type TagFilterProps = {
  /** The tags to offer, in display order. */
  tags: string[];
  /** The selected tag, or `null` for none. */
  selected: string | null;
  /** Called with the new selection; `null` clears it. */
  onChange: (tag: string | null) => void;
};

/**
 * Toggle chips that narrow the recipe list to one tag. Clicking the
 * selected tag again clears it. Renders nothing without tags.
 */
export function TagFilter({ tags, selected, onChange }: TagFilterProps) {
  if (tags.length === 0) return null;
  return (
    <div className="tag-filter" role="group" aria-label="Filter by tag">
      {tags.map((tag) => {
        const pressed = tag === selected;
        return (
          <button
            key={tag}
            type="button"
            className={pressed ? "tag-filter-chip selected" : "tag-filter-chip"}
            aria-pressed={pressed}
            onClick={() => onChange(pressed ? null : tag)}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
