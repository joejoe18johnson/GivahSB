import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getCampaigns } from "@/lib/supabase/database";
import type { Campaign } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CAMPAIGNS_TIMEOUT_MS = 15000;

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

/**
 * GET /api/campaigns
 * Returns live campaigns from Supabase.
 * Query params: trending=true | category=... | limitCount=6 | onlyFullyFunded=true
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Supabase is not connected.",
        message:
          "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel (Settings → Environment Variables), then Redeploy.",
        fix: "https://vercel.com/docs/projects/environment-variables",
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const trending = searchParams.get("trending") === "true";
  const category = searchParams.get("category") ?? undefined;
  const limitParam = searchParams.get("limitCount");
  const limitCount = limitParam
    ? Math.min(100, parseInt(limitParam, 10) || 0)
    : undefined;
  const onlyFullyFunded = searchParams.get("onlyFullyFunded") === "true";

  const filters = {
    ...(trending && { trending: true }),
    ...(category && category !== "All" && { category }),
    ...(limitCount && limitCount > 0 && { limitCount }),
    ...(onlyFullyFunded && { onlyFullyFunded: true }),
  };

  try {
    const supabase = getSupabaseAdmin()!;
    const campaigns: Campaign[] = await withTimeout(
      getCampaigns(supabase, filters),
      CAMPAIGNS_TIMEOUT_MS,
      "Campaigns request timed out."
    );
    const response = NextResponse.json(campaigns);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("API campaigns:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to load campaigns.";
    return NextResponse.json(
      { error: msg, hint: "Ensure Supabase env vars are set and migration has been run." },
      { status: 503 }
    );
  }
}
