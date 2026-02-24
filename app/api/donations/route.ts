import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { recordDonationAndUpdateCampaign, createDonation } from "@/lib/supabase/database";
import type { AdminDonation } from "@/lib/adminData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST - record a donation (and update campaign raised/backers). Auth optional for anonymous donors. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 503 }
    );
  }

  let body: {
    campaignId?: string;
    campaignTitle?: string;
    amount?: number;
    donorEmail?: string;
    donorName?: string;
    anonymous?: boolean;
    method?: string;
    status?: string;
    referenceNumber?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const campaignId = typeof body.campaignId === "string" ? body.campaignId.trim() : "";
  const amount = Number(body.amount);
  const donorEmail = typeof body.donorEmail === "string" ? body.donorEmail.trim() : "";
  const donorName = typeof body.donorName === "string" ? body.donorName.trim() : "Anonymous";
  const anonymous = !!body.anonymous;
  const method = (body.method === "bank" || body.method === "digiwallet" || body.method === "ekyash")
    ? body.method
    : "bank";
  const status = (body.status === "completed" || body.status === "pending") ? body.status : "pending";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 100) : undefined;
  const referenceNumber = typeof body.referenceNumber === "string" ? body.referenceNumber.trim() : undefined;
  const campaignTitle = typeof body.campaignTitle === "string" ? body.campaignTitle : "";

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number." }, { status: 400 });
  }

  const donation: Omit<AdminDonation, "id"> = {
    campaignId,
    campaignTitle,
    amount,
    donorEmail,
    donorName,
    anonymous,
    method,
    status,
    referenceNumber,
    note,
    createdAt: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseAdmin()!;
    let donationId: string;
    if (status === "pending") {
      donationId = await createDonation(supabase, donation);
    } else {
      donationId = await recordDonationAndUpdateCampaign(supabase, donation, campaignId);
    }
    return NextResponse.json({ success: true, donationId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record donation.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
