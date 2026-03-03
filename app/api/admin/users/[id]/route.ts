import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  setUserPhoneVerified,
  setIdVerified,
  setAddressVerified,
  setUserStatus,
  deleteUserFromSupabase,
  addNotification,
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
    if (body.phoneVerified === true) {
      await addNotification(supabase, userId, {
        type: "verification_approved",
        title: "Phone number approved",
        body: "Your phone number has been verified and approved. You can now use it for campaign verification.",
        read: false,
      });
    }
  }
  if (typeof body.idVerified === "boolean") {
    await setIdVerified(supabase, userId, body.idVerified);
    if (body.idVerified === true) {
      await addNotification(supabase, userId, {
        type: "verification_approved",
        title: "Identity document approved",
        body: "Your identity document has been verified and approved. You can now use it for campaign verification.",
        read: false,
      });
    } else if (body.idVerified === false) {
      const reason = typeof body.idRejectionReason === "string" ? body.idRejectionReason.trim() : "";
      await addNotification(supabase, userId, {
        type: "verification_rejected",
        title: "Identity document not approved",
        body: reason
          ? `Your identity document could not be approved. Reason: ${reason} You can upload a new document from your Verification Center.`
          : "Your identity document could not be approved. You can upload a new document from your Verification Center.",
        read: false,
      });
    }
  }
  if (typeof body.addressVerified === "boolean") {
    await setAddressVerified(supabase, userId, body.addressVerified);
    if (body.addressVerified === true) {
      await addNotification(supabase, userId, {
        type: "verification_approved",
        title: "Address verified",
        body: "Your address document has been verified and approved. You can now use it for campaign verification.",
        read: false,
      });
    } else if (body.addressVerified === false) {
      const reason = typeof body.addressRejectionReason === "string" ? body.addressRejectionReason.trim() : "";
      await addNotification(supabase, userId, {
        type: "verification_rejected",
        title: "Address document not approved",
        body: reason
          ? `Your address document could not be approved. Reason: ${reason} You can upload a new document from your Verification Center.`
          : "Your address document could not be approved. You can upload a new document from your Verification Center.",
        read: false,
      });
    }
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
