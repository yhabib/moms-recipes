/** A row of short labels for a recipe, such as "soup" or "vegetarian". Renders nothing without tags. */
export function RecipeTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="recipe-tags" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag} className="recipe-tag">
          {tag}
        </li>
      ))}
    </ul>
  );
}
