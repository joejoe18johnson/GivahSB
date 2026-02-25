import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getLiveCampaignsForUser } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - current user's live campaigns (raised/backers from DB so they stay up to date) */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json([], { status: 200 });
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) return NextResponse.json([], { status: 200 });
  const supabase = getSupabaseAdmin()!;
  const list = await getLiveCampaignsForUser(supabase, user.id);
  const res = NextResponse.json(list);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
