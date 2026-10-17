# Close-out Board

One-line closing-time deals from farmers market vendors to nearby shoppers.

Vendors at a farmers market often have perishable food left at closing. Today they discount it, donate it, trade it or take it home, but shoppers have no shared place to see closing-time offers. Close-out Board gives vendors a fast way to post one line (item, deal and end time) and gives shoppers a live board of what's available before the market closes.

**Core loop:** vendor posts a deal → shopper sees it on the board → shopper walks to the stall → shopper pays the vendor directly.

This is a course prototype (Pitch to Prototype, Fall 2026). It runs entirely in the browser on fictional demo data. It has not been tested with real vendors or shoppers.

## Run it

Requires Node 20.19+ (Node 22 recommended).

```bash
npm install
npm run dev        # http://localhost:5173
```

Other commands:

```bash
npm test           # unit tests for deal status, sorting, validation, reducer, persistence
npm run typecheck
npm run build      # production build in dist/
npm run preview    # serve the production build
```

### Deploy

Live at https://sriramk12.github.io/closeoutboard/. `.github/workflows/deploy.yml` tests and builds the app on every push to `main` and publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves (Settings > Pages > Source: "Deploy from a branch", `gh-pages`, `/ (root)`). The build uses relative paths and hash routing, so it works from any static host.

## What's in the prototype

| Screen | Route | What it does |
| --- | --- | --- |
| Shopper board (default) | `#/` | Market name, date and hours, with a live list of active deals sorted by soonest expiration. Each row shows item · offer, vendor, stall and time remaining. Deals ending within 10 minutes get a subtle "ending soon" highlight. Separate empty, before-window and market-closed states. No account needed. |
| Vendor | `#/vendor` | Demo vendor selector (no login). Required item, deal and end-time fields with quick end-time buttons, a live one-line preview, **Post deal**, success feedback, the vendor's current deals with one-tap **Mark sold out**, and earlier sold-out or expired deals. |
| Manager | `#/manager` | Demo overview: vendors who posted, total deals, and active, sold-out and expired counts, plus a per-vendor participation table. Every number comes from app state. |

**Rules the app enforces**

- Posting is only allowed during the closing window (11:30 AM to the 1:00 PM close).
- Item (32 characters max) and deal (28 characters max) are trimmed and can't be empty.
- The end time must be after the current demo time and no later than market close. Validation messages appear next to the field.
- A deal leaves the shopper board as soon as it is marked sold out or reaches its end time.
- No reservations, payments or purchases happen in the app. Shoppers pay the vendor at the stall.

## Demo controls

The dark bar at the top is the demo panel. It is labeled **Demo**, and the time, market and vendors are all simulated.

- **Simulated clock.** It starts at 12:05 PM on Saturday, October 17, 2026, inside the final hour of the fictional Cedar Commons Saturday Market. Every view, countdown and expiry uses this one clock.
- **+5 min / +15 min** advance the clock. It stops at 1:00 PM (market close), and the advance buttons turn off.
- **Reset** restores the original sample scenario and clock.
- **View: Board / Vendor / Manager** switches screens. The board footer also links to the vendor and manager demos.

Deals, the clock and the selected vendor are saved in `localStorage`, so a refresh keeps the demo state. Tabs open in the same browser stay in sync, so you can show the vendor view in one window and the board in another.

### Sample scenario

Six fictional vendors (two produce, two bakery, two prepared food). At 12:05 PM:

- **Active:** Strawberries · 2 pints for $5 (ends 12:12, so it shows as ending soon), Sourdough loaves · $4 each, Heirloom tomatoes · $3 per basket, Empanadas · 3 for $8
- **Sold out:** Golden Crust Breads, Cinnamon rolls
- **Expired:** Sunny Patch Farm, Blueberries
- **Not posted yet:** Green Bowl Kitchen

## Presentation walkthrough (about 3 minutes)

1. **Shopper discovery.** Open the app. It lands on the board, with no sign-in. Point out the one-line rows, vendor and stall on each, time remaining, the soonest-ending sort, and the "Walk to the stall. Pay the vendor there." note.
2. **Posting.** Click **View: Vendor**. Choose **Green Bowl Kitchen** (it hasn't posted yet). Type `Kale salad cups` and `2 for $7`, then tap **+15 min**. Show the live preview and click **Post deal**. Optionally, submit empty fields first to show the inline validation.
3. **The deal on the board.** Click **See the board**. The new deal appears in the right place by expiration time.
4. **Sold-out handling.** Go back to **Vendor** and tap **Mark sold out** on the kale deal. On the board it's gone right away.
5. **Expiration.** Click **+5 min** twice (to 12:15 PM). Strawberries pass their 12:12 end time and drop off the board on their own. Keep clicking **+15 min** to 1:00 PM to show the closed-market state. On the Vendor view, posting is now blocked.
6. **Manager participation.** Open **Manager** to see which vendors posted and the active, sold-out and expired counts, all derived from what happened in the demo.
7. Click **Reset** to set up for the next run.

## Project structure

```
src/
  types.ts            Domain types (Deal, Vendor, Market, DemoState)
  data/demo.ts        Fictional market, vendors and seed deals
  lib/time.ts         Epoch <-> market-local time, formatting
  lib/deals.ts        Deal status, sorting, counts, participation, validation
  lib/router.ts       Minimal hash router
  state/              Reducer, localStorage persistence, React context store
  components/         Demo bar, deal line, toast, icons
  views/              ShopperBoard, VendorView, ManagerView
  __tests__/          Vitest unit tests
```

Times are stored as epoch milliseconds and always displayed in the market's time zone (America/Chicago), so they mean the same thing whatever time zone the viewer is in.

## Limitations

- **Single browser only.** State lives in `localStorage`. There is no backend, so a vendor on one phone and a shopper on another won't see each other's posts.
- **The vendor selector is a demo convenience, not authentication.** Anyone can post as any demo vendor.
- **Simulated clock.** It only moves when you advance it, not in real time.
- **One market, one market day.** The market, vendors and date are fixed demo data.
- **Deliberately out of scope:** payments, reservations, shopper accounts, push notifications, photos, vendor verification, delivery and billing.
- **Not yet checked with real markets:** market rules on food safety, labeling or discount advertising.
- **Unvalidated business model.** The pitch proposes a flat fee of about $3–$5 per vendor per market day, charged only on days a vendor posts. That price is an untested assumption and is not implemented here. The Phase 2 pilot (a hand-run board for one market day) is meant to test whether vendors post unprompted and would pay.
