import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getDonations } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - donations for a campaign; only allowed for the campaign creator. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  const { data: row, error: campError } = await supabase
    .from("campaigns")
    .select("id, title, goal, raised, creator_id")
    .eq("id", campaignId)
    .single();

  if (campError || !row) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  const creatorId = (row as { creator_id: string | null }).creator_id;
  if (creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const donations = await getDonations(supabase, campaignId);
  const campaign = {
    id: (row as { id: string }).id,
    title: (row as { title: string }).title,
    goal: Number((row as { goal: number }).goal),
    raised: Number((row as { raised: number }).raised),
  };
  const res = NextResponse.json({ campaign, donations });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
