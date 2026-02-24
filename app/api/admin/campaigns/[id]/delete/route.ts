import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { deleteCampaign } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** DELETE - delete campaign. Admin or campaign creator. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: campaignId } = await params;
  if (!campaignId) return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes((user.email ?? "").toLowerCase());
  if (!isAdmin) {
    const supabase = getSupabaseAdmin()!;
    const { data } = await supabase.from("campaigns").select("creator_id").eq("id", campaignId).single();
    if (!data || (data.creator_id as string) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const supabase = getSupabaseAdmin()!;
  await deleteCampaign(supabase, campaignId);
  return NextResponse.json({ ok: true });
}
