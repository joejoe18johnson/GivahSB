import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side email confirmation. Supabase redirects here with ?code= after the user
 * clicks the link. We exchange the code on the server so the PKCE code_verifier
 * cookie is available (same request that has the cookie). Then redirect to /auth/confirm
 * with session cookies set.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const confirmPage = new URL("/auth/confirm", requestUrl.origin);

  if (!code) {
    confirmPage.searchParams.set("error", "missing");
    return NextResponse.redirect(confirmPage);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    confirmPage.searchParams.set("error", "config");
    return NextResponse.redirect(confirmPage);
  }

  const cookieStore = await cookies();
  const res = NextResponse.redirect(confirmPage);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const isPkce = /PKCE|code verifier|verifier not found/i.test(error.message ?? "");
    confirmPage.searchParams.set("error", isPkce ? "pkce" : "exchange");
    confirmPage.searchParams.set("message", encodeURIComponent(error.message ?? ""));
    return NextResponse.redirect(confirmPage);
  }

  // Success: session cookies are already set on res. Redirect to confirm page with verified=1
  // so the client can show success and redirect to app (no need to exchange again).
  confirmPage.searchParams.set("verified", "1");
  return res;
}
