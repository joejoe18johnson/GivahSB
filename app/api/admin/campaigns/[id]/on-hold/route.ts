import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { setCampaignOnHold } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PATCH - set campaign on hold or live. Admin only. */
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
  const { id: campaignId } = await params;
  if (!campaignId) return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
  const body = await request.json().catch(() => ({})) as { onHold?: boolean };
  const onHold = !!body.onHold;
  const supabase = getSupabaseAdmin()!;
  await setCampaignOnHold(supabase, campaignId, onHold);
  return NextResponse.json({ ok: true });
}
