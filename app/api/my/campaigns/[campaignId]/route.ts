import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PatchBody = {
  title?: string;
  description?: string;
  fullDescription?: string;
  category?: string;
  location?: string;
  image?: string;
  image2?: string;
};

/** GET - fetch a single campaign owned by the current user (for editing). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title, description, full_description, goal, category, location, image, image2, creator_id, created_at, days_left")
    .eq("id", campaignId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if ((data as { creator_id: string | null }).creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const campaign = {
    id: data.id as string,
    title: data.title as string,
    description: data.description as string,
    fullDescription: (data.full_description as string) ?? "",
    goal: Number(data.goal),
    category: data.category as string,
    location: (data.location as string) ?? "",
    image: (data.image as string) ?? "",
    image2: (data.image2 as string) ?? "",
    createdAt: data.created_at as string,
    daysLeft: (data.days_left as number) ?? 0,
  };

  const res = NextResponse.json({ campaign });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/** PATCH - update editable fields on a campaign owned by the current user (goal is NOT editable). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const row: Record<string, unknown> = {};
  if (typeof body.title === "string") row.title = body.title.trim();
  if (typeof body.description === "string") row.description = body.description.trim();
  if (typeof body.fullDescription === "string") row.full_description = body.fullDescription.trim();
  if (typeof body.category === "string") row.category = body.category.trim();
  if (typeof body.location === "string") row.location = body.location.trim();
  if (typeof body.image === "string") row.image = body.image.trim();
  if (typeof body.image2 === "string") row.image2 = body.image2.trim();

  if (Object.keys(row).length === 0) {
    return NextResponse.json(
      { error: "No editable fields provided. You can change title, descriptions, category, location, and images (goal cannot be changed)." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin()!;

  // Ensure the campaign belongs to this user
  const { data: existing, error: loadErr } = await supabase
    .from("campaigns")
    .select("id, creator_id")
    .eq("id", campaignId)
    .single();
  if (loadErr || !existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if ((existing as { creator_id: string | null }).creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: updateErr } = await supabase
    .from("campaigns")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message || "Failed to update campaign." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

