import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import MainWithPadding from "@/components/MainWithPadding";
import ConditionalFooter from "@/components/ConditionalFooter";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GivahBz - Supporting Communities in Need",
  description: "A Belizean crowdfunding platform helping organizations, charities, and individuals in need. Verified campaigns with proof of need.",
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
      <body className={`${outfit.className} bg-white`}>
        <Providers>
          <Header />
          <MainWithPadding>{children}</MainWithPadding>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
