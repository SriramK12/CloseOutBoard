import { MARKET } from "../data/demo";
import { marketPhase } from "../lib/deals";
import { hrefFor, type Route } from "../lib/router";
import { formatTime } from "../lib/time";
import { useStore } from "../state/store";
import { useToast } from "./Toast";

const VIEWS: { route: Route; label: string }[] = [
  { route: "board", label: "Board" },
  { route: "vendor", label: "Vendor" },
  { route: "manager", label: "Manager" },
];

export function DemoBar({ route }: { route: Route }) {
  const { state, advance, reset } = useStore();
  const toast = useToast();
  const closed = marketPhase(MARKET, state.now) === "closed";

  const btn =
    "min-h-9 rounded-lg border border-ivory/25 px-3 text-sm font-semibold text-ivory transition hover:bg-ivory/10 active:bg-ivory/20 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section aria-label="Demo controls" className="bg-forest-deep text-ivory">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <span className="rounded bg-honey px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-forest-deep uppercase">Demo</span>
        <span className="text-sm text-ivory/75">
          Simulated clock{" "}
          <time className="ml-0.5 font-semibold text-ivory tabular-nums" data-testid="demo-clock">
            {formatTime(MARKET, state.now)}
          </time>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" className={btn} disabled={closed} onClick={() => advance(5)}>
            +5 min
          </button>
          <button type="button" className={btn} disabled={closed} onClick={() => advance(15)}>
            +15 min
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              reset();
              toast("Demo reset to the original sample scenario");
            }}
          >
            Reset
          </button>
        </div>
        <nav aria-label="Demo views" className="flex w-full items-center gap-1 border-t border-ivory/10 pt-2 text-sm">
          <span className="mr-1 text-ivory/60">View:</span>
          {VIEWS.map((v) => (
            <a
              key={v.route}
              href={hrefFor(v.route)}
              aria-current={route === v.route ? "page" : undefined}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                route === v.route ? "bg-ivory text-forest-deep" : "text-ivory/80 hover:bg-ivory/10"
              }`}
            >
              {v.label}
            </a>
          ))}
          <span className="ml-auto hidden text-xs text-ivory/55 sm:inline">Time, market and vendors are simulated</span>
        </nav>
      </div>
    </section>
  );
}
