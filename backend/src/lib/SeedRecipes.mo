import Types "../types";

/// Hard-coded seed recipes: real, cookable dishes served after the
/// placeholder recipes. They are part of the code, not stored in actor state.
module {
  public let all : [Types.Recipe] = [
    {
      id = "fluffy-breakfast-pancakes";
      title = "Fluffy Pancakes";
      servings = 4;
      tags = ["breakfast", "vegetarian", "quick"];
      prepMinutes = ?10;
      cookMinutes = ?15;
      difficulty = ?#easy;
      markdown = "# Fluffy Pancakes

Thick, soft pancakes for a weekend breakfast. Makes about 12.

## Ingredients

- 200 g plain flour
- 2 tsp baking powder
- 1 tbsp sugar
- 1/2 tsp salt
- 300 ml milk
- 1 egg
- 30 g butter, melted, plus extra for the pan

## Steps

1. Whisk the flour, baking powder, sugar and salt in a large bowl.
2. In a jug, whisk the milk, egg and melted butter.
3. Pour the wet ingredients into the dry ones and stir until just combined. A few lumps are fine.
4. Rest the batter for 5 minutes.
5. Heat a non-stick pan over medium heat and brush it with a little butter.
6. Pour in about 3 tbsp of batter per pancake and cook for 2 minutes, until bubbles appear on top.
7. Flip and cook for 1 more minute, until golden.

> Tip: serve with maple syrup, berries or a spoon of yogurt.
";
    },
    {
      id = "classic-minestrone";
      title = "Classic Minestrone";
      servings = 6;
      tags = ["soup", "vegetarian"];
      prepMinutes = ?15;
      cookMinutes = ?35;
      difficulty = ?#easy;
      markdown = "# Classic Minestrone

A thick Italian vegetable soup with beans and small pasta.

## Ingredients

- 2 tbsp olive oil
- 1 onion, diced
- 2 carrots, diced
- 2 celery sticks, diced
- 2 cloves garlic, minced
- 1 courgette, diced
- 400 g canned chopped tomatoes
- 1.5 l vegetable stock
- 400 g canned cannellini beans, drained
- 100 g small pasta, such as ditalini
- Salt and pepper
- Grated parmesan, to serve

## Steps

1. Heat the olive oil in a large pot and soften the onion, carrots and celery for 8 minutes.
2. Add the garlic and courgette and cook for 2 minutes.
3. Add the tomatoes and stock, bring to a boil, then simmer for 15 minutes.
4. Add the beans and pasta and simmer for 10 minutes more, until the pasta is tender.
5. Season with salt and pepper and serve with grated parmesan.

> Tip: the soup thickens as it stands; add a splash of water when reheating.
";
    },
    {
      id = "greek-village-salad";
      title = "Greek Village Salad";
      servings = 4;
      tags = ["salad", "vegetarian", "quick"];
      prepMinutes = ?15;
      cookMinutes = ?0;
      difficulty = ?#easy;
      markdown = "# Greek Village Salad

Horiatiki: a chunky salad with no lettuce, topped with a slab of feta.

## Ingredients

- 4 ripe tomatoes, cut into wedges
- 1 cucumber, halved and sliced
- 1 red onion, thinly sliced
- 1 green pepper, sliced into rings
- 100 g kalamata olives
- 200 g feta, in one piece
- 1 tsp dried oregano
- 4 tbsp extra virgin olive oil
- 1 tbsp red wine vinegar
- Salt

## Steps

1. Put the tomatoes, cucumber, onion and pepper in a wide bowl and season with a little salt.
2. Scatter the olives over the vegetables.
3. Lay the feta on top and sprinkle it with the oregano.
4. Drizzle with the vinegar and olive oil just before serving.

> Tip: serve with crusty bread to soak up the juices.
";
    },
    {
      id = "classic-spaghetti-carbonara";
      title = "Spaghetti Carbonara";
      servings = 4;
      tags = ["pasta", "main", "quick"];
      prepMinutes = ?10;
      cookMinutes = ?15;
      difficulty = ?#medium;
      markdown = "# Spaghetti Carbonara

The Roman classic: eggs, cheese, cured pork and black pepper, no cream.

## Ingredients

- 400 g spaghetti
- 150 g guanciale or pancetta, cut into strips
- 4 egg yolks
- 1 egg
- 50 g pecorino romano, finely grated
- 1 tsp freshly ground black pepper
- Salt, for the pasta water

## Steps

1. Bring a large pot of salted water to a boil.
2. Cook the guanciale in a dry frying pan over medium heat for 8 to 10 minutes, until crisp. Turn off the heat.
3. Whisk the egg yolks, egg, pecorino and pepper in a bowl.
4. Cook the spaghetti for 1 minute less than the packet says. Keep 200 ml of the cooking water, then drain.
5. Add the spaghetti to the pan with the guanciale and toss. Let it cool for 1 minute, off the heat.
6. Pour in the egg mixture with a splash of the cooking water and toss quickly until creamy, adding more water if needed.
7. Serve at once with extra pecorino and pepper.

> Tip: keep the pan off the heat when adding the eggs so they turn creamy instead of scrambling.
";
    },
    {
      id = "weeknight-chicken-curry";
      title = "Weeknight Chicken Curry";
      servings = 4;
      tags = ["chicken", "main"];
      prepMinutes = ?15;
      cookMinutes = ?45;
      difficulty = ?#easy;
      markdown = "# Weeknight Chicken Curry

A mild, creamy tomato curry. Serve with rice or naan.

## Ingredients

- 2 tbsp vegetable oil
- 2 onions, finely chopped
- 3 cloves garlic, minced
- 1 tbsp grated fresh ginger
- 2 tbsp medium curry powder
- 700 g boneless chicken thighs, cut into bite-size pieces
- 400 g canned chopped tomatoes
- 200 ml coconut milk
- 1 tsp salt
- 1 handful fresh coriander, chopped

## Steps

1. Heat the oil in a large pan and fry the onions over medium heat for 10 minutes, until golden.
2. Add the garlic and ginger and cook for 1 minute.
3. Stir in the curry powder and cook for 1 minute more.
4. Add the chicken and stir for 5 minutes, until coated and sealed.
5. Add the tomatoes and salt, cover and simmer for 20 minutes.
6. Stir in the coconut milk and simmer uncovered for 5 minutes, until the chicken is cooked through.
7. Taste for salt and scatter with the coriander.

> Tip: a squeeze of lime juice at the end brightens the sauce.
";
    },
    {
      id = "hearty-beef-stew";
      title = "Hearty Beef Stew";
      servings = 6;
      tags = ["beef", "main"];
      prepMinutes = ?30;
      cookMinutes = ?165;
      difficulty = ?#medium;
      markdown = "# Hearty Beef Stew

Slow-cooked beef with red wine, carrots and potatoes.

## Ingredients

- 1 kg beef chuck, cut into 4 cm cubes
- 2 tbsp plain flour
- 3 tbsp vegetable oil
- 2 onions, chopped
- 3 carrots, cut into chunks
- 2 cloves garlic, minced
- 2 tbsp tomato paste
- 250 ml red wine
- 750 ml beef stock
- 2 bay leaves
- 500 g potatoes, peeled and cut into chunks
- Salt and pepper

## Steps

1. Season the beef with salt and pepper and toss it in the flour.
2. Heat the oil in a large heavy pot and brown the beef in batches, about 8 minutes per batch. Set aside.
3. Lower the heat, add the onions and carrots and cook for 5 minutes. Stir in the garlic and tomato paste for 1 minute.
4. Pour in the wine, scrape up the browned bits and let it bubble for 2 minutes.
5. Return the beef, add the stock and bay leaves, cover and simmer gently for 1 1/2 hours.
6. Add the potatoes and simmer for 40 minutes more, until the beef and potatoes are tender.
7. Remove the bay leaves and season to taste.

> Tip: the stew tastes even better the next day.
";
    },
    {
      id = "lemon-garlic-baked-salmon";
      title = "Lemon Garlic Baked Salmon";
      servings = 4;
      tags = ["fish", "main", "quick"];
      prepMinutes = ?10;
      cookMinutes = ?15;
      difficulty = ?#easy;
      markdown = "# Lemon Garlic Baked Salmon

## Ingredients

- 4 salmon fillets, about 150 g each
- 2 tbsp olive oil
- 2 cloves garlic, minced
- 1 lemon, zest and juice
- 1 tbsp chopped fresh dill or parsley
- 1/2 tsp salt
- Black pepper

## Steps

1. Preheat the oven to 200 °C and line a baking tray with baking paper.
2. Put the salmon on the tray, skin side down.
3. Mix the olive oil, garlic, lemon zest and juice, salt and pepper, and brush it over the fish.
4. Bake for 12 to 15 minutes, until the salmon flakes easily.
5. Sprinkle with the dill and serve.

> Tip: roast some asparagus or green beans on the same tray.
";
    },
    {
      id = "provencal-ratatouille";
      title = "Provençal Ratatouille";
      servings = 6;
      tags = ["vegan", "vegetarian", "main"];
      prepMinutes = ?20;
      cookMinutes = ?60;
      difficulty = ?#medium;
      markdown = "# Provençal Ratatouille

A summer vegetable stew from the south of France.

## Ingredients

- 4 tbsp olive oil
- 1 aubergine, cut into 2 cm cubes
- 2 courgettes, cut into 2 cm cubes
- 1 onion, chopped
- 1 red pepper, cut into strips
- 1 yellow pepper, cut into strips
- 2 cloves garlic, minced
- 4 ripe tomatoes, chopped
- 1 tsp herbes de Provence
- Salt and pepper
- 1 handful fresh basil

## Steps

1. Heat 2 tbsp of the oil in a large pan and fry the aubergine for 8 minutes, until golden. Set aside.
2. Fry the courgettes in 1 tbsp of oil for 5 minutes. Set aside.
3. Add the rest of the oil and cook the onion and peppers for 8 minutes, until soft.
4. Add the garlic, tomatoes and herbs and cook for 10 minutes.
5. Return the aubergine and courgettes, cover and simmer gently for 25 minutes.
6. Season with salt and pepper and tear in the basil.

> Tip: serve warm or at room temperature, with bread, rice or a fried egg.
";
    },
    {
      id = "chunky-guacamole";
      title = "Chunky Guacamole";
      servings = 4;
      tags = ["side dish", "vegan", "quick"];
      prepMinutes = ?10;
      cookMinutes = ?0;
      difficulty = ?#easy;
      markdown = "# Chunky Guacamole

## Ingredients

- 3 ripe avocados
- 1 lime, juiced
- 1/2 small red onion, finely chopped
- 1 tomato, seeded and diced
- 1 green chilli, finely chopped
- 2 tbsp chopped fresh coriander
- 1/2 tsp salt

## Steps

1. Halve the avocados, remove the stones and scoop the flesh into a bowl.
2. Add the lime juice and salt and mash with a fork, leaving it a little chunky.
3. Stir in the onion, tomato, chilli and coriander.
4. Taste and add more salt or lime if needed. Serve right away.

> Tip: press cling film onto the surface to stop it browning if you make it ahead.
";
    },
    {
      id = "classic-banana-bread";
      title = "Classic Banana Bread";
      servings = 10;
      tags = ["baking", "dessert", "breakfast"];
      prepMinutes = ?15;
      cookMinutes = ?60;
      difficulty = ?#easy;
      markdown = "# Classic Banana Bread

The best use for very ripe, spotty bananas. Makes one loaf.

## Ingredients

- 3 ripe bananas, mashed (about 300 g)
- 75 g butter, melted
- 150 g light brown sugar
- 1 egg, beaten
- 1 tsp vanilla extract
- 1 tsp baking soda
- 1/4 tsp salt
- 190 g plain flour

## Steps

1. Preheat the oven to 175 °C and grease a 23 x 13 cm loaf tin.
2. Mix the mashed bananas with the melted butter.
3. Stir in the sugar, egg and vanilla.
4. Sprinkle over the baking soda and salt, then fold in the flour until just combined.
5. Pour into the tin and bake for 55 to 65 minutes, until a skewer comes out clean.
6. Cool in the tin for 10 minutes, then turn out onto a rack.

> Tip: fold in a handful of chopped walnuts or chocolate chips with the flour.
";
    },
    {
      id = "chewy-chocolate-chip-cookies";
      title = "Chewy Chocolate Chip Cookies";
      servings = 24;
      tags = ["dessert", "baking"];
      prepMinutes = ?20;
      cookMinutes = ?25;
      difficulty = ?#easy;
      markdown = "# Chewy Chocolate Chip Cookies

Makes about 24 cookies.

## Ingredients

- 225 g unsalted butter, softened
- 150 g light brown sugar
- 100 g white sugar
- 2 eggs
- 1 tsp vanilla extract
- 280 g plain flour
- 1 tsp baking soda
- 1/2 tsp salt
- 300 g chocolate chips

## Steps

1. Preheat the oven to 180 °C and line two baking trays with baking paper.
2. Beat the butter and both sugars until light and fluffy, about 3 minutes.
3. Beat in the eggs one at a time, then the vanilla.
4. Mix in the flour, baking soda and salt, then stir in the chocolate chips.
5. Roll the dough into balls of about 2 tbsp and space them 5 cm apart on the trays.
6. Bake for 10 to 12 minutes, until golden at the edges but still soft in the middle.
7. Cool on the trays for 5 minutes, then move to a rack.

> Tip: chill the dough for 30 minutes for thicker cookies.
";
    },
    {
      id = "creamy-stovetop-rice-pudding";
      title = "Creamy Rice Pudding";
      servings = 4;
      tags = ["dessert", "vegetarian"];
      prepMinutes = ?5;
      cookMinutes = ?40;
      difficulty = ?#easy;
      markdown = "# Creamy Rice Pudding

A slow-stirred stovetop pudding, good warm or cold.

## Ingredients

- 100 g short-grain pudding rice
- 1 l whole milk
- 60 g sugar
- 1 pinch salt
- 1 tsp vanilla extract
- 15 g butter
- Ground cinnamon, to serve

## Steps

1. Put the rice, milk, sugar and salt in a heavy saucepan and bring to a gentle boil, stirring.
2. Lower the heat and simmer for 30 to 35 minutes, stirring often so the rice does not stick, until thick and creamy.
3. Take off the heat and stir in the vanilla and butter.
4. Serve warm or chilled, dusted with cinnamon.

> Tip: the pudding sets as it cools; loosen it with a splash of milk.
";
    },
  ];
};
