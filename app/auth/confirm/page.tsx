"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const LOADING_TIMEOUT_MS = 8000;
const STUCK_MESSAGE = "This is taking longer than usual. Please open the link again from your email, or try signing in—if you already confirmed, you should get in.";

/** Parse URL hash into key-value map (e.g. #access_token=...&refresh_token=...) so confirmation works from any device. */
function parseHashParams(): Record<string, string> {
  if (typeof window === "undefined" || !window.location.hash) return {};
  const map: Record<string, string> = {};
  const hash = window.location.hash.slice(1);
  hash.split("&").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) map[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return map;
}

/**
 * Handles the redirect from the email verification link (sign up confirm email).
 * Supabase can send: token_hash + type (query), code (query, PKCE), or access_token + refresh_token (hash, works from any device).
 */
function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Single timeout set once on mount so the user is never stuck (effect cleanup below clears it when we're done).
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      setStatus((s) => {
        if (s !== "loading") return s;
        setMessage(STUCK_MESSAGE);
        return "error";
      });
    }, LOADING_TIMEOUT_MS);
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const verified = searchParams.get("verified");
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    const hashParams = typeof window !== "undefined" ? parseHashParams() : {};
    const accessToken = hashParams.access_token || searchParams.get("access_token");
    const refreshToken = hashParams.refresh_token || searchParams.get("refresh_token");

    const hasAnyParam = verified || errorParam || tokenHash || type || code || (accessToken && refreshToken);
    if (!hasAnyParam) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setStatus("error");
      setMessage("Missing confirmation data. Please use the link from your email (it works from any device).");
      return;
    }

    const supabase = createClient();

    (async () => {
      try {
        // Server already exchanged code and set session; just run success path.
        if (verified === "1") {
          let session: { user: { id: string } } | null = null;
          try {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 6000)
            );
            const result = await Promise.race([sessionPromise, timeoutPromise]);
            session = result?.data?.session ?? null;
          } catch {
            if (!cancelled) {
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
              setStatus("error");
              setMessage(STUCK_MESSAGE);
            }
            return;
          }
          if (cancelled) return;
          if (!session?.user?.id) {
            await new Promise((r) => setTimeout(r, 400));
            if (cancelled) return;
            const retry = await supabase.auth.getSession();
            session = retry.data.session as typeof session;
          }
          const userId = session?.user?.id;
          if (userId) {
            await supabase
              .from("profiles")
              .update({ email_verified: true, updated_at: new Date().toISOString() })
              .eq("id", userId);
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
            if (cancelled) return;
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
            setStatus("success");
            setTimeout(() => {
              if (cancelled) return;
              router.replace(fullyVerified ? "/my-campaigns" : "/verification-center");
            }, 1500);
          } else {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
            setStatus("error");
            setMessage("Session not found. Try signing in—if you already confirmed your email, you should get in.");
          }
          return;
        }

        // Server sent us here with an error (e.g. PKCE verifier not found).
        if (errorParam === "pkce") {
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          setStatus("error");
          setMessage(
            "This link was opened on a different device or browser. Please open the confirmation link on the same device where you signed up, or request a new confirmation email from the sign-in page."
          );
          return;
        }
        if (errorParam === "exchange" && messageParam) {
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          setStatus("error");
          setMessage(decodeURIComponent(messageParam));
          return;
        }
        if (errorParam) {
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          setStatus("error");
          setMessage("Confirmation failed. Please use the link from your email or try again.");
          return;
        }

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "recovery",
          });
          if (cancelled) return;
          if (error) {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
            setStatus("error");
            setMessage(error.message || "Invalid or expired link. Please request a new confirmation email.");
            return;
          }
        } else if (code) {
          const timeoutMs = 10000;
          const { error } = await Promise.race([
            supabase.auth.exchangeCodeForSession(code),
            new Promise<{ data: null; error: { message: string } }>((resolve) =>
              setTimeout(
                () => resolve({ data: null, error: { message: "Verification timed out. Please open the link again from your email." } }),
                timeoutMs
              )
            ),
          ]);
          if (cancelled) return;
          if (error) {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
            setStatus("error");
            const isPkceError = /PKCE|code verifier|verifier not found/i.test(error.message || "");
            setMessage(
              isPkceError
                ? "This link was opened on a different device or browser. Please open the confirmation link on the same device where you signed up, or request a new confirmation email from the sign-in page (forgot password / resend)."
                : error.message || "Invalid or expired link. Try signing up again or use the link in the same browser."
            );
            return;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (cancelled) return;
          if (error) {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
            setStatus("error");
            setMessage(error.message || "Invalid or expired link. Please use the link from your email.");
            return;
          }
          // Clear hash from URL so refresh doesn't re-use the token
          if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }

        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setStatus("success");
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({ email_verified: true, updated_at: new Date().toISOString() })
            .eq("id", userId);
          // Ignore updateErr if email_verified column doesn't exist yet (migration not run)
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
          setTimeout(() => {
            if (cancelled) return;
            router.replace(fullyVerified ? "/my-campaigns" : "/verification-center");
          }, 1500);
        } else {
          setTimeout(() => {
            if (cancelled) return;
            router.replace("/auth/login");
          }, 1500);
        }
      } catch (err) {
        if (cancelled) return;
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Something went wrong.");
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirming your email…</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4">Email confirmed</h1>
          <p className="text-gray-600 mb-6">Your account is ready. Redirecting you…</p>
          <Link href="/my-campaigns" className="text-primary-600 hover:text-primary-700 font-medium">
            Go to My Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4">Confirmation failed</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link
          href="/auth/signup"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
        >
          Try again
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          <Link href="/auth/login" className="text-primary-600 hover:text-primary-700">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
