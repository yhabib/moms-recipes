import { createActor } from "./backend/api/backend";
import { getCanisterEnv } from "@icp-sdk/core/agent/canister-env";

// The asset canister exposes canister IDs via the `ic_env` cookie using the
// `PUBLIC_CANISTER_ID:<canister-name>` format. In dev, vite.config.ts sets it.
interface CanisterEnv {
  readonly "PUBLIC_CANISTER_ID:backend": string;
}

const canisterEnv = getCanisterEnv<CanisterEnv>();

export const backend = createActor(canisterEnv["PUBLIC_CANISTER_ID:backend"], {
  agentOptions: {
    rootKey: canisterEnv.IC_ROOT_KEY,
  },
});
