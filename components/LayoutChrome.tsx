"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import MainWithPadding from "@/components/MainWithPadding";
import ConditionalFooter from "@/components/ConditionalFooter";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieConsent from "@/components/CookieConsent";
import WelcomePopup from "@/components/WelcomePopup";
import VerifyAccountBanner from "@/components/VerifyAccountBanner";

/**
 * For /auth/* routes (reset-password, confirm, login, etc.) render only the page content
 * so the flow is a clean page with no header, footer, or popups.
 */
export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth") ?? false;

  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <MainWithPadding>
        <VerifyAccountBanner />
        {children}
      </MainWithPadding>
      <ConditionalFooter />
      <WhatsAppButton />
      <CookieConsent />
      <WelcomePopup />
    </>
  );
}
