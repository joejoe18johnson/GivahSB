"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_CALLBACK_URL_KEY = "auth_callback_url";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"exchanging" | "redirecting" | "error">("exchanging");

  useEffect(() => {
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next");

    if (!code) {
      window.location.replace("/auth/login?error=auth_callback");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error("Auth code exchange failed:", error);
          setStatus("error");
          setTimeout(() => {
            window.location.replace("/auth/login?error=auth_callback");
          }, 2000);
          return;
        }
        setStatus("redirecting");
        const next =
          nextParam ||
          (typeof window !== "undefined" ? sessionStorage.getItem(AUTH_CALLBACK_URL_KEY) : null) ||
          "/";
        if (typeof window !== "undefined") sessionStorage.removeItem(AUTH_CALLBACK_URL_KEY);
        const path = next.startsWith("http") ? new URL(next).pathname : next.startsWith("/") ? next : `/${next}`;
        window.location.replace(path || "/");
      })
      .catch((err) => {
        console.error("Auth code exchange error:", err);
        setStatus("error");
        setTimeout(() => {
          window.location.replace("/auth/login?error=auth_callback");
        }, 2000);
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
