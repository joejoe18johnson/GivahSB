import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { approveAndPublishCampaign } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST - approve under-review campaign and publish to live. Admin only. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = getAdminEmails();
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({})) as { underReviewId?: string };
  const underReviewId = typeof body.underReviewId === "string" ? body.underReviewId.trim() : "";
  if (!underReviewId) {
    return NextResponse.json({ error: "underReviewId required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin()!;
  const { campaignId } = await approveAndPublishCampaign(supabase, underReviewId);
  return NextResponse.json({ success: true, campaignId });
}
