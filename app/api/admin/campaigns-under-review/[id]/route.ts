import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { updateCampaignUnderReviewStatus, deleteCampaignUnderReview, addNotification } from "@/lib/supabase/database";
import { sendCampaignRejectedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PATCH - set under-review status to rejected (or approved). Admin only. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = getAdminEmails();
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const body = await request.json().catch(() => ({})) as { status?: string };
  const status = body.status === "rejected" ? "rejected" : "approved";
  const supabase = getSupabaseAdmin()!;

  if (status === "rejected") {
    const { data: row } = await supabase
      .from("campaigns_under_review")
      .select("creator_id, title, creator_name")
      .eq("id", id)
      .single();
    const creatorId = (row as { creator_id?: string } | null)?.creator_id;
    const title = (row as { title?: string } | null)?.title ?? "Your campaign";
    const creatorName = (row as { creator_name?: string } | null)?.creator_name ?? "";
    if (creatorId) {
      await addNotification(supabase, creatorId, {
        type: "campaign_rejected",
        title: "Campaign rejected",
        body: `Your campaign "${title}" has been rejected and will not go live. You can submit a new campaign from My Campaigns if you wish.`,
        read: false,
      });
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", creatorId)
        .single();
      const creatorEmail = (profile as { email?: string } | null)?.email?.trim();
      if (creatorEmail) {
        sendCampaignRejectedEmail({
          to: creatorEmail,
          creatorName,
          campaignTitle: title,
        }).catch((e) => console.error("[campaigns-under-review] Rejected email failed:", e));
      }
    }
  }

  await updateCampaignUnderReviewStatus(supabase, id, status);
  return NextResponse.json({ ok: true });
}

/** DELETE - delete campaign under review. Admin or creator. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes((user.email ?? "").toLowerCase());
  if (!isAdmin) {
    const supabase = getSupabaseAdmin()!;
    const { data } = await supabase.from("campaigns_under_review").select("creator_id").eq("id", id).single();
    const row = data as { creator_id: string } | null;
    if (!row || row.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const supabase = getSupabaseAdmin()!;
  await deleteCampaignUnderReview(supabase, id);
  return NextResponse.json({ ok: true });
}
