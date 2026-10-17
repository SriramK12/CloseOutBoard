# Close-out Board

One-line closing-time deals from farmers market vendors to nearby shoppers.

This is the Phase 1 clickable prototype: a vendor posts one line (item, deal, end time), shoppers see live deals sorted by end time with the vendor name and stall, deals expire on their own at the end time, and a mocked market view shows which vendors posted.

It's one self-contained `index.html` (vanilla HTML, CSS and JS, sample data, in-memory state). Open it in a browser. There is no build step.

Payments, reservations, shopper accounts, push notifications, photos, vendor verification and delivery are deliberately out of scope.

## Deploy to GitHub Pages

Settings > Pages > Source: "Deploy from a branch", pick `main` and `/ (root)`.

## 60 second demo

The demo clock starts at 11:50 AM. The market closes at 1:00 PM and the closing window opens at 11:30 AM.

1. **Vendor**: as Green Acre Farm, tap the "Heirloom tomatoes" and "2 for $5" chips, pick an end time, then click **Post to board**.
2. **Shopper**: the new deal shows up on the board next to the seeded ones, ending soonest first. No account is needed.
3. **Vendor**: click **Sold out** on the post. It's struck through on the shopper board.
4. Click **+10 min** a few times, or **Play**. Deals expire automatically and turn red in their last 10 minutes.
5. **Market**: see how many vendors posted, how many deals are live, and how many sold out.
