import { useEffect, useState } from "react";

/** Whether this browser has the Screen Wake Lock API. */
function hasWakeLock(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

/**
 * Keeps the device screen on while `active` is true, with the Screen Wake
 * Lock API.
 *
 * The lock is requested when `active` becomes true and released when it
 * becomes false or the component unmounts. Browsers drop the lock when the
 * tab is hidden, so the hook requests it again when the tab is visible again.
 * A refused request (for example on low battery) only logs a warning.
 *
 * In browsers without the API the hook does nothing.
 *
 * @param active Whether the screen should be kept on.
 * @returns `supported`: the browser has the API; `locked`: the screen is
 *   currently kept on.
 */
export function useWakeLock(active: boolean): {
  supported: boolean;
  locked: boolean;
} {
  const supported = hasWakeLock();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!active || !supported) return;

    let cancelled = false;
    let pending = false;
    let sentinel: WakeLockSentinel | null = null;

    // The browser released the lock, for example because the tab was hidden.
    const onRelease = () => {
      sentinel = null;
      setLocked(false);
    };

    const request = async () => {
      if (pending || sentinel !== null) return;
      pending = true;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) {
          // Cleanup ran while the request was in flight.
          next.release().catch(() => {});
          return;
        }
        next.addEventListener("release", onRelease);
        sentinel = next;
        setLocked(true);
      } catch (error) {
        if (!cancelled) console.warn("Could not keep the screen awake:", error);
      } finally {
        pending = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void request();
    };

    // A hidden tab cannot get the lock; onVisibilityChange requests it later.
    if (document.visibilityState === "visible") void request();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (sentinel !== null) {
        sentinel.removeEventListener("release", onRelease);
        sentinel.release().catch(() => {});
        sentinel = null;
      }
      setLocked(false);
    };
  }, [active, supported]);

  return { supported, locked };
}
