import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { DemoState } from "../types";
import type { ValidDraft } from "../lib/deals";
import { reducer } from "./reducer";
import { loadState, parseState, saveState, STORAGE_KEY } from "./persistence";

interface Store {
  state: DemoState;
  advance: (minutes: number) => void;
  reset: () => void;
  selectVendor: (vendorId: string) => void;
  postDeal: (vendorId: string, draft: ValidDraft) => string;
  markSoldOut: (dealId: string) => void;
}

const StoreContext = createContext<Store | null>(null);

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => saveState(state), [state]);

  // Keep several open tabs (e.g. a vendor phone and a shopper screen) in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = parseState(e.newValue);
      if (next) dispatch({ type: "replace", state: next });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const store = useMemo<Store>(
    () => ({
      state,
      advance: (minutes) => dispatch({ type: "advance", minutes }),
      reset: () => dispatch({ type: "reset" }),
      selectVendor: (vendorId) => dispatch({ type: "selectVendor", vendorId }),
      postDeal: (vendorId, draft) => {
        const id = newId();
        dispatch({ type: "postDeal", id, vendorId, draft });
        return id;
      },
      markSoldOut: (dealId) => dispatch({ type: "markSoldOut", dealId }),
    }),
    [state],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
