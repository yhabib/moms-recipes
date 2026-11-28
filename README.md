# moms-recipes

An Internet Computer app to keep track of mom's recipes.

- [`backend/`](./backend/): Motoko canister. Recipes are stored as Markdown. It serves a few hard-coded placeholder recipes from [`src/lib/PlaceholderRecipes.mo`](./backend/src/lib/PlaceholderRecipes.mo) and 12 hard-coded seed recipes from [`src/lib/SeedRecipes.mo`](./backend/src/lib/SeedRecipes.mo), followed by recipes added through `addRecipe`, which are kept in persistent actor state and survive upgrades. The author of a recipe can update or delete it with `updateRecipe` and `deleteRecipe`.
- [`frontend/`](./frontend/): React + Vite app served from an asset canister. It lists the recipes and renders the selected one with `react-markdown`.

## Backend API

See [`backend/backend.did`](./backend/backend.did):

```candid
listRecipes : () -> (vec RecipeSummary) query;     // { id; title; description; servings; tags : vec text; hasPhoto : bool }
getRecipe   : (id : text) -> (opt Recipe) query;   // { id; title; markdown; servings; tags : vec text; prepMinutes : opt nat; cookMinutes : opt nat; difficulty : opt Difficulty; author : opt principal }
getRecipePhoto : (id : text) -> (opt Photo) query; // Photo = { contentType : text; data : blob }
searchRecipes : (searchText : text) -> (vec RecipeSummary) query;
addRecipe   : (NewRecipe) -> (variant { ok : text; err : text });
              // NewRecipe = { name; description; servings : nat; ingredients : vec text; steps : vec text; tags : opt vec text;
              //             prepMinutes : opt nat; cookMinutes : opt nat; difficulty : opt Difficulty; photo : opt Photo }
              // Difficulty = variant { easy; medium; hard }
canEditRecipe : (id : text) -> (bool) query;
updateRecipe : (id : text, NewRecipe) -> (variant { ok; err : text });
deleteRecipe : (id : text) -> (variant { ok; err : text });
```

`addRecipe` trims the input and checks it: `name` is required (up to 100 characters), `description` is optional (up to 500), `servings` must be at least 1, and `ingredients` and `steps` each need at least one non-blank line (up to 100 lines of up to 300 characters; blank lines are dropped). On success it returns the new recipe's id, a slug of the name (`"Mom's Pancakes"` becomes `mom-s-pancakes`, `-2`, `-3`, ... is added if the id is taken). Otherwise it returns `#err` with a short message. The stored `markdown` is built from the fields in the same shape as the placeholder recipes.

`tags` are short labels such as `"soup"` or `"vegetarian"` and are optional: the field can be left out or be an empty list (it is `opt` so that callers built before tags existed keep working). Each tag is trimmed and lowercased; blank tags and duplicates are dropped, keeping the first occurrence and its order (`opt vec { " Soup "; "soup"; "Quick" }` is stored as `vec { "soup"; "quick" }`). After cleaning there can be at most 10 tags of up to 30 characters each, otherwise `addRecipe` returns `#err`. Tags are returned by `getRecipe` but are not part of the Markdown. Recipes added before tags existed have `tags = vec {}`.

`prepMinutes`, `cookMinutes` and `difficulty` are optional too, for the same reason: each can be left out or be `null`, which means "not given". `prepMinutes` and `cookMinutes` are whole minutes from 0 to 1440 (24 hours); 0 is allowed, for example for a salad with no cooking, and a larger value makes `addRecipe` return `#err`. `difficulty` is one of `easy`, `medium` or `hard`. All three are returned by `getRecipe` but are not part of the Markdown. Recipes added before these fields existed have `null` for all three.

`photo` is optional too: one image per recipe, which can be left out or be `null` (callers built before photos existed keep working). `contentType` must be `"image/jpeg"`, `"image/png"` or `"image/webp"`, and `data` (the file bytes) must not be empty and can be at most 1 MiB (1,048,576 bytes); otherwise `addRecipe` returns `#err` and stores nothing. The backend does not resize or inspect the image; the frontend is expected to scale photos down (to at most 1200 px) before upload. Photos are stored apart from the recipes: `listRecipes` and `searchRecipes` only report `hasPhoto`, and `getRecipePhoto` returns the photo itself, or `null` when the recipe has none or does not exist. Placeholder and seed recipes have no photo.

`addRecipe` requires a signed-in caller: for the anonymous principal it returns `#err("Sign in to add a recipe")` before checking the input, and stores nothing. Otherwise the caller's principal is stored as the recipe's `author` and returned by `getRecipe`. Placeholder and seed recipes, and recipes added before authors were stored, have `author = null`.

