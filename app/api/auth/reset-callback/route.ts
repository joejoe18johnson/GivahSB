import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side handler for the password reset link from the email.
 * Supabase redirects here with ?code=... (PKCE) or ?token_hash=...&type=recovery.
 * We exchange/verify on the server (no client lock), set session cookies, then redirect to the reset-password page.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  const baseUrl = SITE_URL.replace(/\/$/, "");
  const resetPageUrl = `${baseUrl}/auth/reset-password`;

  if (!code && !(tokenHash && type === "recovery")) {
    return NextResponse.redirect(`${resetPageUrl}?error=missing_params`);
  }

  try {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[reset-callback] exchangeCodeForSession:", error.message);
        return NextResponse.redirect(`${resetPageUrl}?error=invalid_code`);
      }
    } else if (tokenHash && type === "recovery") {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (error) {
        console.error("[reset-callback] verifyOtp:", error.message);
        return NextResponse.redirect(`${resetPageUrl}?error=invalid_token`);
      }
    }

    return NextResponse.redirect(resetPageUrl);
  } catch (err) {
    console.error("[reset-callback] error:", err);
    return NextResponse.redirect(`${resetPageUrl}?error=server_error`);
  }
}
