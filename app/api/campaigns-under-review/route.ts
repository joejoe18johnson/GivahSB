import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { addCampaignUnderReview } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST - create campaign under review (authenticated user = creator). */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "You must be signed in to submit a campaign." }, { status: 401 });
  }
  let body: { title?: string; description?: string; fullDescription?: string; goal?: number; category?: string; creatorName?: string; image?: string; image2?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const fullDescription = typeof body.fullDescription === "string" ? body.fullDescription.trim() : description;
  const goal = Number(body.goal);
  const category = typeof body.category === "string" ? body.category.trim() : "Other";
  const creatorName = typeof body.creatorName === "string" ? body.creatorName.trim() : (user.user_metadata?.name as string) ?? "User";
  const image = typeof body.image === "string" ? body.image : "";
  const image2 = typeof body.image2 === "string" ? body.image2 : image;
  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }
  if (!Number.isFinite(goal) || goal <= 0) {
    return NextResponse.json({ error: "Goal must be a positive number." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin()!;
  const id = await addCampaignUnderReview(supabase, {
    title,
    description,
    fullDescription,
    goal,
    category,
    creatorName,
    creatorId: user.id,
    image: image || undefined,
    image2: image2 || undefined,
  });
  return NextResponse.json({ success: true, id });
}
