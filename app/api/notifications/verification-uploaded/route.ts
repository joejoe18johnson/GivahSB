import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { addNotification } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LABELS: Record<string, { title: string; body: string }> = {
  phone: {
    title: "Phone number submitted",
    body: "Your phone number was uploaded and is under review. We'll notify you once it's verified.",
  },
  id: {
    title: "ID document submitted",
    body: "Your ID document was uploaded and is under review. We'll notify you once it's verified.",
  },
  address: {
    title: "Address document submitted",
    body: "Your address document was uploaded and is under review. We'll notify you once it's verified.",
  },
};

/** POST - create a notification when user uploads a verification item. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { type?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const type = typeof body?.type === "string" ? body.type : "";
  const labels = LABELS[type];
  if (!labels) {
    return NextResponse.json({ error: "Invalid type. Use phone, id, or address." }, { status: 400 });
  }
  try {
    const supabase = getSupabaseAdmin()!;
    await addNotification(supabase, user.id, {
      type: "verification_uploaded",
      title: labels.title,
      body: labels.body,
      read: false,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error creating verification notification:", err);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
