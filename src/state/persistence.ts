import type { Deal, DemoState } from "../types";
import { createInitialState, MARKET, VENDORS } from "../data/demo";

export const STORAGE_KEY = "closeout-board:demo:v1";

function isDeal(x: unknown): x is Deal {
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.vendorId === "string" &&
    typeof d.item === "string" &&
    typeof d.offer === "string" &&
    typeof d.postedAt === "number" &&
    typeof d.endsAt === "number" &&
    (d.soldOutAt === null || typeof d.soldOutAt === "number")
  );
}

/** Parse stored state, returning null if it is missing, malformed or from another market day. */
export function parseState(raw: string | null): DemoState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<DemoState>;
    if (s.version !== 1 || typeof s.now !== "number" || !Array.isArray(s.deals)) return null;
    if (s.now < MARKET.opensAt || s.now > MARKET.closesAt) return null;
    if (!s.deals.every(isDeal)) return null;
    const selectedVendorId = VENDORS.some((v) => v.id === s.selectedVendorId) ? s.selectedVendorId! : VENDORS[0].id;
    return { version: 1, now: s.now, deals: s.deals, selectedVendorId };
  } catch {
    return null;
  }
}

export function loadState(): DemoState {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY)) ?? createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state: DemoState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the demo still runs in memory.
  }
}
