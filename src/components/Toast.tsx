import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckIcon } from "./icons";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string) => {
    setToast((t) => ({ id: (t?.id ?? 0) + 1, text: msg }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className="animate-rise flex max-w-md items-center gap-2 rounded-xl bg-forest-deep px-4 py-3 text-sm font-medium text-ivory shadow-lg"
          >
            <CheckIcon className="shrink-0 text-honey" />
            {toast.text}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
