import type { Metadata } from "next";
import { Funnel_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import LayoutChrome from "@/components/LayoutChrome";
const siteFont = Funnel_Display({ weight: ["300", "400", "700"], subsets: ["latin"] });

function getMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.givahbz.com";
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol);
  } catch {
    return new URL("https://www.givahbz.com");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "GivahBz - Supporting Communities in Need",
  description: "A Belizean crowdfunding platform helping organizations, charities, and individuals in need. Verified campaigns with proof of need.",
  icons: {
    icon: [
      { url: "/givah-icon.png", type: "image/png", sizes: "192x192" },
      { url: "/givah-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/givah-icon.png",
  },
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
          <LayoutChrome>{children}</LayoutChrome>
        </Providers>
      </body>
    </html>
  );
}
