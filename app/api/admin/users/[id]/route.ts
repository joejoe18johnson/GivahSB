import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  setUserPhoneVerified,
  setIdVerified,
  setAddressVerified,
  setUserStatus,
  deleteUserFromSupabase,
} from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PATCH - update user: status, phoneVerified, idVerified, addressVerified */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = getAdminEmails();
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const supabase = getSupabaseAdmin()!;
  if (typeof body.phoneVerified === "boolean") {
    await setUserPhoneVerified(supabase, userId, body.phoneVerified);
  }
  if (typeof body.idVerified === "boolean") {
    await setIdVerified(supabase, userId, body.idVerified);
  }
  if (typeof body.addressVerified === "boolean") {
    await setAddressVerified(supabase, userId, body.addressVerified);
  }
  if (body.status === "active" || body.status === "on_hold" || body.status === "deleted") {
    await setUserStatus(supabase, userId, body.status);
  }
  return NextResponse.json({ ok: true });
}

/** DELETE - delete user profile. Admin only. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = getAdminEmails();
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  const supabase = getSupabaseAdmin()!;
  await deleteUserFromSupabase(supabase, userId);
  return NextResponse.json({ ok: true });
}
