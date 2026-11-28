import Types "../types";

/// Hard-coded placeholder recipes served until real storage exists.
module {
  public let all : [Types.Recipe] = [
    {
      id = "lentil-soup";
      title = "Mom's Lentil Soup";
      servings = 4;
      tags = ["soup", "vegetarian"];
      author = null;
      prepMinutes = ?10;
      cookMinutes = ?40;
      difficulty = ?#easy;
      markdown = "# Mom's Lentil Soup

A cozy, one-pot soup for cold evenings.

## Ingredients

- 1 cup brown lentils, rinsed
- 1 onion, diced
- 2 carrots, diced
- 2 cloves garlic, minced
- 1 tsp ground cumin
- 6 cups vegetable stock
- Juice of 1/2 lemon
- Salt and pepper

## Steps

1. Soften the onion and carrots in olive oil for 5 minutes.
2. Add the garlic and cumin and cook for 1 minute.
3. Add the lentils and stock, bring to a boil, then simmer for 30 minutes.
4. Season with salt, pepper and lemon juice.

> Tip: blend half of the soup for a creamier texture.
";
    },
    {
      id = "apple-cake";
      title = "Sunday Apple Cake";
      servings = 8;
      tags = ["dessert", "baking"];
      author = null;
      prepMinutes = ?20;
      cookMinutes = ?45;
      difficulty = ?#medium;
      markdown = "# Sunday Apple Cake

## Ingredients

- 3 apples, peeled and sliced
- 200 g flour
- 150 g sugar
- 3 eggs
- 100 ml olive oil
- 1 tsp baking powder
- 1 tsp cinnamon

## Steps

1. Preheat the oven to 180 °C.
2. Whisk the eggs and sugar until pale, then add the oil.
3. Fold in the flour, baking powder and cinnamon.
4. Pour into a greased tin, top with the apple slices.
5. Bake for 40 minutes, until a skewer comes out clean.
";
    },
    {
      id = "tomato-rice";
      title = "Tomato Rice";
      servings = 4;
      tags = ["side dish", "vegetarian"];
      author = null;
      prepMinutes = ?10;
      cookMinutes = ?35;
      difficulty = ?#easy;
      markdown = "# Tomato Rice

## Ingredients

- 2 cups rice
- 3 ripe tomatoes, grated
- 1 onion, finely chopped
- 4 cups water or stock
- Salt

## Steps

1. Fry the onion until golden.
2. Add the grated tomato and cook for 10 minutes.
3. Stir in the rice, add the water and salt.
4. Cover and simmer for 18 minutes, then rest for 5.
";
    },
  ];
};
