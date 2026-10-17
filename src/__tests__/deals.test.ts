import { describe, expect, it } from "vitest";
import { createInitialState, INITIAL_NOW, MARKET, VENDORS } from "../data/demo";
import { activeDeals, countDeals, dealStatus, isUrgent, marketPhase, participation, validateDraft } from "../lib/deals";
import { epochToLocalTime, formatTime, localTimeToEpoch, MINUTE } from "../lib/time";
import { parseState } from "../state/persistence";
import { reducer } from "../state/reducer";

const at = (hhmm: string) => localTimeToEpoch(MARKET, hhmm);
const draft = (item: string, offer: string, endTime: string) => ({ item, offer, endTime });

describe("time", () => {
  it("round-trips market-local times and formats them in the market time zone", () => {
    expect(epochToLocalTime(MARKET, at("12:45"))).toBe("12:45");
    expect(formatTime(MARKET, at("12:45"))).toBe("12:45 PM");
    expect(formatTime(MARKET, MARKET.closesAt)).toBe("1:00 PM");
  });
});

describe("seed scenario", () => {
  const s = createInitialState();

  it("starts inside the final hour of trading", () => {
    expect(marketPhase(MARKET, INITIAL_NOW)).toBe("closing_window");
    expect(MARKET.closesAt - INITIAL_NOW).toBeLessThanOrEqual(60 * MINUTE);
  });

  it("has active, sold-out and expired examples", () => {
    expect(countDeals(s.deals, s.now)).toEqual({ total: 6, active: 4, soldOut: 1, expired: 1 });
  });

  it("sorts active deals by soonest expiration", () => {
    expect(activeDeals(s.deals, s.now).map((d) => d.item)).toEqual([
      "Strawberries",
      "Sourdough loaves",
      "Heirloom tomatoes",
      "Empanadas",
    ]);
  });

  it("flags deals within ten minutes as urgent", () => {
    const [strawberries, sourdough] = activeDeals(s.deals, s.now);
    expect(isUrgent(strawberries, s.now)).toBe(true);
    expect(isUrgent(sourdough, s.now)).toBe(false);
  });
});

describe("deal status", () => {
  const deal = { id: "x", vendorId: "riverbend", item: "Kale", offer: "$2", postedAt: at("12:00"), endsAt: at("12:30"), soldOutAt: null };

  it("expires exactly at the end time", () => {
    expect(dealStatus(deal, at("12:29"))).toBe("active");
    expect(dealStatus(deal, at("12:30"))).toBe("expired");
  });

  it("treats sold out as taking precedence", () => {
    expect(dealStatus({ ...deal, soldOutAt: at("12:10") }, at("12:40"))).toBe("sold_out");
  });
});

describe("validateDraft", () => {
  const now = at("12:05");

  it("accepts a valid draft and trims whitespace", () => {
    const r = validateDraft(draft("  Peaches  ", " 3 for $5 ", "12:40"), MARKET, now);
    expect(r).toEqual({ ok: true, value: { item: "Peaches", offer: "3 for $5", endsAt: at("12:40") } });
  });

  it("rejects empty and whitespace-only fields", () => {
    const r = validateDraft(draft("   ", "", "12:40"), MARKET, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["item", "offer"]);
  });

  it("rejects over-long fields", () => {
    const r = validateDraft(draft("x".repeat(33), "y".repeat(29), "12:40"), MARKET, now);
    if (r.ok) throw new Error("expected errors");
    expect(r.errors.item).toBeDefined();
    expect(r.errors.offer).toBeDefined();
  });

  it("requires an end time after now and no later than close", () => {
    for (const t of ["12:05", "11:50", "13:05", ""]) {
      const r = validateDraft(draft("Peaches", "$1", t), MARKET, now);
      if (r.ok) throw new Error(`expected ${t} to be rejected`);
      expect(r.errors.endTime).toBeDefined();
    }
    expect(validateDraft(draft("Peaches", "$1", "13:00"), MARKET, now).ok).toBe(true);
  });

  it("blocks posting outside the closing window", () => {
    const before = validateDraft(draft("Peaches", "$1", "12:00"), MARKET, at("11:00"));
    const after = validateDraft(draft("Peaches", "$1", "13:00"), MARKET, MARKET.closesAt);
    if (before.ok || after.ok) throw new Error("expected posting to be blocked");
    expect(before.errors.form).toMatch(/opens/);
    expect(after.errors.form).toMatch(/closed/);
  });
});

describe("reducer", () => {
  it("posts a deal that joins the active board in expiration order", () => {
    let s = createInitialState();
    s = reducer(s, { type: "postDeal", id: "new", vendorId: "green-bowl", draft: { item: "Salad cups", offer: "2 for $7", endsAt: at("12:20") } });
    expect(activeDeals(s.deals, s.now).map((d) => d.id)).toEqual(["seed-1", "new", "seed-2", "seed-3", "seed-4"]);
    expect(s.deals.find((d) => d.id === "new")?.postedAt).toBe(s.now);
  });

  it("removes a sold-out deal from the active board", () => {
    const s = reducer(createInitialState(), { type: "markSoldOut", dealId: "seed-2" });
    expect(activeDeals(s.deals, s.now).map((d) => d.id)).not.toContain("seed-2");
    expect(countDeals(s.deals, s.now).soldOut).toBe(2);
  });

  it("does not mark an expired deal sold out", () => {
    const s = reducer(createInitialState(), { type: "markSoldOut", dealId: "seed-6" });
    expect(dealStatus(s.deals.find((d) => d.id === "seed-6")!, s.now)).toBe("expired");
  });

  it("expires deals as the clock advances and stops at close", () => {
    let s = createInitialState();
    s = reducer(s, { type: "advance", minutes: 15 }); // 12:20
    expect(activeDeals(s.deals, s.now).map((d) => d.item)).toEqual(["Sourdough loaves", "Heirloom tomatoes", "Empanadas"]);
    for (let i = 0; i < 10; i++) s = reducer(s, { type: "advance", minutes: 15 });
    expect(s.now).toBe(MARKET.closesAt);
    expect(marketPhase(MARKET, s.now)).toBe("closed");
    expect(activeDeals(s.deals, s.now)).toHaveLength(0);
  });

  it("resets to the original scenario", () => {
    let s = reducer(createInitialState(), { type: "advance", minutes: 30 });
    s = reducer(s, { type: "reset" });
    expect(s).toEqual(createInitialState());
  });
});

describe("participation", () => {
  it("derives per-vendor counts from state", () => {
    const s = createInitialState();
    const rows = participation(VENDORS, s.deals, s.now);
    expect(rows.filter((r) => r.total > 0)).toHaveLength(5);
    expect(rows.find((r) => r.vendor.id === "sunny-patch")).toMatchObject({ total: 2, active: 1, expired: 1, soldOut: 0 });
    expect(rows.find((r) => r.vendor.id === "green-bowl")).toMatchObject({ total: 0, firstPostedAt: null });
  });
});

describe("persistence", () => {
  it("round-trips state and rejects malformed data", () => {
    const s = reducer(createInitialState(), { type: "advance", minutes: 5 });
    expect(parseState(JSON.stringify(s))).toEqual(s);
    expect(parseState("not json")).toBeNull();
    expect(parseState(JSON.stringify({ ...s, version: 2 }))).toBeNull();
    expect(parseState(JSON.stringify({ ...s, deals: [{ id: 1 }] }))).toBeNull();
  });
});
