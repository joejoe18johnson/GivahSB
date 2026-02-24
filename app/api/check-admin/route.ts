import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/check-admin
 * Returns { isAdmin: boolean }. Uses Supabase session (cookies or Bearer token).
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  const adminEmails = getAdminEmails();
  const isAdmin =
    adminEmails.length > 0 &&
    adminEmails.includes((user.email ?? "").toLowerCase());
  return NextResponse.json({ isAdmin }, { status: 200 });
}
