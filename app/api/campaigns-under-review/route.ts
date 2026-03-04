import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { addCampaignUnderReview, creatorHasCampaignWithTitle } from "@/lib/supabase/database";

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
  let body: { title?: string; description?: string; fullDescription?: string; goal?: number; category?: string; creatorName?: string; image?: string; image2?: string; daysLeft?: number };
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
  const daysLeft = body.daysLeft != null && Number.isFinite(Number(body.daysLeft)) ? Number(body.daysLeft) : 0;
  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }
  if (!Number.isFinite(goal) || goal <= 0) {
    return NextResponse.json({ error: "Goal must be a positive number." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin()!;

  // Require phone, ID, and address verification before submitting a campaign
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_verified, id_verified, address_verified, phone_number, id_document, address_document")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json(
      { error: "Your profile must be set up with verified phone, ID, and address before you can create a campaign. Complete these in your profile." },
      { status: 403 }
    );
  }
  if (!profile.phone_verified) {
    return NextResponse.json(
      { error: "Your phone number must be verified before you can create a campaign. Add and verify it in your profile." },
      { status: 403 }
    );
  }
  if (!profile.id_verified) {
    return NextResponse.json(
      { error: "Your ID document must be verified before you can create a campaign. Upload it in your profile and wait for approval." },
      { status: 403 }
    );
  }
  if (!profile.address_verified) {
    return NextResponse.json(
      { error: "Your address document must be verified before you can create a campaign. Upload it in your profile and wait for approval." },
      { status: 403 }
    );
  }

  const isDuplicate = await creatorHasCampaignWithTitle(supabase, user.id, title);
  if (isDuplicate) {
    return NextResponse.json(
      { error: "You already have a campaign or pending submission with this title. Please use a different title." },
      { status: 400 }
    );
  }

  try {
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
      daysLeft,
    });
    return NextResponse.json({ success: true, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    console.error("[campaigns-under-review] Insert failed:", msg);
    const isColumnError = /column .* does not exist|relation .* does not exist/i.test(msg);
    const safeMessage = isColumnError
      ? "Campaign could not be saved (database may need a migration). Please try again later or contact support."
      : msg.length <= 200
        ? msg
        : "Failed to save campaign. Please try again.";
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
