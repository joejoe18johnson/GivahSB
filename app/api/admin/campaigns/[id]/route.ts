import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { updateCampaignText, updateCampaign } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PATCH - update campaign text (title, description, fullDescription). Admin only. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Server is not configured. Set Supabase env vars." },
      { status: 503 }
    );
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const adminEmails = getAdminEmails();
  const email = (user.email ?? "").toLowerCase();
  if (!adminEmails.includes(email)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id: campaignId } = await params;
  if (!campaignId || campaignId.length > 128) {
    return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const textUpdates: { title?: string; description?: string; fullDescription?: string } = {};
  const amountUpdates: { goal?: number; raised?: number } = {};
  const metaUpdates: { category?: string; isLittleWarriors?: boolean } = {};
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.title === "string") textUpdates.title = o.title;
    if (typeof o.description === "string") textUpdates.description = o.description;
    if (typeof o.fullDescription === "string") textUpdates.fullDescription = o.fullDescription;
    if (typeof o.category === "string" && o.category.trim().length > 0) metaUpdates.category = o.category.trim();
    if (typeof o.isLittleWarriors === "boolean") metaUpdates.isLittleWarriors = o.isLittleWarriors;
    const goalNum = typeof o.goal === "number" ? o.goal : (typeof o.goal === "string" ? Number(o.goal) : NaN);
    const raisedNum = typeof o.raised === "number" ? o.raised : (typeof o.raised === "string" ? Number(o.raised) : NaN);
    if (Number.isFinite(goalNum) && goalNum >= 0) amountUpdates.goal = goalNum;
    if (Number.isFinite(raisedNum) && raisedNum >= 0) amountUpdates.raised = raisedNum;
  }

  if (Object.keys(textUpdates).length === 0 && Object.keys(amountUpdates).length === 0 && Object.keys(metaUpdates).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of: title, description, fullDescription, goal, raised, category, isLittleWarriors." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin()!;
    if (Object.keys(textUpdates).length > 0) {
      await updateCampaignText(supabase, campaignId, textUpdates);
    }
    if (Object.keys(amountUpdates).length > 0 || Object.keys(metaUpdates).length > 0) {
      await updateCampaign(supabase, campaignId, { ...amountUpdates, ...metaUpdates });
    }
    return NextResponse.json({ ok: true, message: "Campaign updated." });
  } catch (err) {
    const rawMessage =
      err instanceof Error
        ? err.message
        : (typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : "Failed to update.");
    const message = /is_little_warriors/i.test(rawMessage)
      ? "Little Warriors status could not be saved because the database is missing the is_little_warriors column. Run migration 20260228000000_is_little_warriors.sql and try again."
      : rawMessage;
    const status = message === "Campaign not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
