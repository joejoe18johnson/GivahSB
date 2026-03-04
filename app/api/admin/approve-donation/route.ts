import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { approveDonation } from "@/lib/supabase/database";
import { sendDonationReceivedEmail } from "@/lib/email";

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

    // Notify campaign creator by email (only after admin approval)
    const { data: don } = await supabase
      .from("donations")
      .select("campaign_id, amount, anonymous, donor_name")
      .eq("id", donationId)
      .single();
    if (don) {
      const camp = (await supabase
        .from("campaigns")
        .select("creator_id, title")
        .eq("id", (don as { campaign_id: string }).campaign_id)
        .single()).data as { creator_id?: string | null; title?: string } | null;
      const creatorId = camp?.creator_id ?? null;
      if (creatorId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", creatorId)
          .single();
        const creatorEmail = (profile as { email?: string } | null)?.email;
        if (creatorEmail) {
          await sendDonationReceivedEmail({
            to: creatorEmail,
            creatorName: (profile as { name?: string } | null)?.name ?? "there",
            campaignTitle: camp?.title ?? "your campaign",
            amount: Number((don as { amount: number }).amount),
            donorDisplay: (don as { anonymous?: boolean }).anonymous
              ? "Anonymous"
              : ((don as { donor_name?: string }).donor_name || "Anonymous").trim() || "Anonymous",
            status: "completed",
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve donation.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
