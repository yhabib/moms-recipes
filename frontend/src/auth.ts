import { useSyncExternalStore } from "react";
import { AuthClient } from "@icp-sdk/auth/client";
import { AnonymousIdentity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { agent, rootKey } from "./backend";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export interface AuthState {
  status: AuthStatus;
  principal: Principal | null;
}

export interface Auth extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Shortens a principal for display: its first and last groups, such as
 * `abcde…xyz-cai`. Short principals are returned unchanged.
 */
export function shortPrincipal(principal: string): string {
  const groups = principal.split("-");
  if (groups.length <= 3) return principal;
  return `${groups[0]}…${groups[groups.length - 2]}-${groups[groups.length - 1]}`;
}

/** The Internet Identity canister, the same id on mainnet and locally. */
const II_CANISTER_ID = "rdmx6-jaaaa-aaaaa-aaadq-cai";

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
}

/**
 * The authorize URL of the Internet Identity on the local network, or null
 * on mainnet. `npm run dev` passes it in; a frontend canister deployed to the
 * local network is served on the same port as II, at `<id>.localhost`.
 */
export function localIdentityProviderUrl(
  location: Pick<Location, "protocol" | "hostname" | "port">,
  devUrl: string | undefined
): string | null {
  if (devUrl) return devUrl;
  if (!isLocalHostname(location.hostname)) return null;
  const port = location.port ? `:${location.port}` : "";
  return `${location.protocol}//id.ai.localhost${port}/authorize`;
}

// Created on first use, so that importing this module has no side effects.
let authClient: AuthClient | null = null;

function getAuthClient(): AuthClient {
  if (authClient === null) {
    // Mainnet Internet Identity (https://id.ai) is the default. On the local
    // network, use the II it serves, since sign-in calls the II canister there.
    const localUrl = localIdentityProviderUrl(
      window.location,
      import.meta.env.VITE_LOCAL_II_URL as string | undefined
    );
    authClient = new AuthClient({
      ...(localUrl && {
        identityProvider: { authorizeUrl: localUrl, canisterId: II_CANISTER_ID },
      }),
      agentOptions: { rootKey },
    });
    // Follow changes such as a sign-in or sign-out in another tab.
    authClient.subscribe(() => void sync());
    // Restore the session on page load.
    void sync();
  }
  return authClient;
}

let state: AuthState = { status: "loading", principal: null };
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Counts syncs, so that a slow one never overwrites a newer one. */
let syncCount = 0;

/**
 * Reads the client's session, points the agent at it, and publishes the
 * result. "signedIn" is only published once the agent signs as the user.
 */
async function sync() {
  const client = getAuthClient();
  const run = ++syncCount;
  let next: AuthState = { status: "signedOut", principal: null };
  if (client.isAuthenticated()) {
    try {
      const identity = await client.getIdentity();
      if (run !== syncCount) return;
      agent.replaceIdentity(identity);
      next = { status: "signedIn", principal: identity.getPrincipal() };
    } catch (error) {
      // For example a session this origin holds no credential for.
      console.error("Could not restore the Internet Identity session:", error);
    }
  }
  if (run !== syncCount) return;
  if (next.status === "signedOut") agent.replaceIdentity(new AnonymousIdentity());
  setState(next);
}

async function signIn() {
  try {
    await getAuthClient().signIn();
  } catch (error) {
    // The user closed the popup or authentication failed: stay signed out.
    console.error("Sign-in failed:", error);
  }
  await sync();
}

async function signOut() {
  try {
    await getAuthClient().signOut();
  } catch (error) {
    console.error("Sign-out failed:", error);
  }
  await sync();
}

function subscribe(listener: () => void) {
  getAuthClient();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

/** The shared sign-in state, the same in every component that calls it. */
export function useAuth(): Auth {
  const { status, principal } = useSyncExternalStore(subscribe, getSnapshot);
  return { status, principal, signIn, signOut };
}
