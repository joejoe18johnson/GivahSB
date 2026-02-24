import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { adminCreateCampaign, type AdminCreateCampaignPayload } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Server is not configured for admin operations.",
        hint: "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.",
      },
      { status: 503 }
    );
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) {
    return NextResponse.json(
      { error: "You must be signed in to create a campaign." },
      { status: 401 }
    );
  }

  const adminEmails = getAdminEmails();
  const email = (user.email ?? "").toLowerCase();
  if (adminEmails.length > 0 && !adminEmails.includes(email)) {
    return NextResponse.json(
      { error: "Your account is not listed as an admin." },
      { status: 403 }
    );
  }
  if (adminEmails.length === 0) {
    return NextResponse.json(
      { error: "No admin emails configured. Set ADMIN_EMAILS in .env." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const fullDescription = typeof b.fullDescription === "string" ? b.fullDescription.trim() : undefined;
  const goal = typeof b.goal === "number" ? b.goal : Number(b.goal);
  const category = typeof b.category === "string" ? b.category.trim() : "Other";
  const image = typeof b.image === "string" ? b.image : "";
  const image2 = typeof b.image2 === "string" ? b.image2 : undefined;
  const location = typeof b.location === "string" ? b.location.trim() : undefined;
  const daysLeft = typeof b.daysLeft === "number" ? b.daysLeft : b.daysLeft != null ? Number(b.daysLeft) : undefined;
  const creatorType = b.creatorType === "individual" || b.creatorType === "organization" || b.creatorType === "charity" ? b.creatorType : undefined;
  const creatorName = typeof b.creatorName === "string" ? b.creatorName.trim() : (user.user_metadata?.name as string) ?? "Admin";
  const creatorId = typeof b.creatorId === "string" ? b.creatorId : user.id ?? null;

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 }
    );
  }
  if (!image) {
    return NextResponse.json(
      { error: "At least one image URL is required." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(goal) || goal <= 0) {
    return NextResponse.json(
      { error: "Goal must be a positive number." },
      { status: 400 }
    );
  }

  const payload: AdminCreateCampaignPayload = {
    title,
    description,
    fullDescription,
    goal,
    category,
    location,
    daysLeft,
    creatorType,
    image,
    image2,
    creatorName,
    creatorId,
  };

  try {
    const supabase = getSupabaseAdmin()!;
    const campaignId = await adminCreateCampaign(supabase, payload);
    return NextResponse.json({ success: true, campaignId });
  } catch (err) {
    console.error("Admin create campaign error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create campaign." },
      { status: 500 }
    );
  }
}
