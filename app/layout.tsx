import type { Metadata } from "next";
import { Funnel_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import MainWithPadding from "@/components/MainWithPadding";
import ConditionalFooter from "@/components/ConditionalFooter";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieConsent from "@/components/CookieConsent";
const siteFont = Funnel_Display({ weight: ["300", "400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GivahBz - Supporting Communities in Need",
  description: "A Belizean crowdfunding platform helping organizations, charities, and individuals in need. Verified campaigns with proof of need.",
  icons: { icon: "/icon.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${siteFont.className} bg-white`}>
        <Providers>
          <Header />
          <MainWithPadding>{children}</MainWithPadding>
          <ConditionalFooter />
          <WhatsAppButton />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
