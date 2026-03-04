const DEFAULT_SITE_URL = "https://www.givahbz.com";

function getSiteUrlRaw(): string {
  const raw =
    typeof process.env.NEXT_PUBLIC_SITE_URL !== "undefined" &&
    process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "")
      : DEFAULT_SITE_URL;
  return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
}

/** Full site URL without trailing slash, e.g. https://www.givahbz.com */
export const SITE_URL = getSiteUrlRaw();

/** Display domain only, e.g. www.givahbz.com (for PDFs, print, labels) */
export function getSiteDomain(): string {
  try {
    const host = new URL(SITE_URL).host;
    return host || "www.givahbz.com";
  } catch {
    return "www.givahbz.com";
  }
}

/** Domain string for use in UI/PDF (www.givahbz.com) */
export const SITE_DOMAIN = getSiteDomain();