`canEditRecipe` tells the caller whether they may edit a recipe (the frontend uses it to decide whether to show Edit and Delete). It returns `true` only if the caller is not anonymous and is the stored `author` of that user-added recipe. Placeholder and seed recipes, recipes added before authors were stored, and unknown ids return `false`, so an anonymous call always returns `false`.

`updateRecipe` and `deleteRecipe` may only be called by the recipe's author, with the same check as `canEditRecipe`. For anyone else they change nothing and return `#err`: `"Recipe not found"` for an unknown id, and `"Only the recipe's author can change it"` otherwise (placeholder and seed recipes and recipes added before authors were stored can never be changed, and an anonymous call always fails).

`updateRecipe` takes the same `NewRecipe` as `addRecipe` and checks it the same way; on invalid input it returns the same `#err` message and changes nothing. On success it replaces the recipe in place: `title`, `markdown`, `servings`, `tags`, `prepMinutes`, `cookMinutes` and `difficulty` are rebuilt from the input, while the id, the `author` and the recipe's position in `listRecipes` stay the same. The id does not change when the name changes, so links to the recipe keep working. A `photo` in the input replaces the stored one; leaving it out (or `null`) keeps the current photo.

`deleteRecipe` removes the recipe and its photo; the other recipes keep their order.

`searchRecipes` returns the recipes whose title or ingredient lines (the `- ` bullets under `## Ingredients`) contain the search text, ignoring case and surrounding whitespace; steps and description are not searched. Results come in the same order as `listRecipes`. A blank search text, or one longer than 100 characters, returns an empty list.

Code layout follows the multi-file Motoko convention: `types.mo` (types), `lib/` (domain logic and data), `mixins/` (public API), `main.mo` (composition only).

## Prerequisites

