import type { Deal, DealStatus, Epoch, Market, MarketPhase, Vendor } from "../types";
import { formatTime, localTimeToEpoch, MINUTE } from "./time";

export const ITEM_MAX = 32;
export const OFFER_MAX = 28;
export const URGENT_MINUTES = 10;

export function dealStatus(deal: Deal, now: Epoch): DealStatus {
  if (deal.soldOutAt !== null && deal.soldOutAt <= now) return "sold_out";
  if (now >= deal.endsAt) return "expired";
  return "active";
}

export function isUrgent(deal: Deal, now: Epoch): boolean {
  return dealStatus(deal, now) === "active" && deal.endsAt - now <= URGENT_MINUTES * MINUTE;
}

export function marketPhase(market: Market, now: Epoch): MarketPhase {
  if (now >= market.closesAt) return "closed";
  if (now >= market.windowStartsAt) return "closing_window";
  return "before_window";
}

/** Active deals, soonest expiration first (ties broken by earliest post). */
export function activeDeals(deals: Deal[], now: Epoch): Deal[] {
  return deals
    .filter((d) => dealStatus(d, now) === "active")
    .sort((a, b) => a.endsAt - b.endsAt || a.postedAt - b.postedAt);
}

export interface DealCounts {
  total: number;
  active: number;
  soldOut: number;
  expired: number;
}

export function countDeals(deals: Deal[], now: Epoch): DealCounts {
  const counts: DealCounts = { total: deals.length, active: 0, soldOut: 0, expired: 0 };
  for (const d of deals) {
    const s = dealStatus(d, now);
    if (s === "active") counts.active++;
    else if (s === "sold_out") counts.soldOut++;
    else counts.expired++;
  }
  return counts;
}

export interface VendorParticipation extends DealCounts {
  vendor: Vendor;
  firstPostedAt: Epoch | null;
}

export function participation(vendors: Vendor[], deals: Deal[], now: Epoch): VendorParticipation[] {
  return vendors.map((vendor) => {
    const mine = deals.filter((d) => d.vendorId === vendor.id);
    return {
      vendor,
      ...countDeals(mine, now),
      firstPostedAt: mine.length ? Math.min(...mine.map((d) => d.postedAt)) : null,
    };
  });
}

/** The single line a shopper reads: "Item · Offer". */
export function dealLine(item: string, offer: string): string {
  return `${item.trim()} · ${offer.trim()}`;
}

export interface DealDraft {
  item: string;
  offer: string;
  /** Market-local "HH:MM". */
  endTime: string;
}

export type DraftErrors = Partial<Record<keyof DealDraft | "form", string>>;

export interface ValidDraft {
  item: string;
  offer: string;
  endsAt: Epoch;
}

export function validateDraft(
  draft: DealDraft,
  market: Market,
  now: Epoch,
): { ok: true; value: ValidDraft } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = {};
  const item = draft.item.trim().replace(/\s+/g, " ");
  const offer = draft.offer.trim().replace(/\s+/g, " ");

  const phase = marketPhase(market, now);
  if (phase === "closed") errors.form = "The market has closed. Posting reopens next market day.";
  else if (phase === "before_window")
    errors.form = `Posting opens at ${formatTime(market, market.windowStartsAt)}, the start of the closing window.`;

  if (!item) errors.item = "Add the item, e.g. “Strawberries”.";
  else if (item.length > ITEM_MAX) errors.item = `Keep the item to ${ITEM_MAX} characters or fewer.`;

  if (!offer) errors.offer = "Add the deal, e.g. “2 pints for $5”.";
  else if (offer.length > OFFER_MAX) errors.offer = `Keep the deal to ${OFFER_MAX} characters or fewer.`;

  let endsAt = NaN;
  if (!/^\d{2}:\d{2}$/.test(draft.endTime)) {
    errors.endTime = "Choose when the deal ends.";
  } else {
    endsAt = localTimeToEpoch(market, draft.endTime);
    if (Number.isNaN(endsAt)) errors.endTime = "Choose when the deal ends.";
    else if (endsAt <= now) errors.endTime = `Pick a time after ${formatTime(market, now)}.`;
    else if (endsAt > market.closesAt)
      errors.endTime = `Deals must end by market close at ${formatTime(market, market.closesAt)}.`;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { item, offer, endsAt } };
}
