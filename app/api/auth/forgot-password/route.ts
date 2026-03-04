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
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const baseUrl = SITE_URL.replace(/\/$/, "");
    const redirectTo = `${baseUrl}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      const msg = error.message || "Failed to send reset email.";
      // Don't reveal whether the email exists; treat rate limit and other errors consistently
      if (error.message?.toLowerCase().includes("rate limit") || error.message?.toLowerCase().includes("too many")) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again in a few minutes." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: msg },
        { status: 400 }
      );
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
