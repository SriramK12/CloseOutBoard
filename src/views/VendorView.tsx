import { useId, useState, type FormEvent } from "react";
import { MARKET, VENDORS } from "../data/demo";
import { dealStatus, ITEM_MAX, marketPhase, OFFER_MAX, validateDraft, type DealDraft } from "../lib/deals";
import { hrefFor } from "../lib/router";
import { epochToLocalTime, formatRemaining, formatTime, localTimeToEpoch, MINUTE } from "../lib/time";
import { useStore } from "../state/store";
import type { Deal, Epoch } from "../types";
import { DealLine } from "../components/DealLine";
import { useToast } from "../components/Toast";
import { AlertIcon, CheckIcon, ClockIcon, PinIcon } from "../components/icons";

/** Default end time: 30 minutes out, on a 5-minute mark, capped at close. */
function defaultEndTime(now: Epoch): string {
  const step = 5 * MINUTE;
  const t = Math.min(Math.ceil((now + 30 * MINUTE) / step) * step, MARKET.closesAt);
  return epochToLocalTime(MARKET, t);
}

export function VendorView() {
  const { state, selectVendor, postDeal, markSoldOut } = useStore();
  const toast = useToast();
  const { now } = state;
  const vendor = VENDORS.find((v) => v.id === state.selectedVendorId) ?? VENDORS[0];
  const phase = marketPhase(MARKET, now);
  const canPost = phase === "closing_window";

  const [draft, setDraft] = useState<DealDraft>(() => ({ item: "", offer: "", endTime: defaultEndTime(now) }));
  const [submitted, setSubmitted] = useState(false);
  const [posted, setPosted] = useState<Deal | null>(null);

  const result = validateDraft(draft, MARKET, now);
  const errors = submitted && !result.ok ? result.errors : {};

  const set = (field: keyof DealDraft) => (value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setPosted(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!result.ok) return;
    const id = postDeal(vendor.id, result.value);
    setPosted({ id, vendorId: vendor.id, ...result.value, postedAt: now, soldOutAt: null });
    toast(`Posted. Live on the board until ${formatTime(MARKET, result.value.endsAt)}.`);
    setDraft({ item: "", offer: "", endTime: draft.endTime });
    setSubmitted(false);
  };

  const mine = state.deals.filter((d) => d.vendorId === vendor.id);
  const current = mine.filter((d) => dealStatus(d, now) === "active").sort((a, b) => a.endsAt - b.endsAt);
  const earlier = mine.filter((d) => dealStatus(d, now) !== "active").sort((a, b) => b.postedAt - a.postedAt);

  const quickTimes = [15, 30]
    .map((m) => now + m * MINUTE)
    .filter((t) => t < MARKET.closesAt)
    .map((t) => ({ label: `+${Math.round((t - now) / MINUTE)} min`, value: epochToLocalTime(MARKET, t) }))
    .concat(canPost ? [{ label: `At close · ${formatTime(MARKET, MARKET.closesAt)}`, value: epochToLocalTime(MARKET, MARKET.closesAt) }] : []);

  return (
    <div className="space-y-6">
      <header>
        <a href={hrefFor("board")} className="text-sm font-medium text-leaf hover:text-leaf-dark">
          ← Shopper board
        </a>
        <h1 className="mt-2 font-display text-[2rem] leading-tight font-semibold tracking-tight">Post a closing deal</h1>
        <p className="mt-1 text-moss">Posting is optional. You decide whether to post, what to offer, and how long it lasts.</p>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-4 sm:p-5">
        <label htmlFor="vendor-select" className="flex items-center gap-2 text-sm font-semibold">
          Demo vendor
          <span className="rounded bg-honey-soft px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-ink uppercase">No login · demo only</span>
        </label>
        <select
          id="vendor-select"
          value={vendor.id}
          onChange={(e) => {
            selectVendor(e.target.value);
            setPosted(null);
          }}
          className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-ivory px-3 text-base font-medium"
        >
          {VENDORS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · {v.stall}
            </option>
          ))}
        </select>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-moss">
          <PinIcon width={15} height={15} className="mt-0.5 shrink-0" />
          <span>
            Posting as <strong className="font-semibold text-forest">{vendor.name}</strong>, {vendor.stall} · {vendor.category}
          </span>
        </p>
      </section>

      <form noValidate onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-paper p-4 sm:p-5" aria-label="New deal">
        {!canPost && (
          <p role="status" className="flex items-start gap-2 rounded-xl bg-forest px-3.5 py-3 text-sm text-ivory" data-testid="posting-blocked">
            <AlertIcon className="mt-0.5 shrink-0 text-honey" />
            {phase === "closed"
              ? `The market closed at ${formatTime(MARKET, MARKET.closesAt)}. Posting is closed for today.`
              : `Posting opens at ${formatTime(MARKET, MARKET.windowStartsAt)}, the start of the closing window.`}
          </p>
        )}

        <Field
          label="Item"
          placeholder="Strawberries"
          value={draft.item}
          onChange={set("item")}
          max={ITEM_MAX}
          error={errors.item}
          disabled={!canPost}
        />
        <Field
          label="Deal"
          placeholder="2 pints for $5"
          value={draft.offer}
          onChange={set("offer")}
          max={OFFER_MAX}
          error={errors.offer}
          disabled={!canPost}
        />

        <div>
          <label htmlFor="end-time" className="text-sm font-semibold">
            Ends at <span className="text-tomato">*</span>
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              id="end-time"
              type="time"
              step={300}
              value={draft.endTime}
              onChange={(e) => set("endTime")(e.target.value)}
              disabled={!canPost}
              aria-invalid={!!errors.endTime}
              aria-describedby="end-time-help"
              className={`min-h-12 w-36 rounded-xl border bg-ivory px-3 text-base tabular-nums disabled:opacity-50 ${
                errors.endTime ? "border-tomato" : "border-line-strong"
              }`}
            />
            {quickTimes.map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={!canPost}
                onClick={() => set("endTime")(q.value)}
                className={`min-h-12 rounded-xl border px-3 text-sm font-medium transition disabled:opacity-50 ${
                  draft.endTime === q.value ? "border-leaf bg-leaf-soft text-leaf-dark" : "border-line-strong hover:bg-ivory"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
          <p id="end-time-help" className={`mt-1.5 text-sm ${errors.endTime ? "font-medium text-tomato" : "text-moss"}`}>
            {errors.endTime ?? `After ${formatTime(MARKET, now)} and by close at ${formatTime(MARKET, MARKET.closesAt)}. The deal leaves the board on its own.`}
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-line-strong bg-ivory px-3.5 py-3" aria-live="polite">
          <p className="text-[11px] font-bold tracking-wider text-moss uppercase">Shoppers will see</p>
          <p className="mt-1" data-testid="preview">
            <DealLine item={draft.item.trim()} offer={draft.offer.trim()} className="text-[1.0625rem]" />
          </p>
          <p className="mt-0.5 text-sm text-moss">
            {vendor.name} · {vendor.stall} · until{" "}
            {/^\d{2}:\d{2}$/.test(draft.endTime) ? formatTime(MARKET, localTimeToEpoch(MARKET, draft.endTime)) : "—"}
          </p>
        </div>

        <button
          type="submit"
          disabled={!canPost}
          className="min-h-14 w-full rounded-xl bg-leaf text-lg font-semibold text-ivory shadow-sm transition hover:bg-leaf-dark active:scale-[.99] disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-moss"
        >
          Post deal
        </button>

        {posted && (
          <div role="status" className="animate-rise flex items-start gap-2.5 rounded-xl bg-leaf-soft px-3.5 py-3 text-sm text-leaf-dark" data-testid="post-success">
            <CheckIcon className="mt-0.5 shrink-0" />
            <p>
              <strong className="font-semibold">Posted.</strong> {posted.item} · {posted.offer} is on the board until {formatTime(MARKET, posted.endsAt)}.{" "}
              <a href={hrefFor("board")} className="font-semibold underline underline-offset-2">
                See the board
              </a>
            </p>
          </div>
        )}
      </form>

      <section aria-labelledby="mine-heading" className="space-y-3">
        <h2 id="mine-heading" className="font-display text-xl font-semibold">
          Your deals now
        </h2>
        {current.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-moss">No live deals. Nothing is shown to shoppers.</p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line bg-paper" data-testid="vendor-active">
            {current.map((d) => (
              <li key={d.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <DealLine item={d.item} offer={d.offer} />
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-moss">
                    <ClockIcon width={14} height={14} />
                    until {formatTime(MARKET, d.endsAt)} · {formatRemaining(now, d.endsAt)} left
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    markSoldOut(d.id);
                    toast(`${d.item} marked sold out and removed from the board`);
                  }}
                  className="min-h-11 shrink-0 rounded-xl border border-tomato px-3.5 text-sm font-semibold text-tomato transition hover:bg-tomato-soft active:bg-tomato-soft"
                >
                  Mark sold out
                </button>
              </li>
            ))}
          </ul>
        )}

        {earlier.length > 0 && (
          <>
            <h3 className="pt-2 text-sm font-semibold text-moss">Earlier today</h3>
            <ul className="overflow-hidden rounded-2xl border border-line" data-testid="vendor-earlier">
              {earlier.map((d) => {
                const status = dealStatus(d, now);
                return (
                  <li key={d.id} className="flex items-center gap-3 border-b border-line px-4 py-3 text-moss last:border-b-0">
                    <span className="min-w-0 flex-1 break-words">
                      {d.item} · {d.offer}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        status === "sold_out" ? "bg-tomato-soft text-tomato" : "bg-line text-moss"
                      }`}
                    >
                      {status === "sold_out" ? `Sold out ${formatTime(MARKET, d.soldOutAt!)}` : `Expired ${formatTime(MARKET, d.endsAt)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function Field(props: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  error?: string;
  disabled: boolean;
}) {
  const id = useId();
  const len = props.value.trim().length;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold">
          {props.label} <span className="text-tomato">*</span>
        </label>
        <span className={`text-xs tabular-nums ${len > props.max ? "font-semibold text-tomato" : "text-moss"}`} aria-hidden="true">
          {len}/{props.max}
        </span>
      </div>
      <input
        id={id}
        type="text"
        autoComplete="off"
        enterKeyHint="next"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        aria-invalid={!!props.error}
        aria-describedby={props.error ? `${id}-error` : undefined}
        className={`mt-1.5 min-h-12 w-full rounded-xl border bg-ivory px-3 text-base placeholder:text-moss/60 disabled:opacity-50 ${
          props.error ? "border-tomato" : "border-line-strong"
        }`}
      />
      {props.error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-tomato">
          {props.error}
        </p>
      )}
    </div>
  );
}
