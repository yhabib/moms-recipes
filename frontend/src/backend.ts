import { HttpAgent } from "@icp-sdk/core/agent";
import { getCanisterEnv } from "@icp-sdk/core/agent/canister-env";
import { createActor } from "./backend/api/backend";

// The asset canister exposes canister IDs via the `ic_env` cookie using the
// `PUBLIC_CANISTER_ID:<canister-name>` format. In dev, vite.config.ts sets it.
interface CanisterEnv {
  readonly "PUBLIC_CANISTER_ID:backend": string;
}

const canisterEnv = getCanisterEnv<CanisterEnv>();

/** The root key of the network the app runs on, from the `ic_env` cookie. */
export const rootKey = canisterEnv.IC_ROOT_KEY;

/**
 * The one agent every backend call goes through. It starts anonymous;
 * `auth.ts` swaps in the signed-in identity and back on sign-out.
 */
export const agent = HttpAgent.createSync({ rootKey });

export const backend = createActor(canisterEnv["PUBLIC_CANISTER_ID:backend"], { agent });
