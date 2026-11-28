import { describe, expect, it, vi } from "vitest";
import { Principal } from "@icp-sdk/core/principal";
import { isOwnRecipe } from "./AddedByYou";

// The real module reads the browser's `ic_env` cookie on import.
vi.mock("../backend", () => ({ agent: {}, rootKey: undefined }));

const alice = Principal.fromText("aaaaa-aa");
const bob = Principal.fromText("2vxsx-fae");

describe("isOwnRecipe", () => {
  it("is true for the same principal", () => {
    expect(isOwnRecipe(alice, Principal.fromText("aaaaa-aa"))).toBe(true);
  });

  it("is false for a different principal", () => {
    expect(isOwnRecipe(alice, bob)).toBe(false);
  });

  it("is false without an author", () => {
    expect(isOwnRecipe(null, alice)).toBe(false);
    expect(isOwnRecipe(undefined, alice)).toBe(false);
  });

  it("is false without a signed-in principal", () => {
    expect(isOwnRecipe(alice, null)).toBe(false);
    expect(isOwnRecipe(alice, undefined)).toBe(false);
  });
});
