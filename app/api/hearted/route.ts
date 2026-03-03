/**
 * POST /api/hearted — Toggle a campaign in the current user's hearted list.
 * Uses service role so the profile row is created/updated regardless of RLS.
 * User is identified by session (cookies) or Authorization: Bearer <access_token>.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getHeartedCampaignIds } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();
  if (user?.id) return user.id;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
  return tokenUser?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const name =
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "User";
    const email = user?.email ?? null;

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

    const ids = await getHeartedCampaignIds(admin, userId);
    const index = ids.indexOf(campaignId);
    const isHearted = index === -1;
    const newIds = isHearted ? [...ids, campaignId] : ids.filter((_, i) => i !== index);
    const updatedAt = new Date().toISOString();

    const { error } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          name,
          email,
          hearted_campaigns: newIds,
          updated_at: updatedAt,
        },
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
