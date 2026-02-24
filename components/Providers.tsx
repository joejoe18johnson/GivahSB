"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { HeartedProvider } from "@/components/HeartedCampaigns";
import { ThemedModalProvider } from "@/components/ThemedModal";
import { ToastProvider } from "@/components/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <HeartedProvider>
          <ThemedModalProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemedModalProvider>
        </HeartedProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
