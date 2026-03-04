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

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");

    // Safety: if still verifying after 14s, show helpful error
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setStep((s) => {
        if (s !== "verifying") return s;
        setMessage(
          "Verification is taking too long. Try opening this link in a private/incognito window, or request a new reset link."
        );
        return "error";
      });
    }, 14000);

    async function run() {
      // 1) Query params: token_hash + type=recovery
      if (tokenHash && type === "recovery") {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (cancelled) return;
          if (error) {
            setStep("error");
            setMessage(error.message || "This link has expired. Please request a new password reset.");
            return;
          }
          setStep("form");
        } catch (err) {
          if (cancelled) return;
          setStep("error");
          setMessage(err instanceof Error ? err.message : "Something went wrong.");
        }
        return;
      }

      // 2) Query params: code (PKCE)
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (error) {
            setStep("error");
            setMessage(error.message || "This link may have expired. Please request a new password reset.");
            return;
          }
          setStep("form");
        } catch (err) {
          if (cancelled) return;
          setStep("error");
          setMessage(err instanceof Error ? err.message : "Something went wrong.");
        }
        return;
      }

      // 3) Tokens in URL hash (#access_token=...&refresh_token=...&type=recovery)
      // Supabase often sends recovery links this way. setSession() avoids lock timeouts.
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = parseHash(window.location.hash);
        const accessToken = hashParams.access_token;
        const refreshToken = hashParams.refresh_token;
        const hashType = hashParams.type;
        if (hashType === "recovery" && accessToken && refreshToken) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (cancelled) return;
            if (error) {
              setStep("error");
              setMessage(error.message || "This link has expired. Please request a new password reset.");
              return;
            }
            // Clear hash from URL so refresh doesn't reprocess
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            setStep("form");
            return;
          } catch (err) {
            if (cancelled) return;
            setStep("error");
            setMessage(err instanceof Error ? err.message : "Something went wrong.");
            return;
          }
        }
      }

      setStep("error");
      setMessage("Invalid or expired reset link. Please request a new password reset from the sign-in page.");
    }

    run();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message || "Failed to update password.");
        return;
      }
      setStep("success");
      setTimeout(() => router.replace("/auth/login?reset=success"), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-4">
            {isTimeout ? "Verification timed out" : "Invalid or expired link"}
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>
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

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-4">Password updated</h1>
          <p className="text-gray-600 mb-6">You can now sign in with your new password. Redirecting…</p>
          <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">Set new password</h1>
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
            className="w-full bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
          >
            Update password
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/auth/login" className="text-primary-600 hover:text-primary-700">Back to sign in</Link>
        </p>
      </div>
    </div>
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
