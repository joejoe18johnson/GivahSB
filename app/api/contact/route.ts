import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

/**
 * POST /api/contact
 * Submit a contact form message. No auth required. Saves to contact_messages.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > MAX_NAME) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!email || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!subject || subject.length > MAX_SUBJECT) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }
  if (!message || message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject,
      message,
    });
    if (error) {
      console.error("Contact message insert:", error.message, error.details);
      const isDev = process.env.NODE_ENV === "development";
      const message =
        isDev && error.message
          ? error.message
          : "Failed to send message. If this persists, the contact_messages table may not exist—run the Supabase migration 20260224100000_contact_messages.sql.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Contact submit:", err);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: isDev ? msg : "Failed to send message" },
      { status: 500 }
    );
  }
}
