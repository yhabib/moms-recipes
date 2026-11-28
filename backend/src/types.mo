module {
  /// A recipe; `markdown` holds the full recipe body (ingredients, steps, notes).
  public type Recipe = {
    id : Text;
    title : Text;
    markdown : Text;
    /// Number of servings the ingredient amounts in `markdown` are written for.
    servings : Nat;
    /// Short lowercase labels such as "soup" or "vegetarian"; may be empty.
    tags : [Text];
    /// The principal that added the recipe; `null` for placeholder recipes and
    /// for recipes added before authors were stored.
    author : ?Principal;
  };

  /// Lightweight entry for listing recipes without shipping every body.
  public type RecipeSummary = {
    /// Same id as the full recipe; pass it to `getRecipe`.
    id : Text;
    /// The recipe's name.
    title : Text;
    /// The recipe's short intro text, at most about 200 characters; "" when it has none.
    description : Text;
    /// Number of servings the recipe is written for.
    servings : Nat;
    /// The recipe's tags; may be empty.
    tags : [Text];
  };

  /// Input for `addRecipe`. The backend validates it, builds the Markdown
  /// body and assigns the id.
  public type NewRecipe = {
    name : Text;
    description : Text;
    servings : Nat;
    ingredients : [Text];
    steps : [Text];
    /// Optional so callers built before tags existed (which omit the field)
    /// stay compatible; `null` means no tags.
    tags : ?[Text];
  };
};
