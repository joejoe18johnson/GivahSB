import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  getPayoutRequestById,
  updatePayoutRequestStatus,
  setCampaignStatusToStopped,
  addNotification,
} from "@/lib/supabase/database";
import { sendPayoutCompletedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST - mark payout as completed (admin only). Notifies creator in-app and by email. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(_request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = getAdminEmails();
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: payoutRequestId } = await params;
  if (!payoutRequestId) {
    return NextResponse.json({ error: "Missing payout request id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  const payout = await getPayoutRequestById(supabase, payoutRequestId);
  if (!payout) {
    return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
  }
  if (payout.status !== "pending") {
    return NextResponse.json(
      { error: "Payout is not pending (already completed or rejected)" },
      { status: 400 }
    );
  }

  try {
    await updatePayoutRequestStatus(supabase, payoutRequestId, "completed");
    await setCampaignStatusToStopped(supabase, payout.campaign_id);

    const { data: camp } = await supabase
      .from("campaigns")
      .select("title, raised")
      .eq("id", payout.campaign_id)
      .single();
    const amountStr = `BZ$${Number((camp as { raised?: number })?.raised ?? 0).toLocaleString()}`;
    const campaignTitle = (camp as { title?: string })?.title ?? "Campaign";

    await addNotification(supabase, payout.user_id, {
      type: "payout_completed",
      title: "Payout completed",
      body: `Your payout of ${amountStr} for "${campaignTitle}" has been completed.`,
      campaignId: payout.campaign_id,
      read: false,
    });

    const { data: prof } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", payout.user_id)
      .single();
    const creatorEmail = (prof as { email?: string })?.email;
    const creatorName = (prof as { name?: string })?.name ?? "";
    if (creatorEmail) {
      await sendPayoutCompletedEmail({
        to: creatorEmail,
        creatorName: creatorName,
        campaignTitle,
        amount: amountStr,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Complete payout:", err);
    return NextResponse.json({ error: "Failed to complete payout" }, { status: 500 });
  }
}