- [icp-cli](https://cli.internetcomputer.org/)
- [Node.js](https://nodejs.org/) and npm
- [mops](https://cli.mops.one/) (`npm i -g ic-mops`), then `mops toolchain init`

## Run it locally

```bash
icp network start -d
icp deploy
```

Open the frontend URL printed by `icp deploy` (e.g. `http://frontend.local.localhost:8000/`).

Call the backend directly:

```bash
icp canister call backend listRecipes '()'
icp canister call backend getRecipe '("apple-cake")'
icp canister call backend searchRecipes '("lentil")'
icp canister call backend addRecipe '(record { name = "Pancakes"; description = "Quick breakfast"; servings = 4; ingredients = vec { "2 eggs"; "1 cup flour" }; steps = vec { "Mix"; "Fry" }; tags = opt vec { "breakfast" }; prepMinutes = opt 5; cookMinutes = opt 10; difficulty = opt variant { easy } })'
icp canister call backend addRecipe '(record { name = "Toast"; description = ""; servings = 1; ingredients = vec { "1 slice bread" }; steps = vec { "Toast" }; photo = opt record { contentType = "image/jpeg"; data = blob "\ff\d8\ff" } })'
icp canister call backend getRecipePhoto '("toast")'
icp canister call backend updateRecipe '("pancakes", record { name = "Fluffy pancakes"; description = "Quick breakfast"; servings = 6; ingredients = vec { "3 eggs"; "1.5 cups flour" }; steps = vec { "Mix"; "Fry" }; tags = opt vec { "breakfast" } })'
icp canister call backend deleteRecipe '("toast")'
```

`addRecipe` needs a non-anonymous identity, and icp-cli calls with your current one. If `icp identity default` prints `anonymous`, create and select one first (`icp identity new dev && icp identity default dev`), or add `--identity <name>` to the call; with the anonymous identity it returns `#err("Sign in to add a recipe")`. `updateRecipe` and `deleteRecipe` only work with the identity that added the recipe; `updateRecipe` keeps the id `pancakes` even though the name changes.

`tags`, `prepMinutes`, `cookMinutes`, `difficulty` and `photo` can all be left out; the first `addRecipe` call above stores a recipe without a photo, and the second one sets `photo` but leaves the other optional fields out.

### Sign in

The app signs users in with [Internet Identity](https://internetcomputer.org/internet-identity). Anyone can browse and search recipes, but only signed-in users can add one: signed out, the "Add a recipe" page shows a "Sign in" button instead of the form, and the backend rejects `addRecipe` from the anonymous principal.

On mainnet, sign-in uses Internet Identity at `https://id.ai`. On the local network nothing goes online: `icp.yaml` sets `ii: true`, so `icp network start` also runs an Internet Identity canister, served at `http://id.ai.localhost:8000`. The frontend picks it automatically when it is opened on `localhost` or a `*.localhost` address (`frontend/src/auth.ts`); under `npm run dev`, `frontend/vite.config.ts` passes the local II URL in, since the app then runs on Vite's port. Create a new identity in the local II popup the first time; it only exists on your local network.

### Frontend dev server

With the backend deployed locally:

```bash
cd frontend
npm run dev
```

Vite proxies calls to the local network and injects the backend canister ID (see `frontend/vite.config.ts`). TypeScript bindings are generated from `backend/backend.did` by `@icp-sdk/bindgen` into `frontend/src/backend/api/` (git-ignored).

### Changing the backend API

After changing the Motoko interface, regenerate the Candid file so the frontend bindings follow:

```bash
cd backend
mops build
cp .mops/.build/backend.did backend.did
```

Stop the network with `icp network stop`.

## Deploy to a Cloud Engine (opencloud.org)

The Cloud Engine console's "Your apps and services" page reads display metadata from canister environment variables (`settings.environment_variables` in each `canister.yaml`). All values are strings.

> **Current state:** `backend/canister.yaml` and `frontend/canister.yaml` do not set any `__META_*` variables or `service:*` metadata yet, and `frontend/public/` has no `favicon.svg` (only `icp.svg` and `vite.svg`). Until those are added, the console lists the two canisters on their own, without an app name, labels, icon or "Open" button. The snippets below show what to add.

| Variable | Set on | Effect in the console |
| --- | --- | --- |
| `__META_PROJECT` | both (`"Mom's Recipes"`) | App name. Canisters with the same value are grouped into one app. |
| `__META_NAME` | both (`"Backend"` / `"Frontend"`) | Label of each canister within the app. |
| `__META_MAIN_CANISTER` | frontend only (`"true"`) | Marks the entry point. The "Open" button and icon are read from this canister only. Set it on exactly one canister. |
| `__META_BASE_URL` | frontend only | Absolute `https://` URL the "Open" button goes to. It is also the base for the icon path. If it is missing or not `https://`, the button falls back to the canister's gateway URL. |
| `__META_ICON_PATH` | frontend only (`"/favicon.svg"`) | App icon, resolved against `__META_BASE_URL`, so both must be set. Serve it from `frontend/public/favicon.svg`. Don't use a `data:` URI. |

`frontend/canister.yaml`:

```yaml
settings:
  environment_variables:
    __META_PROJECT: "Mom's Recipes"
    __META_NAME: "Frontend"
    __META_MAIN_CANISTER: "true"
    __META_ICON_PATH: "/favicon.svg"
    # Known only after the first deploy, see step 3 below.
    # __META_BASE_URL: "https://<frontend-canister-id>.icp.net"
```

`backend/canister.yaml`:

```yaml
settings:
  environment_variables:
    __META_PROJECT: "Mom's Recipes"
    __META_NAME: "Backend"
```

### Deploy steps

Link your identity to the console once per machine (`icp identity link web <identity> --app opencloud.org`), then:

1. Deploy to the engine. Use `--engine <engine-name>` or `--subnet <subnet-id>` (shown on the engine's Settings page in the console):
   ```bash
   icp deploy -e ic --engine <engine-name>
   ```
2. Read the frontend canister id:
   ```bash
   icp canister status frontend -e ic -i
   ```
3. In `frontend/canister.yaml`, set `__META_BASE_URL: "https://<frontend-canister-id>.icp.net"`. It must be an absolute `https://` URL.
4. Redeploy with the same command as in step 1.
5. Check that the variables are set:
   ```bash
   icp canister settings show frontend -e ic
   ```

### Version metadata

Neither `canister.yaml` sets `service:version` or `service:git:*` metadata yet. The deploy skill recommends adding it under the recipe's `configuration.metadata`, for example:

```yaml
recipe:
  configuration:
    metadata:
      - name: "service:version"
        value: "0.1.0"
      - name: "service:git:sha"
        value: "$(git rev-parse HEAD)$(git diff --quiet HEAD 2>/dev/null || echo +dirty)"
      - name: "service:git:origin"
        value: "$(git remote get-url origin)"
      - name: "service:git:updated_at"
        value: "$(git log -1 --format=%cI)"
```

Bump `service:version` on every release. Don't put build timestamps such as `$(date)` in metadata, because they change the module hash on every build.

More details:

- [Deploy to Cloud Engine](https://skills.internetcomputer.org/skills/deploy-to-cloud-engine/)
- [Cloud Engine canisters](https://skills.internetcomputer.org/skills/cloud-engine-canisters/)
