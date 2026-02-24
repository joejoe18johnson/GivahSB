"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * If Supabase OAuth redirects to /?code=... instead of /auth/callback?code=...,
 * redirect to the callback route so the session can be exchanged.
 */
export default function OAuthRedirectHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || pathname !== "/") return;
    const next = searchParams.get("next") ?? "/";
    const params = new URLSearchParams({ code, next });
    window.location.replace(`/auth/callback?${params.toString()}`);
  }, [pathname, searchParams]);

  return null;
}
