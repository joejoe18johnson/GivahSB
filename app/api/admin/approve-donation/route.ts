import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { approveDonation } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Server is not configured to approve donations.",
        hint: "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.",
      },
      { status: 503 }
    );
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) {
    return NextResponse.json(
      { error: "You must be signed in to approve donations." },
      { status: 401 }
    );
  }

  const adminEmails = getAdminEmails();
  const email = (user.email ?? "").toLowerCase();
  if (adminEmails.length === 0) {
    const hint =
      typeof process.env.VERCEL !== "undefined"
        ? "On Vercel: add ADMIN_EMAILS in Project Settings → Environment Variables (comma-separated), then redeploy."
        : "Add ADMIN_EMAILS=your@email.com to .env, then restart the dev server.";
    return NextResponse.json({ error: "No admin emails configured.", hint }, { status: 503 });
  }
  if (!adminEmails.includes(email)) {
    return NextResponse.json(
      {
        error: "Your account is not listed as an admin.",
        hint: `You're signed in as "${email}". Add this email to ADMIN_EMAILS in .env and restart.`,
      },
      { status: 403 }
    );
  }

  let body: { donationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const donationId = typeof body.donationId === "string" ? body.donationId.trim() : "";
  if (!donationId) {
    return NextResponse.json({ error: "donationId is required." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin()!;
    await approveDonation(supabase, donationId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve donation.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
