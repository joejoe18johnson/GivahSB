"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** Parse URL hash into key-value map (e.g. #access_token=x&type=recovery). */
function parseHash(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!hash || !hash.startsWith("#")) return out;
  hash
    .slice(1)
    .split("&")
    .forEach((part) => {
      const i = part.indexOf("=");
      if (i > 0) {
        const key = decodeURIComponent(part.slice(0, i));
        const value = decodeURIComponent(part.slice(i + 1));
        out[key] = value;
      }
    });
  return out;
}

/**
 * Handles the redirect from the "reset password" email link.
 * Supabase may send tokens as: (1) query token_hash&type=recovery, (2) query code= (PKCE),
 * or (3) hash #access_token=...&refresh_token=...&type=recovery. We handle all three.
 */
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"verifying" | "form" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 1) If link has code or token_hash in query, redirect immediately (before any Supabase client use) to avoid lock
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    if ((tokenHash && type === "recovery") || code) {
      if (typeof window !== "undefined") {
        window.location.replace(`/api/auth/reset-callback?${new URLSearchParams(window.location.search).toString()}`);
      }
      return;
    }

    const supabase = createClient();

    // Safety: if still verifying after 14s, show helpful error
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setStep((s) => {
        if (s !== "verifying") return s;
        setMessage(
          "Verification is taking too long. Open the link in a new private/incognito window (copy the full link from your email, including the part after # if present), or request a new reset link."
        );
        return "error";
      });
    }, 14000);

    async function tryHashRecovery(): Promise<boolean> {
      if (typeof window === "undefined") return false;
      const hash = window.location.hash || window.location.href.split("#")[1] || "";
      if (!hash) return false;
      const hashParams = parseHash("#" + hash.replace(/^#/, ""));
      const accessToken = hashParams.access_token;
      const refreshToken = hashParams.refresh_token;
      if (!accessToken || !refreshToken) return false;
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (cancelled || error) return false;
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setStep("form");
      return true;
    }

    async function run() {
      // 2) Tokens in URL hash — try immediately, then once after a short delay (hash can appear late in SPAs)
      const recovered = await tryHashRecovery();
      if (cancelled || recovered) return;
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      const recoveredDelayed = await tryHashRecovery();
      if (cancelled || recoveredDelayed) return;

      // 4) No params and no hash: either came from /api/auth/reset-callback (session in cookies) or direct visit.
      // Do NOT call getSession() — it competes with AuthContext and causes Navigator LockManager timeout.
      const errorParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("error") : null;
      if (errorParam === "invalid_code" || errorParam === "invalid_token") {
        setMessage("This link has expired or was already used. Please request a new password reset link.");
        setStep("error");
      } else if (errorParam === "server_error") {
        setMessage("Something went wrong on our side. Please request a new reset link and try again.");
        setStep("error");
      } else {
        setStep("form");
      }
    }

    run();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || step === "success") return;
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setMessage("");
    setIsSubmitting(true);
    let didSucceed = false;
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage((data.error as string) || "Failed to update password.");
        return;
      }
      didSucceed = true;
      setStep("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (!didSucceed) setIsSubmitting(false);
    }
  };

  // Auto-redirect to sign-in after success so user can't click Update password again
  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(() => {
      router.replace("/auth/login?reset=success");
    }, 2500);
    return () => clearTimeout(t);
  }, [step, router]);

  if (step === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your link…</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    const isTimeout = message.includes("Verification is taking too long");
    const isCantRead = message.includes("We couldn't read the reset link");
    const title = isTimeout
      ? "Verification timed out"
      : isCantRead
        ? "Reset link couldn't be used"
        : "Invalid or expired link";
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4">{title}</h1>
          <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
          <Link
            href="/auth/forgot-password"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
          >
            Request new reset link
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700">Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  const showSuccessDialog = step === "success";

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 mb-2">Set new password</h1>
            <p className="text-gray-600">Choose a secure password for your account.</p>
          </div>

          {message && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || step === "success"}
              className="w-full bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? "Updating…" : "Update password"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700">Back to sign in</Link>
          </p>
        </div>
      </div>

      {showSuccessDialog && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-dialog-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-200">
            <h2 id="success-dialog-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Password has been updated
            </h2>
            <p className="text-gray-600 mb-6">You can now sign in with your new password. Redirecting you shortly…</p>
            <Link
              href="/auth/login?reset=success"
              className="inline-block w-full py-3 px-6 bg-success-600 hover:bg-success-700 text-white font-medium rounded-full transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
