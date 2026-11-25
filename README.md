# moms-recipes

An Internet Computer app to keep track of mom's recipes.

- [`backend/`](./backend/): Motoko canister. Recipes are stored as Markdown. For now it serves a few hard-coded placeholder recipes from [`src/lib/PlaceholderRecipes.mo`](./backend/src/lib/PlaceholderRecipes.mo).
- [`frontend/`](./frontend/): React + Vite app served from an asset canister. It lists the recipes and renders the selected one with `react-markdown`.

## Backend API

See [`backend/backend.did`](./backend/backend.did):

```candid
listRecipes : () -> (vec RecipeSummary) query;     // { id; title }
getRecipe   : (id : text) -> (opt Recipe) query;   // { id; title; markdown; servings }
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
