import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getPayoutRequestByCampaign, createPayoutRequest, getAdminUserIds, addNotification } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - campaign payout eligibility (creator, fully funded) and existing payout request if any */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;
  if (!campaignId) return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });

  const supabase = getSupabaseAdmin()!;
  const { data: row, error: campError } = await supabase
    .from("campaigns")
    .select("id, title, goal, raised, creator_id")
    .eq("id", campaignId)
    .single();

  if (campError || !row) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  const creatorId = (row as { creator_id: string | null }).creator_id;
  if (creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const goal = Number((row as { goal: number }).goal);
  const raised = Number((row as { raised: number }).raised);
  const eligible = goal > 0 && raised >= goal;
  const existing = await getPayoutRequestByCampaign(supabase, campaignId);

  const campaign = {
    id: (row as { id: string }).id,
    title: (row as { title: string }).title,
    goal,
    raised,
  };
  return NextResponse.json({
    campaign,
    eligible,
    payoutRequest: existing
      ? {
          id: existing.id,
          status: existing.status,
          bankName: existing.bank_name,
          accountHolderName: existing.account_holder_name,
          accountNumber: existing.account_number,
          accountType: existing.account_type,
          branch: existing.branch ?? undefined,
          createdAt: existing.created_at,
        }
      : null,
  });
}

/** POST - submit payout request (Belize bank details) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await params;
  if (!campaignId) return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });

  const supabase = getSupabaseAdmin()!;
  const { data: row, error: campError } = await supabase
    .from("campaigns")
    .select("id, title, goal, raised, creator_id")
    .eq("id", campaignId)
    .single();

  if (campError || !row) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  const creatorId = (row as { creator_id: string | null }).creator_id;
  if (creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const goal = Number((row as { goal: number }).goal);
  const raised = Number((row as { raised: number }).raised);
  if (!(goal > 0 && raised >= goal)) {
    return NextResponse.json({ error: "Campaign must be fully funded to request payout." }, { status: 400 });
  }

  const existing = await getPayoutRequestByCampaign(supabase, campaignId);
  if (existing) {
    return NextResponse.json({ error: "A payout request already exists for this campaign." }, { status: 400 });
  }

  let body: {
    bankName?: string;
    accountType?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branch?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bankName = typeof body.bankName === "string" ? body.bankName.trim() : "";
  const accountType = body.accountType === "savings" || body.accountType === "checking" ? body.accountType : "savings";
  const accountNumber = typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";
  const accountHolderName = typeof body.accountHolderName === "string" ? body.accountHolderName.trim() : "";
  const branch = typeof body.branch === "string" ? body.branch.trim() : undefined;

  if (!bankName || !accountNumber || !accountHolderName) {
    return NextResponse.json({ error: "Bank name, account number, and account holder name are required." }, { status: 400 });
  }

  try {
    const id = await createPayoutRequest(supabase, campaignId, user.id, {
      bankName,
      accountType,
      accountNumber,
      accountHolderName,
      branch,
    });
    const amountStr = `BZ$${Number((row as { raised: number }).raised).toLocaleString()}`;
    const titleForNotif = (row as { title?: string }).title ?? "Campaign";
    const adminEmails = getAdminEmails();
    if (adminEmails.length > 0) {
      try {
        const adminIds = await getAdminUserIds(supabase, adminEmails);
        for (const adminId of adminIds) {
          await addNotification(supabase, adminId, {
            type: "payout_request",
            title: "Payout requested",
            body: `Creator requested payout of ${amountStr} for "${titleForNotif}".`,
            campaignId,
            read: false,
          });
        }
      } catch (notifyErr) {
        console.error("[request-payout] Admin notification failed (payout was created):", notifyErr);
      }
    }
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[request-payout] POST error:", err);
    const msg =
      err instanceof Error
        ? err.message
        : typeof (err as { message?: string })?.message === "string"
          ? (err as { message: string }).message
          : "Failed to submit payout request.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
