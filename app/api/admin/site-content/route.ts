import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { setSiteContent } from "@/lib/supabase/database";
import { type SiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_CONTENT_KEYS: (keyof SiteContent)[] = [
  "siteName",
  "heroTitle",
  "heroSubtitle",
  "communityHeadingPart1",
  "communityHeadingPart2",
  "footerTagline",
  "footerCopyright",
  "aboutTitle",
  "aboutSubtitle",
  "aboutMission",
  "homeFaqs",
];

/** POST - update site content (admin only) */
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
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const adminEmails = getAdminEmails();
  const email = (user.email || "").toLowerCase();
  if (!adminEmails.includes(email)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    for (const key of SITE_CONTENT_KEYS) {
      const v = b[key];
      if (typeof v === "string") data[key] = v;
    }
    const homeFaqs = b.homeFaqs;
    if (Array.isArray(homeFaqs)) {
      data.homeFaqs = JSON.stringify(
        homeFaqs
          .filter((x): x is { q?: string; a?: string } => x != null && typeof x === "object")
          .map((x) => ({ q: typeof x.q === "string" ? x.q.trim() : "", a: typeof x.a === "string" ? x.a : "" }))
      );
    }
  }

  try {
    const supabase = getSupabaseAdmin()!;
    await setSiteContent(supabase, data);
    return NextResponse.json({ ok: true, message: "Site content saved." });
  } catch (err) {
    console.error("Error saving site content:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save." },
      { status: 500 }
    );
  }
}
