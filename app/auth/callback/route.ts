import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AUTH_REDIRECT_COOKIE = "auth_redirect_path";

/**
 * Server-side OAuth callback. Exchanges the auth code for a session and redirects with
 * session cookies attached to the same response (avoids cookie loss and flaky Google sign-in).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=auth_callback", requestUrl.origin));
  }

  const redirectPath =
    request.cookies.get(AUTH_REDIRECT_COOKIE)?.value ||
    requestUrl.searchParams.get("next") ||
    "/my-campaigns";
  const initialPath = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  const target = new URL(initialPath, requestUrl.origin);
  const res = NextResponse.redirect(target);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(new URL("/auth/login?error=auth_callback", requestUrl.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth code exchange failed:", error.message);
      return NextResponse.redirect(new URL("/auth/login?error=auth_callback", requestUrl.origin));
    }

    // After we have a session, check if the user is fully verified.
    const userId = data?.session?.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone_verified, id_verified, address_verified")
        .eq("id", userId)
        .single();
      const fullyVerified = !!(
        profile &&
        (profile as { phone_verified?: boolean }).phone_verified &&
        (profile as { id_verified?: boolean }).id_verified &&
        (profile as { address_verified?: boolean }).address_verified
      );
      if (!fullyVerified) {
        const verifyTarget = new URL("/verification-center", requestUrl.origin);
        res.headers.set("Location", verifyTarget.toString());
      }
    }
  } catch (err) {
    console.error("Auth code exchange error:", err);
    return NextResponse.redirect(new URL("/auth/login?error=auth_callback", requestUrl.origin));
  }

  res.cookies.set(AUTH_REDIRECT_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
