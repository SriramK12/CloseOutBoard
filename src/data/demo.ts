import type { DemoState, Market, Vendor } from "../types";
import { localTimeToEpoch } from "../lib/time";

// Fictional market and vendors. Everything here is demo data.
const MARKET_DATE = { date: "2026-10-17", utcOffset: "-05:00" };
const at = (hhmm: string) => localTimeToEpoch(MARKET_DATE, hhmm);

export const MARKET: Market = {
  name: "Cedar Commons Saturday Market",
  ...MARKET_DATE,
  timeZone: "America/Chicago",
  opensAt: at("08:00"),
  closesAt: at("13:00"),
  windowStartsAt: at("11:30"),
};

export const VENDORS: Vendor[] = [
  { id: "sunny-patch", name: "Sunny Patch Farm", stall: "Stall 3", category: "Produce" },
  { id: "riverbend", name: "Riverbend Growers", stall: "Stall 12", category: "Produce" },
  { id: "hearth-hive", name: "Hearth & Hive Bakery", stall: "Stall 7", category: "Bakery" },
  { id: "golden-crust", name: "Golden Crust Breads", stall: "Stall 9", category: "Bakery" },
  { id: "dona-rosa", name: "Doña Rosa's Kitchen", stall: "Stall 15", category: "Prepared food" },
  { id: "green-bowl", name: "Green Bowl Kitchen", stall: "Stall 18", category: "Prepared food" },
];

/** The demo opens inside the final hour of trading. */
export const INITIAL_NOW = at("12:05");

export function createInitialState(): DemoState {
  return {
    version: 1,
    now: INITIAL_NOW,
    selectedVendorId: VENDORS[0].id,
    deals: [
      { id: "seed-1", vendorId: "sunny-patch", item: "Strawberries", offer: "2 pints for $5", postedAt: at("11:42"), endsAt: at("12:12"), soldOutAt: null },
      { id: "seed-2", vendorId: "hearth-hive", item: "Sourdough loaves", offer: "$4 each", postedAt: at("11:48"), endsAt: at("12:30"), soldOutAt: null },
      { id: "seed-3", vendorId: "riverbend", item: "Heirloom tomatoes", offer: "$3 per basket", postedAt: at("11:55"), endsAt: at("12:45"), soldOutAt: null },
      { id: "seed-4", vendorId: "dona-rosa", item: "Empanadas", offer: "3 for $8", postedAt: at("12:00"), endsAt: at("13:00"), soldOutAt: null },
      // Already sold out before the demo starts.
      { id: "seed-5", vendorId: "golden-crust", item: "Cinnamon rolls", offer: "$2 each", postedAt: at("11:35"), endsAt: at("12:40"), soldOutAt: at("11:58") },
      // Already expired before the demo starts.
      { id: "seed-6", vendorId: "sunny-patch", item: "Blueberries", offer: "$4 a pint", postedAt: at("11:31"), endsAt: at("11:55"), soldOutAt: null },
    ],
  };
}
