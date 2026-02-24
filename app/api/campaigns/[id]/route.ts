import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getCampaign } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/campaigns/[id] - single campaign */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not connected." },
      { status: 503 }
    );
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Campaign ID required." }, { status: 400 });
  }
  try {
    const supabase = getSupabaseAdmin()!;
    const campaign = await getCampaign(supabase, id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }
    return NextResponse.json(campaign);
  } catch (e) {
    console.error("GET /api/campaigns/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load campaign." },
      { status: 500 }
    );
  }
}
