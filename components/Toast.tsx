"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

type ToastContextValue = {
  show: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 2500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    timeoutRef.current = setTimeout(() => {
      setMessage(null);
      timeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]"
          style={{ animation: "toast-in 0.25s ease-out" }}
          role="status"
          aria-live="polite"
        >
          <div className="bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
