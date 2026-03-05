import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) return user;

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  const {
    data: { user: tokenUser },
  } = await supabase.auth.getUser(token);
  return tokenUser ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration error", hint: "Add SUPABASE_SERVICE_ROLE_KEY to .env." },
        { status: 500 }
      );
    }

    const userId = authUser.id;

    // 1. Delete profile row (removes stored personal data in the profiles table)
    const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
    if (profileError) {
      console.error("Account delete: error deleting profile row:", profileError);
    }

    // 2. Delete the auth user (removes ability to sign in again with this account)
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Account delete: error deleting auth user:", authError);
      return NextResponse.json({ error: "Failed to delete account. Please try again later." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Account delete API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

