import { MARKET, VENDORS } from "../data/demo";
import { countDeals, participation } from "../lib/deals";
import { hrefFor } from "../lib/router";
import { formatTime } from "../lib/time";
import { useStore } from "../state/store";

export function ManagerView() {
  const { state } = useStore();
  const { now } = state;
  const rows = participation(VENDORS, state.deals, now);
  const totals = countDeals(state.deals, now);
  const posted = rows.filter((r) => r.total > 0).length;

  const stats = [
    { label: "Vendors who posted", value: `${posted} of ${VENDORS.length}`, testid: "stat-vendors" },
    { label: "Deals posted", value: totals.total, testid: "stat-total" },
    { label: "Active now", value: totals.active, testid: "stat-active" },
    { label: "Sold out", value: totals.soldOut, testid: "stat-soldout" },
    { label: "Expired", value: totals.expired, testid: "stat-expired" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <a href={hrefFor("board")} className="text-sm font-medium text-leaf hover:text-leaf-dark">
          ← Shopper board
        </a>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[2rem] leading-tight font-semibold tracking-tight">Market overview</h1>
          <span className="rounded bg-honey-soft px-2 py-0.5 text-xs font-bold tracking-wide text-amber-ink uppercase">Demo overview</span>
        </div>
        <p className="mt-1 text-moss">
          {MARKET.name} · as of {formatTime(MARKET, now)}. Counts come from this demo's posts only. No sales, shopper or redemption data is collected.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {stats.map((s, i) => (
          <div key={s.label} className={`rounded-2xl border border-line bg-paper px-4 py-3 ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
            <dt className="text-xs font-medium text-moss">{s.label}</dt>
            <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums" data-testid={s.testid}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="vendors-heading">
        <h2 id="vendors-heading" className="mb-2 font-display text-xl font-semibold">
          Participating vendors
        </h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="hidden grid-cols-[1fr_6rem_repeat(3,4.5rem)] gap-2 border-b border-line px-4 py-2 text-xs font-semibold tracking-wide text-moss uppercase sm:grid">
            <span>Vendor</span>
            <span>Posted</span>
            <span className="text-right">Active</span>
            <span className="text-right">Sold out</span>
            <span className="text-right">Expired</span>
          </div>
          <ul>
            {rows.map((r) => (
              <li
                key={r.vendor.id}
                data-testid="manager-row"
                className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_6rem_repeat(3,4.5rem)]"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{r.vendor.name}</p>
                  <p className="text-sm text-moss">
                    {r.vendor.stall} · {r.vendor.category}
                  </p>
                </div>
                <div>
                  {r.total > 0 ? (
                    <span className="rounded-full bg-leaf-soft px-2.5 py-0.5 text-xs font-semibold text-leaf-dark">
                      Yes · {r.total}
                    </span>
                  ) : (
                    <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-semibold text-moss">Not yet</span>
                  )}
                </div>
                <p className="col-span-2 text-sm text-moss tabular-nums sm:hidden">
                  {r.active} active · {r.soldOut} sold out · {r.expired} expired
                  {r.firstPostedAt !== null && ` · first post ${formatTime(MARKET, r.firstPostedAt)}`}
                </p>
                <span className="hidden text-right tabular-nums sm:block">{r.active}</span>
                <span className="hidden text-right tabular-nums sm:block">{r.soldOut}</span>
                <span className="hidden text-right tabular-nums sm:block">{r.expired}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
