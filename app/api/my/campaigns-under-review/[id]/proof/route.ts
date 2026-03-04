import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { updateCampaignUnderReviewProofUrls } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PUT - set proof-of-need document URLs for a campaign under review. Creator only. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }
  let body: { urls?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const urls = Array.isArray(body.urls)
    ? (body.urls as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  const supabase = getSupabaseAdmin()!;
  const { data: row, error: fetchErr } = await supabase
    .from("campaigns_under_review")
    .select("creator_id, status")
    .eq("id", id)
    .single();
  if (fetchErr || !row) {
    return NextResponse.json({ error: "Campaign under review not found." }, { status: 404 });
  }
  if ((row as { creator_id: string }).creator_id !== user.id) {
    return NextResponse.json({ error: "You can only set proof documents for your own submission." }, { status: 403 });
  }
  if ((row as { status: string }).status !== "pending") {
    return NextResponse.json({ error: "Cannot update proof documents after review." }, { status: 400 });
  }
  try {
    await updateCampaignUnderReviewProofUrls(supabase, id, urls);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed";
    console.error("[proof] updateCampaignUnderReviewProofUrls failed:", msg);
    const isColumnError = /column .* does not exist|relation .* does not exist/i.test(msg);
    const errorMessage = isColumnError
      ? "Proof documents could not be saved. The database may need the proof_document_urls migration. Contact support or try again later."
      : msg.length <= 200
        ? msg
        : "Proof documents could not be saved. Please try again.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
