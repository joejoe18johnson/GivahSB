import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface UserPayout {
  id: string;
  campaignId: string;
  campaignTitle: string;
  raised: number;
  bankName: string;
  accountType: string;
  accountLast4: string;
  status: string;
  createdAt: string;
}

/** GET - payout requests for the current user (both pending and completed). */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json([], { status: 200 });

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) return NextResponse.json([], { status: 200 });

  const supabase = getSupabaseAdmin()!;

  const { data: pr, error: prErr } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (prErr) {
    console.error("User payouts GET error:", prErr);
    return NextResponse.json([], { status: 200 });
  }

  const payouts: UserPayout[] = [];

  for (const p of pr || []) {
    const { data: camp } = await supabase
      .from("campaigns")
      .select("title, raised")
      .eq("id", p.campaign_id)
      .single();

    const title = (camp as { title?: string } | null)?.title ?? "";
    const raised = Number((camp as { raised?: number } | null)?.raised ?? 0);
    const accountNumber = String(p.account_number ?? "");
    const accountLast4 = accountNumber ? accountNumber.slice(-4) : "";

    payouts.push({
      id: p.id,
      campaignId: p.campaign_id,
      campaignTitle: title,
      raised,
      bankName: p.bank_name,
      accountType: p.account_type,
      accountLast4,
      status: p.status,
      createdAt: p.created_at,
    });
  }

  const res = NextResponse.json(payouts);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

