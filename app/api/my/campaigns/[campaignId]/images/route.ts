import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { uploadCampaignImageServer } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST - upload a new image for an existing campaign owned by the current user. Returns { url }. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Server is not configured for uploads." },
      { status: 503 }
    );
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { campaignId } = await params;
  if (!campaignId || campaignId.length > 128) {
    return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const indexRaw = formData.get("index");
  const indexStr = indexRaw != null ? String(indexRaw) : "";

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const index = indexStr === "0" ? 0 : indexStr === "1" ? 1 : null;
  if (index !== 0 && index !== 1) {
    return NextResponse.json({ error: "index must be 0 or 1." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "File must be an image." },
      { status: 400 }
    );
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be under 10MB. Use smaller or more compressed images." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin()!;

    // Ensure this campaign belongs to the current user and is not stopped
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .select("id, creator_id, status")
      .eq("id", campaignId)
      .single();
    if (campErr || !campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }
    if ((campaign as { creator_id: string | null }).creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if ((campaign as { status?: string }).status === "stopped") {
      return NextResponse.json(
        { error: "This campaign has been fully funded and paid out. It can no longer be edited." },
        { status: 403 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadCampaignImageServer(
      supabase,
      campaignId,
      index as 0 | 1,
      buffer,
      file.name,
      file.type || "image/jpeg"
    );

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

