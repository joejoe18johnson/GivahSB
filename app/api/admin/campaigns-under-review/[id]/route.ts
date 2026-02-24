import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { updateCampaignUnderReviewStatus, deleteCampaignUnderReview } from "@/lib/supabase/database";

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
    if (!data || (data.creator_id as string) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const supabase = getSupabaseAdmin()!;
  await deleteCampaignUnderReview(supabase, id);
  return NextResponse.json({ ok: true });
}
