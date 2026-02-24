"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

type AlertVariant = "success" | "error" | "info";
type ConfirmVariant = "primary" | "danger" | "success" | "warning";

const alertStyles: Record<AlertVariant, { icon: typeof CheckCircle2; border: string; iconBg: string; iconColor: string; title: string }> = {
  success: {
    icon: CheckCircle2,
    border: "border-verified-200",
    iconBg: "bg-verified-100",
    iconColor: "text-verified-600",
    title: "Success",
  },
  error: {
    icon: AlertTriangle,
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    title: "Notice",
  },
  info: {
    icon: Info,
    border: "border-primary-200",
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    title: "Information",
  },
};

const confirmStyles: Record<ConfirmVariant, { icon: typeof CheckCircle2; border: string; iconBg: string; iconColor: string; confirmBtn: string; confirmHover: string }> = {
  primary: {
    icon: Info,
    border: "border-primary-200",
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    confirmBtn: "bg-primary-600 text-white",
    confirmHover: "hover:bg-primary-700",
  },
  danger: {
    icon: AlertTriangle,
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    confirmBtn: "bg-red-600 text-white",
    confirmHover: "hover:bg-red-700",
  },
  success: {
    icon: CheckCircle2,
    border: "border-verified-200",
    iconBg: "bg-verified-100",
    iconColor: "text-verified-600",
    confirmBtn: "bg-verified-600 text-white",
    confirmHover: "hover:bg-verified-700",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    confirmBtn: "bg-amber-600 text-white",
    confirmHover: "hover:bg-amber-700",
  },
};

interface AlertState {
  open: boolean;
  title?: string;
  message: string;
  variant: AlertVariant;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmVariant;
}

interface ThemedModalContextValue {
  alert: (message: string, opts?: { title?: string; variant?: AlertVariant }) => void;
  confirm: (message: string, opts?: {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
  }) => Promise<boolean>;
}

const ThemedModalContext = createContext<ThemedModalContextValue | null>(null);

export function useThemedModal(): ThemedModalContextValue {
  const ctx = useContext(ThemedModalContext);
  if (!ctx) throw new Error("useThemedModal must be used within ThemedModalProvider");
  return ctx;
}

export function ThemedModalProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    variant: "info",
  });
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: "Confirm",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "primary",
  });

  const alert = useCallback((message: string, opts?: { title?: string; variant?: AlertVariant }) => {
    setAlertState({
      open: true,
      message,
      title: opts?.title,
      variant: opts?.variant ?? "info",
    });
  }, []);

  const confirm = useCallback(
    (message: string, opts?: { title?: string; confirmLabel?: string; cancelLabel?: string; variant?: ConfirmVariant }) =>
      new Promise<boolean>((resolve) => {
        confirmResolveRef.current = resolve;
        setConfirmState({
          open: true,
          title: opts?.title ?? "Confirm",
          message,
          confirmLabel: opts?.confirmLabel ?? "Confirm",
          cancelLabel: opts?.cancelLabel ?? "Cancel",
          variant: opts?.variant ?? "primary",
        });
      }),
    []
  );

  const closeAlert = useCallback(() => setAlertState((s) => ({ ...s, open: false })), []);
  const closeConfirm = useCallback((result: boolean) => {
    confirmResolveRef.current?.(result);
    confirmResolveRef.current = null;
    setConfirmState((s) => ({ ...s, open: false }));
  }, []);

  const alertStyle = alertStyles[alertState.variant];
  const AlertIcon = alertStyle.icon;
  const confirmStyle = confirmState.open ? confirmStyles[confirmState.variant] : null;
  const ConfirmIcon = confirmStyle?.icon ?? Info;

  return (
    <ThemedModalContext.Provider value={{ alert, confirm }}>
      {children}

      {/* Themed Alert Modal */}
      {alertState.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div
            className={`bg-white rounded-xl shadow-xl border ${alertStyle.border} max-w-md w-full overflow-hidden`}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="p-6 flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${alertStyle.iconBg} ${alertStyle.iconColor}`}>
                <AlertIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-lg font-semibold text-gray-900">
                  {alertState.title ?? alertStyle.title}
                </h3>
                <p className="mt-1 text-gray-600">{alertState.message}</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <button
                type="button"
                onClick={closeAlert}
                className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Themed Confirm Modal */}
      {confirmState.open && confirmStyle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div
            className={`bg-white rounded-xl shadow-xl border ${confirmStyle.border} max-w-md w-full overflow-hidden`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="p-6 flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${confirmStyle.iconBg} ${confirmStyle.iconColor}`}>
                <ConfirmIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 id="confirm-title" className="text-lg font-semibold text-gray-900">
                  {confirmState.title}
                </h3>
                <p className="mt-1 text-gray-600">{confirmState.message}</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${confirmStyle.confirmBtn} ${confirmStyle.confirmHover}`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ThemedModalContext.Provider>
  );
}
