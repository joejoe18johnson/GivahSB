import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getDonations } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - list donations for a campaign (public, for campaign page donors list). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([], { status: 200 });
  }
  const { id: campaignId } = await params;
  if (!campaignId) return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
  try {
    const supabase = getSupabaseAdmin()!;
    const list = await getDonations(supabase, campaignId);
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
