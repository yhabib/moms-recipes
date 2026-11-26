module {
  /// A recipe; `markdown` holds the full recipe body (ingredients, steps, notes).
  public type Recipe = {
    id : Text;
    title : Text;
    markdown : Text;
    /// Number of servings the ingredient amounts in `markdown` are written for.
    servings : Nat;
  };

  /// Lightweight entry for listing recipes without shipping every body.
  public type RecipeSummary = {
    id : Text;
    title : Text;
  };

  /// Input for `addRecipe`. The backend validates it, builds the Markdown
  /// body and assigns the id.
  public type NewRecipe = {
    name : Text;
    description : Text;
    servings : Nat;
    ingredients : [Text];
    steps : [Text];
  };
};
