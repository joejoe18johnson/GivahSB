/**
 * POST /api/hearted — Toggle a campaign in the current user's hearted list.
 * Uses service role so the profile row is created/updated regardless of RLS.
 * Requires the user to be signed in (session from cookies).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getHeartedCampaignIds } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const campaignId = typeof body?.campaignId === "string" ? body.campaignId.trim() : null;
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration error", hint: "Add SUPABASE_SERVICE_ROLE_KEY to .env." },
        { status: 500 }
      );
    }

    const ids = await getHeartedCampaignIds(admin, user.id);
    const index = ids.indexOf(campaignId);
    const isHearted = index === -1;
    const newIds = isHearted ? [...ids, campaignId] : ids.filter((_, i) => i !== index);

    const { error } = await admin
      .from("profiles")
      .upsert(
        { id: user.id, hearted_campaigns: newIds, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Hearted API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ isHearted });
  } catch (err) {
    console.error("Hearted API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
