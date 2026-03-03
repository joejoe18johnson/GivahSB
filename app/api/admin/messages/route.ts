import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - list contact form messages (admin only), newest first. */
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
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, subject, message, read, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Admin messages list:", error);
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Admin messages:", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
