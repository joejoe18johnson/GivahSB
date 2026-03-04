import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Request a password reset email. Uses server-side redirect URL so the link
 * in the email always points to the configured site (e.g. www.givahbz.com).
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Server is not configured for auth." },
      { status: 503 }
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    console.warn("[forgot-password] 400: Email is required.");
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const baseUrl = SITE_URL.replace(/\/$/, "");
    // Send user to server callback so we exchange code/token on server (avoids client lock timeout)
    const redirectTo = `${baseUrl}/api/auth/reset-callback`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      const raw = error.message || "";
      console.error("[forgot-password] 400 Supabase:", raw, "| redirectTo:", redirectTo);
      // Don't reveal whether the email exists; treat rate limit and other errors consistently
      if (raw.toLowerCase().includes("rate limit") || raw.toLowerCase().includes("too many")) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again in a few minutes." },
          { status: 429 }
        );
      }
      // Redirect URL not whitelisted in Supabase → show actionable message
      if (
        raw.toLowerCase().includes("redirect") ||
        raw.toLowerCase().includes("redirect_to") ||
        (raw.toLowerCase().includes("url") && raw.toLowerCase().includes("allow"))
      ) {
        return NextResponse.json(
          {
            error:
              "Password reset is misconfigured: the reset link URL is not allowed. Add " +
              redirectTo +
              " to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, then try again.",
          },
          { status: 400 }
        );
      }
      // Supabase couldn't send the email (SMTP not configured or failing, e.g. Resend)
      if (
        raw.toLowerCase().includes("recovery email") ||
        (raw.toLowerCase().includes("sending") && raw.toLowerCase().includes("email")) ||
        (raw.toLowerCase().includes("send") && raw.toLowerCase().includes("mail"))
      ) {
        return NextResponse.json(
          {
            error:
              "The reset email could not be sent. In Supabase Dashboard go to Project Settings → Auth → SMTP, enable Custom SMTP, and add your Resend credentials (see docs/SUPABASE_RESEND_SMTP.md in the repo).",
          },
          { status: 503 }
        );
      }
      // User-friendly message for other Supabase errors (e.g. invalid email format)
      const msg = raw || "Could not send reset email. Please check the email address and try again.";
      console.error("[forgot-password] 400 returning:", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
