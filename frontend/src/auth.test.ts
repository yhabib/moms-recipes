import { describe, expect, it, vi } from "vitest";
import { localIdentityProviderUrl, shortPrincipal } from "./auth";

// The real module reads the browser's `ic_env` cookie on import.
vi.mock("./backend", () => ({ agent: {}, rootKey: undefined }));

describe("shortPrincipal", () => {
  it("keeps the first and last groups of a long principal", () => {
    expect(
      shortPrincipal("2ibo7-dia3b-5ppgv-c3lnl-xzwcg-7rmxz-ngdnb-6ubkn-bkapf-bw2fh-oqe")
    ).toBe("2ibo7…bw2fh-oqe");
  });

  it("shortens a canister id the same way", () => {
    expect(shortPrincipal("rdmx6-jaaaa-aaaaa-aaadq-cai")).toBe("rdmx6…aaadq-cai");
  });

  it("keeps a short principal as it is", () => {
    expect(shortPrincipal("2vxsx-fae")).toBe("2vxsx-fae");
    expect(shortPrincipal("aaaaa-aa")).toBe("aaaaa-aa");
  });
});

describe("localIdentityProviderUrl", () => {
  const at = (url: string) => new URL(url);

  it("uses mainnet Internet Identity on a public origin", () => {
    expect(localIdentityProviderUrl(at("https://abcde-aaaaa-aaaaa-aaaaa-cai.icp0.io"), "")).toBe(null);
  });

  it("prefers the URL passed in by the dev server", () => {
    expect(
      localIdentityProviderUrl(at("http://localhost:5173"), "http://id.ai.localhost:8000/authorize")
    ).toBe("http://id.ai.localhost:8000/authorize");
  });

  it("uses the gateway's port for a canister served on the local network", () => {
    expect(
      localIdentityProviderUrl(at("http://abcde-aaaaa-aaaaa-aaaaa-cai.localhost:8000/recipes"), "")
    ).toBe("http://id.ai.localhost:8000/authorize");
  });
});
