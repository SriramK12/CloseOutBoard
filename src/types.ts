/** Epoch milliseconds (UTC). All stored times use this so they are unambiguous. */
export type Epoch = number;

export type VendorCategory = "Produce" | "Bakery" | "Prepared food";

export interface Vendor {
  id: string;
  name: string;
  stall: string;
  category: VendorCategory;
}

export interface Market {
  name: string;
  /** Market-local calendar date, YYYY-MM-DD. */
  date: string;
  /** IANA time zone the market runs in; used for all display formatting. */
  timeZone: string;
  /** UTC offset for `date` in `timeZone`, e.g. "-05:00"; used to parse local times. */
  utcOffset: string;
  opensAt: Epoch;
  closesAt: Epoch;
  /** Start of the closing window, when vendors may post. */
  windowStartsAt: Epoch;
}

export interface Deal {
  id: string;
  vendorId: string;
  item: string;
  offer: string;
  postedAt: Epoch;
  endsAt: Epoch;
  /** Set when the vendor taps "Mark sold out"; null while still available. */
  soldOutAt: Epoch | null;
}

export type DealStatus = "active" | "sold_out" | "expired";

export type MarketPhase = "before_window" | "closing_window" | "closed";

export interface DemoState {
  version: 1;
  /** The simulated market-day clock shared by every view. */
  now: Epoch;
  deals: Deal[];
  selectedVendorId: string;
}
