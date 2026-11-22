module {
  /// A recipe; `markdown` holds the full recipe body (ingredients, steps, notes).
  public type Recipe = {
    id : Text;
    title : Text;
    markdown : Text;
  };

  /// Lightweight entry for listing recipes without shipping every body.
  public type RecipeSummary = {
    id : Text;
    title : Text;
  };
};
