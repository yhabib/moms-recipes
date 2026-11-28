import { describe, expect, it } from "vitest";
import { nextStepIndex, shouldIgnoreKey } from "./cookModeNavigation";

describe("nextStepIndex", () => {
  it("moves forward with ArrowRight and ArrowDown", () => {
    expect(nextStepIndex("ArrowRight", 0, 3)).toBe(1);
    expect(nextStepIndex("ArrowDown", 1, 3)).toBe(2);
  });

  it("moves back with ArrowLeft and ArrowUp", () => {
    expect(nextStepIndex("ArrowLeft", 2, 3)).toBe(1);
    expect(nextStepIndex("ArrowUp", 1, 3)).toBe(0);
  });

  it("stays on the first step when going back from it", () => {
    expect(nextStepIndex("ArrowLeft", 0, 3)).toBe(0);
    expect(nextStepIndex("ArrowUp", 0, 3)).toBe(0);
  });

  it("stays on the last step when going forward from it", () => {
    expect(nextStepIndex("ArrowRight", 2, 3)).toBe(2);
    expect(nextStepIndex("ArrowDown", 2, 3)).toBe(2);
  });

  it("handles a single step", () => {
    expect(nextStepIndex("ArrowRight", 0, 1)).toBe(0);
    expect(nextStepIndex("ArrowLeft", 0, 1)).toBe(0);
  });

  it("clamps an index that is out of range", () => {
    expect(nextStepIndex("ArrowRight", 9, 3)).toBe(2);
    expect(nextStepIndex("ArrowLeft", -4, 3)).toBe(0);
  });

  it("exits on Escape, with or without steps", () => {
    expect(nextStepIndex("Escape", 1, 3)).toBe("exit");
    expect(nextStepIndex("Escape", 0, 0)).toBe("exit");
  });

  it("does not handle arrows when there are no steps", () => {
    expect(nextStepIndex("ArrowRight", 0, 0)).toBeNull();
    expect(nextStepIndex("ArrowLeft", 0, 0)).toBeNull();
  });

  it("does not handle other keys", () => {
    for (const key of ["Enter", " ", "a", "Tab", "Home", "PageDown", "arrowright"]) {
      expect(nextStepIndex(key, 1, 3)).toBeNull();
    }
  });
});

describe("shouldIgnoreKey", () => {
  const plain = { altKey: false, ctrlKey: false, metaKey: false };
  const on = (target: object | null) => ({ ...plain, target: target as EventTarget | null });

  it("handles keys on ordinary elements", () => {
    expect(shouldIgnoreKey(on(null))).toBe(false);
    expect(shouldIgnoreKey(on({ tagName: "BUTTON" }))).toBe(false);
    expect(shouldIgnoreKey(on({ tagName: "DIV", isContentEditable: false }))).toBe(false);
  });

  it("ignores keys while a modifier is held", () => {
    expect(shouldIgnoreKey({ ...plain, altKey: true, target: null })).toBe(true);
    expect(shouldIgnoreKey({ ...plain, ctrlKey: true, target: null })).toBe(true);
    expect(shouldIgnoreKey({ ...plain, metaKey: true, target: null })).toBe(true);
  });

  it("ignores keys in text fields and editable elements", () => {
    expect(shouldIgnoreKey(on({ tagName: "INPUT", type: "text" }))).toBe(true);
    expect(shouldIgnoreKey(on({ tagName: "TEXTAREA" }))).toBe(true);
    expect(shouldIgnoreKey(on({ tagName: "SELECT" }))).toBe(true);
    expect(shouldIgnoreKey(on({ tagName: "DIV", isContentEditable: true }))).toBe(true);
  });

  it("handles keys on check boxes", () => {
    expect(shouldIgnoreKey(on({ tagName: "INPUT", type: "checkbox" }))).toBe(false);
  });
});
