import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AUTH_REDIRECT_COOKIE = "auth_redirect_path";

/**
 * Server-side OAuth callback. Exchanges the auth code for a session (avoids client timeout).
 * Redirect URL is read from cookie auth_redirect_path, or default /my-campaigns.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=auth_callback", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth code exchange failed:", error.message);
      return NextResponse.redirect(new URL("/auth/login?error=auth_callback", requestUrl.origin));
    }
  } catch (err) {
    console.error("Auth code exchange error:", err);
    return NextResponse.redirect(new URL("/auth/login?error=auth_callback", requestUrl.origin));
  }

  // Redirect to stored path or default
  const redirectPath =
    request.cookies.get(AUTH_REDIRECT_COOKIE)?.value ||
    requestUrl.searchParams.get("next") ||
    "/my-campaigns";
  const path = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  const target = new URL(path, requestUrl.origin);

  const res = NextResponse.redirect(target);
  // Clear the redirect cookie
  res.cookies.set(AUTH_REDIRECT_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
