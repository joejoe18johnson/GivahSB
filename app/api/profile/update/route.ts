/**
 * POST /api/profile/update — Update the current user's profile.
 * Uses service role so the profile row is created/updated regardless of RLS.
 * User is identified by session (cookies) or Authorization: Bearer <access_token>.
 */

import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) return user;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
  return tokenUser ?? null;
}

const ALLOWED_KEYS = [
  "name",
  "phoneNumber",
  "phoneVerified",
  "phonePending",
  "profilePhoto",
  "idDocument",
  "idDocumentType",
  "idVerified",
  "idPending",
  "addressDocument",
  "addressVerified",
  "addressPending",
] as const;

const TO_DB: Record<string, string> = {
  phoneNumber: "phone_number",
  phoneVerified: "phone_verified",
  phonePending: "phone_pending",
  profilePhoto: "profile_photo",
  idDocument: "id_document",
  idDocumentType: "id_document_type",
  idVerified: "id_verified",
  idPending: "id_pending",
  addressDocument: "address_document",
  addressVerified: "address_verified",
  addressPending: "address_pending",
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration error", hint: "Add SUPABASE_SERVICE_ROLE_KEY to .env." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const updatedAt = new Date().toISOString();

    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    const row: Record<string, unknown> = {
      id: user.id,
      updated_at: updatedAt,
    };

    if (!existing) {
      row.name =
        (user.user_metadata?.name as string) ||
        (user.user_metadata?.full_name as string) ||
        user.email?.split("@")[0] ||
        "User";
      row.email = user.email ?? null;
    }

    for (const key of ALLOWED_KEYS) {
      if (body[key] === undefined) continue;
      const dbKey = TO_DB[key] ?? key;
      row[dbKey] = body[key];
    }

    const { error } = await admin.from("profiles").upsert(row, { onConflict: "id" });
    if (error) {
      console.error("Profile update API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile update API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
