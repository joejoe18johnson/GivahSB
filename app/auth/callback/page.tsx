"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_CALLBACK_URL_KEY = "auth_callback_url";
const EXCHANGE_TIMEOUT_MS = 15000;

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"exchanging" | "redirecting" | "error">("exchanging");
  const exchangeStarted = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next");

    if (!code) {
      window.location.replace("/auth/login?error=auth_callback");
      return;
    }

    // Run exchange only once (avoids double run from React Strict Mode or re-renders)
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;

    const supabase = createClient();
    let done = false;

    const redirectToNext = () => {
      if (done) return;
      done = true;
      setStatus("redirecting");
      const next =
        nextParam ||
        (typeof window !== "undefined" ? sessionStorage.getItem(AUTH_CALLBACK_URL_KEY) : null) ||
        "/";
      if (typeof window !== "undefined") sessionStorage.removeItem(AUTH_CALLBACK_URL_KEY);
      const path = next.startsWith("http") ? new URL(next).pathname : next.startsWith("/") ? next : `/${next}`;
      window.location.replace(path || "/");
    };

    const fail = () => {
      if (done) return;
      done = true;
      setStatus("error");
      setTimeout(() => {
        window.location.replace("/auth/login?error=auth_callback");
      }, 2000);
    };

    const timeoutId = setTimeout(() => {
      if (!done) {
        console.error("Auth code exchange timed out");
        fail();
      }
    }, EXCHANGE_TIMEOUT_MS);

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        clearTimeout(timeoutId);
        if (error) {
          console.error("Auth code exchange failed:", error);
          fail();
          return;
        }
        redirectToNext();
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Auth code exchange error:", err);
        fail();
      });
  }, [searchParams]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-600">Sign-in failed. Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Completing sign-in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
