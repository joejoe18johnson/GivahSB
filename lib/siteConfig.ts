/**
 * Canonical site URL and domain for the app (e.g. https://www.givahbz.com).
 * Set NEXT_PUBLIC_SITE_URL in .env for production; defaults to www.givahbz.com.
 */
const SITE_URL_RAW =
  typeof process.env.NEXT_PUBLIC_SITE_URL !== "undefined" &&
  process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "")
    : "https://www.givahbz.com";

/** Full site URL without trailing slash, e.g. https://www.givahbz.com */
export const SITE_URL = SITE_URL_RAW;

/** Display domain only, e.g. www.givahbz.com (for PDFs, print, labels) */
export function getSiteDomain(): string {
  try {
    const host = new URL(SITE_URL_RAW).host;
    return host || "www.givahbz.com";
  } catch {
    return "www.givahbz.com";
  }
}

/** Domain string for use in UI/PDF (www.givahbz.com) */
export const SITE_DOMAIN = getSiteDomain();
