import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getPayoutRequestsForAdmin } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - list all payout requests (admin only). */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return NextResponse.json({ error: "No admin emails configured" }, { status: 503 });
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const supabase = getSupabaseAdmin()!;
    const list = await getPayoutRequestsForAdmin(supabase);
    return NextResponse.json(list);
  } catch (err) {
    console.error("Admin payouts list:", err);
    return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 });
  }
}
