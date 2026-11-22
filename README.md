# moms-recipes

An Internet Computer app to keep track of mom's recipes.

- [`backend/`](./backend/): Motoko canister. Recipes are stored as Markdown. For now it serves a few hard-coded placeholder recipes from [`src/lib/PlaceholderRecipes.mo`](./backend/src/lib/PlaceholderRecipes.mo).
- [`frontend/`](./frontend/): React + Vite app served from an asset canister. It lists the recipes and renders the selected one with `react-markdown`.

## Backend API

See [`backend/backend.did`](./backend/backend.did):

```candid
listRecipes : () -> (vec RecipeSummary) query;     // { id; title }
getRecipe   : (id : text) -> (opt Recipe) query;   // { id; title; markdown }
```

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
```

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
