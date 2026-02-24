import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getSiteContent } from "@/lib/supabase/database";
import { mergeWithDefaults, type SiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/site-content
 * Returns editable site copy. Uses defaults when nothing stored.
 */
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(mergeWithDefaults(null), { status: 200 });
    }
    const supabase = getSupabaseAdmin()!;
    const raw = await getSiteContent(supabase);
    const content = mergeWithDefaults(raw as Partial<SiteContent> | null);
    return NextResponse.json(content);
  } catch {
    return NextResponse.json(mergeWithDefaults(null), { status: 200 });
  }
}
