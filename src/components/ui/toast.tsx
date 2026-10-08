"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type ToastFn = (message: string, tone?: Toast["tone"]) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback<ToastFn>((message, tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-3 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium shadow-[0_18px_40px_-12px_rgb(0_29_33/0.45)]",
              t.tone === "success" && "bg-ink text-cream",
              t.tone === "error" && "bg-cream text-danger ring-1 ring-danger/25",
              t.tone === "info" && "bg-cream text-ink ring-1 ring-ink/10",
            )}
          >
            <span
              aria-hidden
              className={cn("h-2.5 w-2.5 shrink-0 rounded-full", t.tone === "success" && "bg-lime", t.tone === "error" && "bg-danger", t.tone === "info" && "bg-ink/40")}
            />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
