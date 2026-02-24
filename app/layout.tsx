import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import MainWithPadding from "@/components/MainWithPadding";
import ConditionalFooter from "@/components/ConditionalFooter";
import CreateCampaignFab from "@/components/CreateCampaignFab";

const lato = Lato({ weight: ["300", "400", "700"], subsets: ["latin"] });

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
      <body className={`${lato.className} bg-white`}>
        <Providers>
          <Header />
          <MainWithPadding>{children}</MainWithPadding>
          <ConditionalFooter />
          <CreateCampaignFab />
        </Providers>
      </body>
    </html>
  );
}
