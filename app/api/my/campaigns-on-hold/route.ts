import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getCampaignsOnHoldForUser } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - current user's campaigns on hold */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json([], { status: 200 });
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) return NextResponse.json([], { status: 200 });
  const supabase = getSupabaseAdmin()!;
  const list = await getCampaignsOnHoldForUser(supabase, user.id);
  return NextResponse.json(list);
}
