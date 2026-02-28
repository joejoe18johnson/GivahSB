"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

const AUTH_CALLBACK_URL_KEY = "auth_callback_url";
const EXCHANGE_TIMEOUT_MS = 45000;

function AuthCallbackContent() {
  const [status, setStatus] = useState<"exchanging" | "redirecting" | "error">("exchanging");
  const exchangeStarted = useRef(false);
  const codeRef = useRef<string | null>(null);

  const runExchange = useCallback(() => {
    const code = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("code") : null;
    if (!code) {
      window.location.replace("/auth/login?error=auth_callback");
      return;
    }
    codeRef.current = code;
    const supabase = createClient();
    let done = false;

    const redirectToNext = () => {
      if (done) return;
      done = true;
      setStatus("redirecting");
      const next =
        (typeof window !== "undefined" ? sessionStorage.getItem(AUTH_CALLBACK_URL_KEY) : null) || "/my-campaigns";
      if (typeof window !== "undefined") sessionStorage.removeItem(AUTH_CALLBACK_URL_KEY);
      const path = next.startsWith("http") ? new URL(next).pathname : next.startsWith("/") ? next : `/${next}`;
      const target = path || "/my-campaigns";
      // Brief delay so Supabase can persist session before full-page redirect
      setTimeout(() => window.location.replace(target), 150);
    };

    const fail = () => {
      if (done) return;
      done = true;
      setStatus("error");
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
        if (done) return;
        if (error) {
          console.error("Auth code exchange failed:", error);
          fail();
          return;
        }
        redirectToNext();
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (done) return;
        console.error("Auth code exchange error:", err);
        fail();
      });
  }, []);

  useEffect(() => {
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const code = params?.get("code") ?? null;
    if (!code) {
      window.location.replace("/auth/login?error=auth_callback");
      return;
    }
    runExchange();
  }, [runExchange]);

  const handleRetry = () => {
    setStatus("exchanging");
    exchangeStarted.current = false;
    runExchange();
  };

  const handleGoToLogin = () => {
    window.location.replace("/auth/login?error=auth_callback");
  };

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign-in could not be completed</h1>
          <p className="text-gray-600 mb-4">
            The sign-in link may have expired or the connection timed out. Go back to the sign-in page and choose &quot;Sign in with Google&quot; again to try with a fresh link.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full px-5 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Back to sign in
            </button>
            <button
              type="button"
              onClick={handleRetry}
              className="w-full px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              Try again with same link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-700 font-medium">Completing sign-in…</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
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
