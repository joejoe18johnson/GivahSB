/**
 * POST /api/profile/delete — Permanently delete the current user's account.
 * Deletes the profile row and the Supabase Auth user so they cannot log in again.
 * Uses service role for profile + auth.admin.deleteUser.
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

    const userId = user.id;

    // 1. Delete profile row so all app data is removed
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Profile delete API error (profiles):", profileError);
      return NextResponse.json(
        { error: profileError.message || "Failed to delete profile" },
        { status: 500 }
      );
    }

    // 2. Delete the Auth user so they cannot sign in again
    const { error: authError } = await admin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Profile delete API error (auth):", authError);
      return NextResponse.json(
        { error: authError.message || "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile delete API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
