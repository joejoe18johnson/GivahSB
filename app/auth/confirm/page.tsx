"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles the redirect from the email verification link (sign up confirm email).
 * Supabase can send token_hash + type=email (use verifyOtp) or code (PKCE).
 * After confirming, redirects to app.
 */
function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type"); // email | recovery
      const code = searchParams.get("code");

      const supabase = createClient();

      try {
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "recovery",
          });
          if (cancelled) return;
          if (error) {
            setStatus("error");
            setMessage(error.message || "Invalid or expired link. Please request a new confirmation email.");
            return;
          }
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (error) {
            setStatus("error");
            setMessage(error.message || "Invalid or expired link. Try signing up again or use the link in the same browser.");
            return;
          }
        } else {
          setStatus("error");
          setMessage("Missing confirmation data. Please use the link from your email.");
          return;
        }

        setStatus("success");
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
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
          <h1 className="text-2xl font-medium text-gray-900 mb-4">Email confirmed</h1>
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
        <h1 className="text-2xl font-medium text-gray-900 mb-4">Confirmation failed</h1>
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
