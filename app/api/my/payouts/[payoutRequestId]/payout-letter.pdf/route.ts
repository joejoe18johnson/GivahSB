import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getPayoutRequestById } from "@/lib/supabase/database";
import { formatCurrency } from "@/lib/utils";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeFileName(s: string): string {
  const cleaned = (s || "payout-letter")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return cleaned || "payout-letter";
}

function buildCreatorPayoutLetterHtml(args: {
  campaignTitle: string;
  raised: number;
  payout: {
    bankName: string;
    accountType?: string;
    accountHolderName: string;
    accountNumber: string;
    branch?: string | null;
    status: string;
    createdAt: string;
  };
  logoDataUrl: string;
}): string {
  const amount = formatCurrency(args.raised);
  const createdDate = new Date(args.payout.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" });
  const maskedAccount = `****${String(args.payout.accountNumber).slice(-4)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Payout confirmation – ${escapeHtml(args.campaignTitle)}</title>
  <style>
    @page { size: letter; margin: 0.75in; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #111827;
      max-width: 8.5in;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo {
      height: 40px;
      width: auto;
    }
    .site-name {
      font-size: 14pt;
      font-weight: 700;
      color: #059669;
    }
    .tagline {
      font-size: 10pt;
      color: #4b5563;
    }
    .contact {
      text-align: right;
      font-size: 9pt;
      color: #4b5563;
    }
    .divider {
      border: 0;
      border-top: 2px solid #059669;
      margin: 0.25rem 0 1rem;
    }
    h1 { font-size: 16pt; margin-bottom: 0.5em; color: #111827; }
    .meta { margin: 1em 0; }
    .meta p { margin: 0.25em 0; }
    .amount { font-weight: 600; }
    .footer-note {
      margin-top: 1em;
      font-size: 9pt;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="brand">
      <img src="${args.logoDataUrl}" alt="GivahBz" class="logo" />
      <div>
        <div class="site-name">GivahBz</div>
        <div class="tagline">Sharing Burdens. Together.</div>
      </div>
    </div>
    <div class="contact">
      <div>givahbz.com</div>
      <div>Belmopan City, Belize</div>
    </div>
  </header>
  <hr class="divider" />
  <h1>Payout confirmation</h1>
  <div class="meta">
    <p><strong>Campaign:</strong> ${escapeHtml(args.campaignTitle)}</p>
    <p><strong>Amount paid out:</strong> <span class="amount">${escapeHtml(amount)}</span></p>
    <p><strong>Bank:</strong> ${escapeHtml(args.payout.bankName)}${args.payout.accountType ? " · " + escapeHtml(args.payout.accountType) : ""}</p>
    <p><strong>Account holder:</strong> ${escapeHtml(args.payout.accountHolderName)}</p>
    <p><strong>Account number:</strong> ${escapeHtml(maskedAccount)}${args.payout.branch ? " · Branch: " + escapeHtml(String(args.payout.branch)) : ""}</p>
    <p><strong>Status:</strong> ${escapeHtml(args.payout.status)}</p>
    <p><strong>Payout requested:</strong> ${escapeHtml(createdDate)}</p>
  </div>
  <p>Thank you for using GivahBz to raise funds for your cause. This letter confirms that the payout for your campaign has been processed to the bank account details you provided.</p>
  <p class="footer-note">Generated from your GivahBz account. Paper size: Letter (8.5&quot; × 11&quot;).</p>
</body>
</html>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ payoutRequestId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { payoutRequestId } = await params;
  if (!payoutRequestId) {
    return NextResponse.json({ error: "Payout request id required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  const payout = await getPayoutRequestById(supabase, payoutRequestId);
  if (!payout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (payout.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (payout.status !== "completed") {
    return NextResponse.json({ error: "Payout letter is available after payout is completed." }, { status: 400 });
  }

  const { data: camp } = await supabase
    .from("campaigns")
    .select("title, raised")
    .eq("id", payout.campaign_id)
    .single();

  const campaignTitle = (camp as { title?: string } | null)?.title ?? "Campaign";
  const raised = Number((camp as { raised?: number } | null)?.raised ?? 0);

  const logoPath = path.join(process.cwd(), "public", "givah-logo.png");
  const logoBase64 = Buffer.from(await fs.readFile(logoPath)).toString("base64");
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  const html = buildCreatorPayoutLetterHtml({
    campaignTitle,
    raised,
    payout: {
      bankName: payout.bank_name,
      accountType: payout.account_type,
      accountHolderName: payout.account_holder_name,
      accountNumber: payout.account_number,
      branch: payout.branch,
      status: payout.status,
      createdAt: payout.created_at,
    },
    logoDataUrl,
  });

  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
    });

    const fileName = `payout-letter-${safeFileName(campaignTitle)}.pdf`;
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } finally {
    await browser.close();
  }
}

