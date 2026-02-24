import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getCampaigns } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/site-stats
 * Returns site-wide stats: total raised, campaign count, supporters (backers).
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { totalRaised: 0, campaignCount: 0, supporters: 0 },
      { status: 200 }
    );
  }
  try {
    const supabase = getSupabaseAdmin()!;
    const campaigns = await getCampaigns(supabase, { forStats: true });
    const totalRaised = campaigns.reduce((sum, c) => sum + (Number(c.raised) || 0), 0);
    const supporters = campaigns.reduce((sum, c) => sum + (Number(c.backers) || 0), 0);
    return NextResponse.json({
      totalRaised: Math.round(totalRaised * 100) / 100,
      campaignCount: campaigns.length,
      supporters,
    });
  } catch (e) {
    console.error("site-stats:", e);
    return NextResponse.json(
      { totalRaised: 0, campaignCount: 0, supporters: 0 },
      { status: 200 }
    );
  }
}
