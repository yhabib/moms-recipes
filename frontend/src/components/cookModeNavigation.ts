/**
 * Pure keyboard logic for cook mode, kept apart from the component so it can
 * be unit-tested without a DOM.
 */

/** What a key press asks cook mode to do. */
export type StepMove = number | "exit" | null;

/**
 * Works out where a key press moves cook mode.
 *
 * - ArrowRight / ArrowDown: next step (stays on the last step).
 * - ArrowLeft / ArrowUp: previous step (stays on the first step).
 * - Escape: leave cook mode.
 *
 * @param key The `KeyboardEvent.key` value.
 * @param index The current step, 0-based.
 * @param count How many steps the recipe has.
 * @returns The new step index, `'exit'` to leave cook mode, or `null` when the
 *   key is not one cook mode handles (or there are no steps to move between).
 */
export function nextStepIndex(key: string, index: number, count: number): StepMove {
  if (key === "Escape") return "exit";

  let delta: number;
  if (key === "ArrowRight" || key === "ArrowDown") delta = 1;
  else if (key === "ArrowLeft" || key === "ArrowUp") delta = -1;
  else return null;

  if (count <= 0) return null;
  const current = Math.min(Math.max(index, 0), count - 1);
  return Math.min(Math.max(current + delta, 0), count - 1);
}

/** The parts of a key event that decide whether cook mode should ignore it. */
export interface KeyEventLike {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  target: EventTarget | null;
}

/**
 * Whether cook mode should leave a key press alone: a modifier key is held,
 * or the user is typing in a form field or an editable element. Check boxes
 * (like the ingredient list) do not count as typing, so the arrows still
 * move between steps after ticking an ingredient.
 */
export function shouldIgnoreKey(event: KeyEventLike): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return true;
  const target = event.target as {
    tagName?: unknown;
    type?: unknown;
    isContentEditable?: unknown;
  } | null;
  if (!target || typeof target !== "object") return false;
  if (target.isContentEditable === true) return true;
  const tag = typeof target.tagName === "string" ? target.tagName.toUpperCase() : "";
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") return target.type !== "checkbox";
  return false;
}
