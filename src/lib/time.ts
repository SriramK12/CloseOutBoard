import type { Epoch, Market } from "../types";

export const MINUTE = 60_000;

/** Convert a market-local "HH:MM" on the market date into epoch ms. */
export function localTimeToEpoch(market: Pick<Market, "date" | "utcOffset">, hhmm: string): Epoch {
  return Date.parse(`${market.date}T${hhmm}:00${market.utcOffset}`);
}

/** Market-local "HH:MM" (24h) for an epoch, suitable for <input type="time">. */
export function epochToLocalTime(market: Pick<Market, "timeZone">, t: Epoch): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: market.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(t));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}

/** "12:45 PM" in the market's time zone. */
export function formatTime(market: Pick<Market, "timeZone">, t: Epoch): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: market.timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(t));
}

/** "Saturday, October 17" in the market's time zone. */
export function formatDate(market: Pick<Market, "timeZone">, t: Epoch): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: market.timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(t));
}

/** Whole minutes from `now` until `t`, rounded up so "0 min" never shows for a live deal. */
export function minutesUntil(now: Epoch, t: Epoch): number {
  return Math.max(0, Math.ceil((t - now) / MINUTE));
}

export function formatRemaining(now: Epoch, t: Epoch): string {
  const m = minutesUntil(now, t);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h} hr ${r} min` : `${h} hr`;
  }
  return `${m} min`;
}
