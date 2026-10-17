import { MARKET, VENDORS } from "../data/demo";
import { activeDeals, isUrgent, marketPhase } from "../lib/deals";
import { hrefFor } from "../lib/router";
import { formatDate, formatRemaining, formatTime, minutesUntil } from "../lib/time";
import { useStore } from "../state/store";
import type { Deal, Epoch } from "../types";
import { DealLine } from "../components/DealLine";
import { BasketIcon, ClockIcon, MoonIcon, PinIcon, WalkIcon } from "../components/icons";

const vendorById = new Map(VENDORS.map((v) => [v.id, v]));

export function ShopperBoard() {
  const { state } = useStore();
  const { now } = state;
  const phase = marketPhase(MARKET, now);
  const deals = activeDeals(state.deals, now);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-leaf">{MARKET.name}</p>
          <p className="text-sm text-moss">
            {formatDate(MARKET, MARKET.opensAt)} · Open {formatTime(MARKET, MARKET.opensAt)}–{formatTime(MARKET, MARKET.closesAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-[2rem] leading-tight font-semibold tracking-tight sm:text-4xl">Closing-time deals</h1>
          <PhasePill now={now} />
        </div>
      </header>

      {phase === "closed" ? (
        <ClosedState />
      ) : (
        <>
          <ul className="grid gap-2 text-sm sm:grid-cols-2" aria-label="How it works">
            <li className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-3">
              <WalkIcon className="shrink-0 text-leaf" />
              <span>
                <strong className="font-semibold">Walk to the stall. Pay the vendor there.</strong>
              </span>
            </li>
            <li className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-3">
              <BasketIcon className="shrink-0 text-leaf" />
              <span>Available while supplies last.</span>
            </li>
          </ul>

          {phase === "before_window" ? (
            <EmptyState
              title={`Deals appear from ${formatTime(MARKET, MARKET.windowStartsAt)}`}
              body="Vendors can post closing-time deals during the last 90 minutes of the market."
            />
          ) : deals.length === 0 ? (
            <EmptyState
              title="No closing deals right now"
              body="Vendors post here when they choose to. Check back before close, or stop by the stalls."
            />
          ) : (
            <section aria-labelledby="live-heading">
              <h2 id="live-heading" className="mb-2 text-sm text-moss">
                <span className="font-semibold text-forest" data-testid="live-count">
                  {deals.length} {deals.length === 1 ? "deal" : "deals"} live
                </span>{" "}
                · ending soonest first
              </h2>
              <ol className="overflow-hidden rounded-2xl border border-line bg-paper" data-testid="board-list">
                {deals.map((d) => (
                  <BoardRow key={d.id} deal={d} now={now} />
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <footer className="border-t border-line pt-4 text-sm text-moss">
        <p>
          Prototype with fictional demo data. Try the{" "}
          <a className="font-medium text-leaf underline underline-offset-2 hover:text-leaf-dark" href={hrefFor("vendor")}>
            vendor demo
          </a>{" "}
          or the{" "}
          <a className="font-medium text-leaf underline underline-offset-2 hover:text-leaf-dark" href={hrefFor("manager")}>
            manager demo
          </a>
          .
        </p>
      </footer>
    </div>
  );
}

function BoardRow({ deal, now }: { deal: Deal; now: Epoch }) {
  const vendor = vendorById.get(deal.vendorId);
  const urgent = isUrgent(deal, now);
  return (
    <li
      data-testid="board-row"
      data-urgent={urgent || undefined}
      className={`relative flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 ${urgent ? "bg-honey-soft/70" : ""}`}
    >
      {urgent && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-honey" />}
      <div className="min-w-0 flex-1">
        <DealLine item={deal.item} offer={deal.offer} className="text-[1.0625rem] leading-snug" />
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-moss">
          <span className="inline-flex items-center gap-1">
            <PinIcon width={14} height={14} />
            {vendor?.name ?? "Vendor"} · {vendor?.stall}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon width={14} height={14} />
            until {formatTime(MARKET, deal.endsAt)}
          </span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-lg leading-tight font-semibold tabular-nums ${urgent ? "text-amber-ink" : "text-forest"}`}>
          {formatRemaining(now, deal.endsAt)}
        </p>
        <p className={`text-xs ${urgent ? "font-semibold text-amber-ink" : "text-moss"}`}>{urgent ? "ending soon" : "left"}</p>
      </div>
    </li>
  );
}

function PhasePill({ now }: { now: Epoch }) {
  const phase = marketPhase(MARKET, now);
  if (phase === "closed")
    return <span className="rounded-full bg-forest px-3 py-1 text-sm font-semibold text-ivory">Closed for today</span>;
  if (phase === "before_window")
    return (
      <span className="rounded-full border border-line-strong px-3 py-1 text-sm font-medium text-moss">
        Open · closes {formatTime(MARKET, MARKET.closesAt)}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-3 py-1 text-sm font-semibold text-leaf-dark">
      <span className="size-2 rounded-full bg-leaf" aria-hidden="true" />
      Closes in {formatRemaining(now, MARKET.closesAt)}
      <span className="sr-only">({minutesUntil(now, MARKET.closesAt)} minutes)</span>
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-paper px-6 py-10 text-center" data-testid="empty-state">
      <BasketIcon width={28} height={28} className="mx-auto text-moss" />
      <p className="mt-3 font-display text-xl font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-moss">{body}</p>
    </div>
  );
}

function ClosedState() {
  return (
    <div className="rounded-2xl bg-forest px-6 py-10 text-center text-ivory" data-testid="closed-state">
      <MoonIcon width={28} height={28} className="mx-auto text-honey" />
      <p className="mt-3 font-display text-2xl font-semibold">The market has closed for today</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ivory/80">
        Closing-time deals ended at {formatTime(MARKET, MARKET.closesAt)}. Thanks for shopping local. See you next market day.
      </p>
    </div>
  );
}
