import type { DemoState } from "../types";
import type { ValidDraft } from "../lib/deals";
import { dealStatus } from "../lib/deals";
import { MINUTE } from "../lib/time";
import { createInitialState, MARKET, VENDORS } from "../data/demo";

export type Action =
  | { type: "advance"; minutes: number }
  | { type: "reset" }
  | { type: "selectVendor"; vendorId: string }
  | { type: "postDeal"; id: string; vendorId: string; draft: ValidDraft }
  | { type: "markSoldOut"; dealId: string }
  | { type: "replace"; state: DemoState };

export function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "advance": {
      // The demo clock stops at market close; nothing happens after that.
      const now = Math.min(state.now + action.minutes * MINUTE, MARKET.closesAt);
      return now === state.now ? state : { ...state, now };
    }
    case "reset":
      return createInitialState();
    case "selectVendor":
      return VENDORS.some((v) => v.id === action.vendorId) ? { ...state, selectedVendorId: action.vendorId } : state;
    case "postDeal":
      return {
        ...state,
        deals: [
          ...state.deals,
          { id: action.id, vendorId: action.vendorId, ...action.draft, postedAt: state.now, soldOutAt: null },
        ],
      };
    case "markSoldOut":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.dealId && dealStatus(d, state.now) === "active" ? { ...d, soldOutAt: state.now } : d,
        ),
      };
    case "replace":
      return action.state;
  }
}
