module {
  /// How hard a recipe is to make.
  public type Difficulty = { #easy; #medium; #hard };

  /// A recipe; `markdown` holds the full recipe body (ingredients, steps, notes).
  public type Recipe = {
    id : Text;
    title : Text;
    markdown : Text;
    /// Number of servings the ingredient amounts in `markdown` are written for.
    servings : Nat;
    /// Short lowercase labels such as "soup" or "vegetarian"; may be empty.
    tags : [Text];
    /// Preparation time in minutes; `null` if not given.
    prepMinutes : ?Nat;
    /// Cooking time in minutes; `null` if not given.
    cookMinutes : ?Nat;
    /// `null` if not given.
    difficulty : ?Difficulty;
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
    /// Optional so callers built before tags existed (which omit the field)
    /// stay compatible; `null` means no tags.
    tags : ?[Text];
    /// Optional for the same reason as `tags`; `null` means "not given".
    /// Minutes must be between 0 and `Recipes.maxMinutes`.
    prepMinutes : ?Nat;
    cookMinutes : ?Nat;
    difficulty : ?Difficulty;
  };
};
