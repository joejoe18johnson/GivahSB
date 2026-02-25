import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getLiveCampaignsForUser, getPayoutStatusForCampaigns } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - current user's live campaigns (raised/backers + payout status from DB) */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json([], { status: 200 });
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) return NextResponse.json([], { status: 200 });
  const supabase = getSupabaseAdmin()!;
  const list = await getLiveCampaignsForUser(supabase, user.id);
  const campaignIds = list.map((c) => c.id);
  const payoutStatusByCampaign = await getPayoutStatusForCampaigns(supabase, campaignIds);
  const listWithPayout = list.map((c) => ({
    ...c,
    payoutStatus: payoutStatusByCampaign[c.id] ?? null,
  }));
  const res = NextResponse.json(listWithPayout);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
